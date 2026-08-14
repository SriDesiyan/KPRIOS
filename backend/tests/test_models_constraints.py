import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.models.fact import Fact, FactType
from app.models.hypothesis import Hypothesis, HypothesisStatus
from app.models.relationship import Relationship, RelationshipType


@pytest.mark.asyncio
async def test_fact_requires_non_empty_source_ids(db_session: AsyncSession):
    case = Case(
        case_number="TEST-CASE-CONSTRAINT-001",
        title="Source IDs Constraint Test",
        created_by_id="test-investigator-uuid-001",
    )
    db_session.add(case)
    await db_session.commit()

    # 1. Attempting to instantiate Fact with empty source_ids must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        Fact(
            case_id=case.id,
            statement="Fact with empty source_ids",
            fact_type=FactType.OBSERVATION,
            source_ids=[],
        )
    assert "source_ids must be a non-empty list" in str(exc_info.value)

    # 2. Attempting to instantiate Fact with None source_ids must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        Fact(
            case_id=case.id,
            statement="Fact with None source_ids",
            fact_type=FactType.OBSERVATION,
            source_ids=None,
        )
    assert "source_ids must be a non-empty list" in str(exc_info.value)

    # 3. Valid Fact with non-empty source_ids succeeds
    valid_fact = Fact(
        case_id=case.id,
        statement="Valid fact backed by evidence item 001",
        fact_type=FactType.OBSERVATION,
        source_ids=["evidence-uuid-001"],
    )
    db_session.add(valid_fact)
    await db_session.commit()
    assert valid_fact.id is not None
    assert valid_fact.source_ids == ["evidence-uuid-001"]


@pytest.mark.asyncio
async def test_relationship_requires_non_empty_source_ids(db_session: AsyncSession):
    # Empty source_ids on Relationship must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        Relationship(
            case_id="case-123",
            source_entity_id="entity-1",
            target_entity_id="entity-2",
            relationship_type=RelationshipType.SUPPORTS,
            source_ids=[],
        )
    assert "source_ids must be a non-empty list" in str(exc_info.value)


@pytest.mark.asyncio
async def test_hypothesis_requires_non_empty_source_ids(db_session: AsyncSession):
    # Empty source_ids on Hypothesis must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        Hypothesis(
            case_id="case-123",
            statement="Hypothesis statement",
            status=HypothesisStatus.PROPOSED,
            source_ids=[],
        )
    assert "source_ids must be a non-empty list" in str(exc_info.value)
