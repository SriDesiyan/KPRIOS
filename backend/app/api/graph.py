from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.models.case import Case
from app.models.entity import Entity
from app.models.evidence import EvidenceItem
from app.models.fact import Fact
from app.models.hypothesis import Hypothesis
from app.models.relationship import Relationship
from app.models.user import User
from app.schemas.graph import EvidenceGraphResponse
from app.services.evidence_graph import EvidenceGraphEngine

router = APIRouter(tags=["Graph"])


@router.get(
    "/cases/{case_id}/graph",
    response_model=EvidenceGraphResponse,
    summary="Get Rehydrated NetworkX Evidence Graph",
    description="Loads case entities, facts, hypotheses, and relationships into NetworkX memory and serializes graph.",
)
async def get_case_evidence_graph(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> EvidenceGraphResponse:
    # 1. Verify case exists
    case_stmt = select(Case).where(Case.id == case_id)
    case_res = await db.execute(case_stmt)
    if not case_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with id '{case_id}' not found.",
        )

    # 2. Fetch all case nodes & edges
    evidence_items = list(
        (await db.execute(select(EvidenceItem).where(EvidenceItem.case_id == case_id)))
        .scalars()
        .all()
    )
    entities = list(
        (
            await db.execute(
                select(Entity).where(Entity.case_id == case_id, Entity.is_merged.is_(False))
            )
        )
        .scalars()
        .all()
    )
    facts = list((await db.execute(select(Fact).where(Fact.case_id == case_id))).scalars().all())
    relationships = list(
        (await db.execute(select(Relationship).where(Relationship.case_id == case_id)))
        .scalars()
        .all()
    )
    hypotheses = list(
        (await db.execute(select(Hypothesis).where(Hypothesis.case_id == case_id))).scalars().all()
    )

    # 3. Build in-memory NetworkX Graph
    engine = EvidenceGraphEngine(case_id=case_id)
    engine.populate(
        evidence_items=evidence_items,
        entities=entities,
        facts=facts,
        relationships=relationships,
        hypotheses=hypotheses,
    )

    serialized_data = engine.serialize(evidence_items=evidence_items)
    return EvidenceGraphResponse(**serialized_data)
