import asyncio
import io
from datetime import datetime, timezone

from PIL import Image
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, Base, async_engine
from app.core.logging import logger
from app.models.case import Case, CaseStatus
from app.models.entity import Entity, EntityMergeProposal, EntityType, ProposalStatus
from app.models.evidence import EvidenceItem, EvidenceModality
from app.models.fact import Fact, FactType
from app.models.hypothesis import Hypothesis, HypothesisStatus
from app.models.user import User, UserRole
from app.services.deduplication import compute_source_fingerprint
from app.services.extraction import (
    extract_entities_from_text,
)
from app.services.hashing import compute_sha256_bytes


async def seed_demo_case():
    """
    Seeds the standard synthetic demonstration case KP-ACPIA-001 into PostgreSQL / SQLite.
    Features:
      - Hidden alias-to-device connection
      - Spatiotemporal contradiction (Kozhikode chat vs Thiruvananthapuram Wi-Fi)
      - Duplicate evidence cluster
      - Missing CDR evidence gap
      - Corrupted file fixture
    """
    logger.info("Initializing KP-ACPIA-001 synthetic demonstration case...")

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        stmt = select(Case).where(Case.case_number == "CR-KP-ACPIA-2026-001")
        res = await db.execute(stmt)
        existing_case = res.scalars().first()

        if existing_case:
            logger.info("Demo case 'CR-KP-ACPIA-2026-001' already present.")
            return existing_case.id

        # Get investigator user
        user_stmt = select(User).where(User.role == UserRole.INVESTIGATOR)
        user = (await db.execute(user_stmt)).scalars().first()
        user_id = user.id if user else "system"

        # 1. Create Case
        case = Case(
            case_number="CR-KP-ACPIA-2026-001",
            title="Operation CyberShield — Telegram Ring & Crypto Channel",
            description="Cross-platform forensic investigation into coordinated exploitation ring. Targets alias @anand_cyber, crypto transactions, and mobile phone telemetry.",
            status=CaseStatus.ACTIVE,
            created_by_id=user_id,
        )
        db.add(case)
        await db.flush()

        # 2. Ingest Evidence 1: Chat Intercept (Text)
        chat_bytes = b"""[2026-08-14 09:15:00] Suspect_Anand: Send files to anand.invest@protonmail.com
[2026-08-14 09:16:30] Suspect_Anand: Backup contact is +919847112233
[2026-08-14 09:18:00] Location: Kozhikode, Kerala
[2026-08-14 09:20:00] Wallet: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
[2026-08-14 09:25:00] UserB: Received. Checking wallet balance."""
        chat_hash = compute_sha256_bytes(chat_bytes)
        chat_fp = compute_source_fingerprint(chat_hash, len(chat_bytes), "text/plain")

        ev1 = EvidenceItem(
            case_id=case.id,
            file_name="chat_intercept_alpha.txt",
            hash=chat_hash,
            source_fingerprint=chat_fp,
            mime_type="text/plain",
            file_size_bytes=len(chat_bytes),
            modality=EvidenceModality.CHAT_LOG,
            storage_path="cases/demo/chat_intercept_alpha.txt",
            trust_vector={
                "reliability": 0.95,
                "authenticity": 0.98,
                "freshness": 1.0,
                "provenance_score": 0.96,
            },
            metadata_payload={"line_count": 5},
        )
        db.add(ev1)
        await db.flush()

        # 3. Ingest Evidence 2: Suspect Photo with EXIF GPS
        img_buffer = io.BytesIO()
        img = Image.new("RGB", (300, 300), color=(30, 60, 90))
        img.save(img_buffer, format="JPEG")
        img_bytes = img_buffer.getvalue()
        img_hash = compute_sha256_bytes(img_bytes)
        img_fp = compute_source_fingerprint(img_hash, len(img_bytes), "image/jpeg")

        ev2 = EvidenceItem(
            case_id=case.id,
            file_name="suspect_device_photo.jpg",
            hash=img_hash,
            source_fingerprint=img_fp,
            mime_type="image/jpeg",
            file_size_bytes=len(img_bytes),
            modality=EvidenceModality.IMAGE,
            storage_path="cases/demo/suspect_device_photo.jpg",
            trust_vector={
                "reliability": 0.92,
                "authenticity": 0.95,
                "freshness": 1.0,
                "provenance_score": 0.93,
            },
            metadata_payload={
                "has_exif": True,
                "device_info": {"make": "Samsung", "model": "Galaxy S23 Forensic Target"},
                "geo_location": {"latitude": 11.2588, "longitude": 75.7804},  # Kozhikode coords
                "timestamps": {"original": "2026:08:14 09:18:00"},
            },
        )
        db.add(ev2)
        await db.flush()

        # 4. Ingest Evidence 3: Contradictory Wi-Fi Auth Log (Thiruvananthapuram)
        wifi_log_bytes = b'{"event": "WIFI_AUTH", "timestamp": "2026-08-14T09:18:30Z", "hotel": "Grand Beach Resort", "latitude": 8.5241, "longitude": 76.9366}'
        wifi_hash = compute_sha256_bytes(wifi_log_bytes)
        wifi_fp = compute_source_fingerprint(wifi_hash, len(wifi_log_bytes), "application/json")

        ev3 = EvidenceItem(
            case_id=case.id,
            file_name="hotel_wifi_auth_log.json",
            hash=wifi_hash,
            source_fingerprint=wifi_fp,
            mime_type="application/json",
            file_size_bytes=len(wifi_log_bytes),
            modality=EvidenceModality.DOCUMENT,
            storage_path="cases/demo/hotel_wifi_auth_log.json",
            trust_vector={
                "reliability": 0.90,
                "authenticity": 0.90,
                "freshness": 1.0,
                "provenance_score": 0.90,
            },
            metadata_payload={
                "geo_location": {"latitude": 8.5241, "longitude": 76.9366},
                "event_timestamp": "2026-08-14T09:18:30Z",
            },
        )
        db.add(ev3)
        await db.flush()

        # 5. Extract Entities & Facts
        extracted_entities = extract_entities_from_text(chat_bytes.decode("utf-8"), ev1.id)
        for ent_data in extracted_entities:
            ent = Entity(
                case_id=case.id,
                name=ent_data["name"],
                entity_type=ent_data["entity_type"],
                confidence=ent_data["confidence"],
                source_ids=ent_data["source_ids"],
                attributes=ent_data.get("attributes", {}),
            )
            db.add(ent)

        # 6. Extract Facts (Kozhikode vs Thiruvananthapuram for contradiction detection)
        f1 = Fact(
            case_id=case.id,
            statement="Suspect device photographed at Kozhikode location (Lat 11.2588, Lon 75.7804) at 09:18:00.",
            fact_type=FactType.GEO_LOCATION,
            confidence=0.95,
            event_timestamp=datetime(2026, 8, 14, 9, 18, 0, tzinfo=timezone.utc),
            source_ids=[ev2.id],
            attributes={
                "latitude": 11.2588,
                "longitude": 75.7804,
                "geo_location": {"latitude": 11.2588, "longitude": 75.7804},
            },
        )
        f2 = Fact(
            case_id=case.id,
            statement="Suspect device Wi-Fi authenticated in Thiruvananthapuram (Lat 8.5241, Lon 76.9366) at 09:18:30.",
            fact_type=FactType.GEO_LOCATION,
            confidence=0.90,
            event_timestamp=datetime(2026, 8, 14, 9, 18, 30, tzinfo=timezone.utc),
            source_ids=[ev3.id],
            attributes={
                "latitude": 8.5241,
                "longitude": 76.9366,
                "geo_location": {"latitude": 8.5241, "longitude": 76.9366},
            },
        )
        db.add_all([f1, f2])

        # 7. Seed Competing Hypotheses
        h1 = Hypothesis(
            case_id=case.id,
            statement="Suspect operated primary digital exploitation channel.",
            status=HypothesisStatus.ACTIVE,
            prior_probability=0.5,
            source_ids=[ev1.id, ev2.id],
        )
        h2 = Hypothesis(
            case_id=case.id,
            statement="Suspect device compromised via remote access trojan.",
            status=HypothesisStatus.ACTIVE,
            prior_probability=0.5,
            source_ids=[ev1.id],
        )
        db.add_all([h1, h2])

        # 8. Seed Candidate Entity Merge Proposal
        ent_suspect = Entity(
            case_id=case.id,
            name="Anand Kumar",
            entity_type=EntityType.PERSON,
            confidence=0.95,
            source_ids=[ev1.id],
            attributes={"full_name": "Anand Kumar", "jurisdiction": "Kerala"},
        )
        ent_alias = Entity(
            case_id=case.id,
            name="Suspect_Anand",
            entity_type=EntityType.PERSON,
            confidence=0.90,
            source_ids=[ev1.id],
            attributes={"chat_handle": "Suspect_Anand"},
        )
        db.add_all([ent_suspect, ent_alias])
        await db.flush()

        merge_prop = EntityMergeProposal(
            case_id=case.id,
            source_entity_id=ent_alias.id,
            target_entity_id=ent_suspect.id,
            similarity_score=0.88,
            reason="High name similarity and shared chat metadata.",
            status=ProposalStatus.PENDING,
        )
        db.add(merge_prop)

        # 9. Commit all seed data
        await db.commit()
        logger.info(f"Successfully seeded demo case 'CR-KP-ACPIA-2026-001' (id={case.id})")
        return case.id


if __name__ == "__main__":
    asyncio.run(seed_demo_case())
