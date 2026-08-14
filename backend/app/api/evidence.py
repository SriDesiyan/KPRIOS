import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.core.logging import logger
from app.models.case import Case
from app.models.entity import Entity, EntityMergeProposal
from app.models.evidence import EvidenceItem, EvidenceModality
from app.models.fact import Fact
from app.models.user import User
from app.schemas.evidence import EvidenceItemResponse, IngestionResult
from app.services.deduplication import compute_source_fingerprint
from app.services.entity_resolution import generate_candidate_merge_proposals
from app.services.extraction import (
    extract_entities_from_text,
    extract_facts_from_content,
    extract_metadata,
    extract_ocr_text,
)
from app.services.hashing import compute_sha256_bytes, verify_file_integrity
from app.services.storage import store_evidence_file

router = APIRouter(tags=["Evidence"])


def detect_modality_from_mime(mime: str, filename: str) -> EvidenceModality:
    if mime.startswith("image/"):
        return EvidenceModality.IMAGE
    elif mime.startswith("video/"):
        return EvidenceModality.VIDEO
    elif mime.startswith("audio/"):
        return EvidenceModality.AUDIO
    elif "pdf" in mime or filename.endswith((".pdf", ".doc", ".docx")):
        return EvidenceModality.DOCUMENT
    elif "pcap" in filename or "wireshark" in filename or filename.endswith((".pcap", ".pcapng")):
        return EvidenceModality.NETWORK_PCAP
    elif "chat" in filename.lower() or filename.endswith((".chat", ".transcript")):
        return EvidenceModality.CHAT_LOG
    elif "call" in filename.lower() or "cdr" in filename.lower():
        return EvidenceModality.CALL_RECORD
    return EvidenceModality.DOCUMENT if mime.startswith("text/") else EvidenceModality.OTHER


@router.post(
    "/cases/{case_id}/evidence",
    response_model=IngestionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Ingest Evidence Artifact",
    description="Ingests evidence file, calculates SHA-256 hash, runs metadata/OCR/entity extraction, and updates graph state.",
)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    modality_override: Optional[str] = Form(None),
    reliability: float = Form(1.0),
    authenticity: float = Form(1.0),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> IngestionResult:
    # 1. Verify case exists
    stmt = select(Case).where(Case.id == case_id)
    case_res = await db.execute(stmt)
    case = case_res.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with id '{case_id}' not found.",
        )

    # 2. Read file bytes and compute SHA-256 hash
    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ingest empty file (0 bytes).",
        )

    content_hash = compute_sha256_bytes(file_bytes)
    evidence_id = str(uuid.uuid4())
    filename = file.filename or "unnamed_evidence"
    mime_type = file.content_type or "application/octet-stream"

    # Determine Modality
    modality = (
        EvidenceModality(modality_override)
        if modality_override and modality_override in EvidenceModality.__members__
        else detect_modality_from_mime(mime_type, filename)
    )

    # 3. Compute source fingerprint
    source_fingerprint = compute_source_fingerprint(
        content_hash=content_hash,
        file_size=len(file_bytes),
        mime_type=mime_type,
    )

    # 4. Write immutable storage
    storage_path = store_evidence_file(
        case_id=case_id,
        evidence_id=evidence_id,
        filename=filename,
        content=file_bytes,
    )

    # 5. Extract metadata & EXIF
    metadata = extract_metadata(file_bytes, filename, mime_type)

    # 6. Extract OCR transcript if applicable
    ocr_result = extract_ocr_text(file_bytes, mime_type)
    metadata["ocr"] = ocr_result

    # 7. Extract NLP Entities & Facts
    combined_text = ocr_result.get("text", "")
    if mime_type.startswith("text/") or filename.endswith((".txt", ".json", ".csv", ".log")):
        try:
            combined_text += "\n" + file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            pass

    extracted_entities_data = extract_entities_from_text(combined_text, evidence_id)
    extracted_facts_data = extract_facts_from_content(combined_text, metadata, evidence_id)

    # 8. Create EvidenceItem ORM instance
    evidence_item = EvidenceItem(
        id=evidence_id,
        case_id=case_id,
        hash=content_hash,
        source_fingerprint=source_fingerprint,
        modality=modality,
        file_name=filename,
        file_size_bytes=len(file_bytes),
        mime_type=mime_type,
        storage_path=storage_path,
        trust_vector={
            "reliability": max(0.0, min(1.0, reliability)),
            "authenticity": max(0.0, min(1.0, authenticity)),
            "freshness": 1.0,
            "provenance_score": 1.0,
        },
        metadata_payload=metadata,
        ingested_by_id=current_user.id,
    )
    db.add(evidence_item)

    # 9. Create Entities & Facts with mandatory source_ids
    created_entities: List[Entity] = []
    for ent_data in extracted_entities_data:
        ent = Entity(
            case_id=case_id,
            name=ent_data["name"],
            entity_type=ent_data["entity_type"],
            confidence=ent_data.get("confidence", 1.0),
            attributes=ent_data.get("attributes", {}),
            source_ids=[evidence_id],
        )
        db.add(ent)
        created_entities.append(ent)

    for fact_data in extracted_facts_data:
        fact = Fact(
            case_id=case_id,
            statement=fact_data["statement"],
            fact_type=fact_data["fact_type"],
            event_timestamp=fact_data.get("event_timestamp"),
            confidence=fact_data.get("confidence", 1.0),
            attributes=fact_data.get("attributes", {}),
            source_ids=[evidence_id],
        )
        db.add(fact)

    await db.commit()
    await db.refresh(evidence_item)

    # 10. Generate Proposal-Only Entity Resolution Candidates
    # Fetch all active entities for case
    all_entities_stmt = select(Entity).where(Entity.case_id == case_id, Entity.is_merged.is_(False))
    all_entities_res = await db.execute(all_entities_stmt)
    all_entities = list(all_entities_res.scalars().all())

    proposals_data = generate_candidate_merge_proposals(all_entities, threshold=0.70)
    for p_data in proposals_data:
        proposal = EntityMergeProposal(
            case_id=case_id,
            source_entity_id=p_data["source_entity_id"],
            target_entity_id=p_data["target_entity_id"],
            similarity_score=p_data["similarity_score"],
            reason=p_data["reason"],
            status=p_data["status"],
        )
        db.add(proposal)

    if proposals_data:
        await db.commit()

    logger.info(
        f"Ingested evidence {evidence_id} (hash={content_hash[:8]}), extracted {len(extracted_entities_data)} entities, {len(extracted_facts_data)} facts"
    )

    ev_resp = EvidenceItemResponse.model_validate(evidence_item)
    ev_resp.extracted_entities_count = len(extracted_entities_data)
    ev_resp.extracted_facts_count = len(extracted_facts_data)

    return IngestionResult(
        evidence_item=ev_resp,
        extracted_entities=extracted_entities_data,
        extracted_facts=extracted_facts_data,
    )


@router.get(
    "/cases/{case_id}/evidence",
    response_model=List[EvidenceItemResponse],
    summary="List Case Evidence Items",
)
async def list_case_evidence(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> List[EvidenceItemResponse]:
    stmt = (
        select(EvidenceItem)
        .where(EvidenceItem.case_id == case_id)
        .order_by(EvidenceItem.ingested_at.desc())
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    return [EvidenceItemResponse.model_validate(item) for item in items]


@router.get(
    "/evidence/{evidence_id}",
    response_model=EvidenceItemResponse,
    summary="Get Evidence Item Detail with Hash Audit",
)
async def get_evidence_detail(
    evidence_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> EvidenceItemResponse:
    stmt = select(EvidenceItem).where(EvidenceItem.id == evidence_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence item with id '{evidence_id}' not found.",
        )

    # Invariant: Verify file integrity on disk against recorded SHA-256 hash
    is_valid = verify_file_integrity(item.storage_path, item.hash)
    if not is_valid:
        logger.error(
            f"INTEGRITY VIOLATION: Evidence file {item.id} failed SHA-256 verification on disk!"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Forensic integrity violation: Evidence file SHA-256 on disk does not match recorded hash.",
        )

    return EvidenceItemResponse.model_validate(item)


@router.get(
    "/evidence/{evidence_id}/download",
    summary="Download Immutable Evidence Raw File",
)
async def download_evidence_file(
    evidence_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(EvidenceItem).where(EvidenceItem.id == evidence_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item or not os.path.exists(item.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence file for id '{evidence_id}' not found on disk.",
        )

    return FileResponse(
        path=item.storage_path,
        filename=item.file_name,
        media_type=item.mime_type,
    )
