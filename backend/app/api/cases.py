from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user, require_role
from app.core.logging import logger
from app.models.case import Case
from app.models.entity import Entity
from app.models.evidence import EvidenceItem
from app.models.fact import Fact
from app.models.gap import GapEntry
from app.models.hypothesis import Hypothesis
from app.models.user import User, UserRole
from app.schemas.case import CaseCreate, CaseResponse

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Investigation Case",
)
async def create_case(
    case_in: CaseCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role([UserRole.INVESTIGATOR, UserRole.SUPERVISOR])),
) -> CaseResponse:
    # Check if case number exists
    stmt = select(Case).where(Case.case_number == case_in.case_number)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Case number '{case_in.case_number}' already exists.",
        )

    case = Case(
        case_number=case_in.case_number,
        title=case_in.title,
        description=case_in.description,
        status=case_in.status,
        created_by_id=current_user.id,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)

    logger.info(f"Created new case: {case.case_number} - {case.title} by {current_user.email}")
    return CaseResponse.model_validate(case)


@router.get(
    "",
    response_model=List[CaseResponse],
    summary="List Investigation Cases",
)
async def list_cases(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> List[CaseResponse]:
    stmt = select(Case).order_by(Case.created_at.desc())
    result = await db.execute(stmt)
    cases = result.scalars().all()

    response_list = []
    for c in cases:
        # Count related records
        ev_count = (
            await db.scalar(select(func.count(EvidenceItem.id)).where(EvidenceItem.case_id == c.id))
            or 0
        )
        ent_count = (
            await db.scalar(select(func.count(Entity.id)).where(Entity.case_id == c.id)) or 0
        )
        fact_count = await db.scalar(select(func.count(Fact.id)).where(Fact.case_id == c.id)) or 0
        hyp_count = (
            await db.scalar(select(func.count(Hypothesis.id)).where(Hypothesis.case_id == c.id))
            or 0
        )
        gap_count = (
            await db.scalar(select(func.count(GapEntry.id)).where(GapEntry.case_id == c.id)) or 0
        )

        res = CaseResponse.model_validate(c)
        res.evidence_count = ev_count
        res.entity_count = ent_count
        res.fact_count = fact_count
        res.hypothesis_count = hyp_count
        res.gap_count = gap_count
        response_list.append(res)

    return response_list


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Get Case Summary",
)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> CaseResponse:
    stmt = select(Case).where(Case.id == case_id)
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with id '{case_id}' not found.",
        )

    ev_count = (
        await db.scalar(select(func.count(EvidenceItem.id)).where(EvidenceItem.case_id == case.id))
        or 0
    )
    ent_count = await db.scalar(select(func.count(Entity.id)).where(Entity.case_id == case.id)) or 0
    fact_count = await db.scalar(select(func.count(Fact.id)).where(Fact.case_id == case.id)) or 0
    hyp_count = (
        await db.scalar(select(func.count(Hypothesis.id)).where(Hypothesis.case_id == case.id)) or 0
    )
    gap_count = (
        await db.scalar(select(func.count(GapEntry.id)).where(GapEntry.case_id == case.id)) or 0
    )

    res = CaseResponse.model_validate(case)
    res.evidence_count = ev_count
    res.entity_count = ent_count
    res.fact_count = fact_count
    res.hypothesis_count = hyp_count
    res.gap_count = gap_count
    return res
