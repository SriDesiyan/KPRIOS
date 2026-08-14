from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.models.case import Case
from app.models.evidence import EvidenceItem
from app.models.fact import Fact
from app.models.user import User
from app.schemas.timeline import TimelineEvent, TimelineResponse

router = APIRouter(tags=["Timeline"])


@router.get(
    "/cases/{case_id}/timeline",
    response_model=TimelineResponse,
    summary="Get Case Chronological Forensic Timeline",
    description="Retrieves chronological timeline of extracted facts, EXIF timestamps, and evidence events.",
)
async def get_case_timeline(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> TimelineResponse:
    # 1. Verify case
    case_stmt = select(Case).where(Case.id == case_id)
    case_res = await db.execute(case_stmt)
    if not case_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with id '{case_id}' not found.",
        )

    # 2. Fetch facts with timestamps
    facts_stmt = (
        select(Fact).where(Fact.case_id == case_id).order_by(Fact.event_timestamp.asc().nullslast())
    )
    facts = (await db.execute(facts_stmt)).scalars().all()

    # 3. Fetch evidence items for filename mapping
    evidence_stmt = select(EvidenceItem).where(EvidenceItem.case_id == case_id)
    evidence_items = {e.id: e.file_name for e in (await db.execute(evidence_stmt)).scalars().all()}

    events: List[TimelineEvent] = []
    for f in facts:
        ts = f.event_timestamp or f.created_at
        first_src = f.source_ids[0] if f.source_ids else None
        ev_file_name = evidence_items.get(first_src) if first_src else None

        events.append(
            TimelineEvent(
                id=f.id,
                case_id=f.case_id,
                timestamp=ts,
                title=f"{f.fact_type.value if hasattr(f.fact_type, 'value') else f.fact_type} Event",
                description=f.statement,
                event_type=f.fact_type.value if hasattr(f.fact_type, "value") else str(f.fact_type),
                source_ids=f.source_ids or [],
                confidence=f.confidence,
                evidence_file_name=ev_file_name,
                attributes=f.attributes or {},
            )
        )

    # Sort events strictly by timestamp ascending
    events.sort(key=lambda x: x.timestamp)

    return TimelineResponse(
        case_id=case_id,
        total_events=len(events),
        events=events,
    )
