from app.models.entity import Entity, EntityType, ProposalStatus
from app.services.entity_resolution import (
    calculate_string_similarity,
    generate_candidate_merge_proposals,
)


def test_calculate_string_similarity():
    assert calculate_string_similarity("Rahul Sharma", "Rahul Sharma") == 1.0
    assert calculate_string_similarity("Rahul Sharma", "rahul sharma") == 1.0
    assert calculate_string_similarity("Rahul Sharma", "Rahul S") >= 0.60
    assert calculate_string_similarity("John Doe", "Alice Smith") < 0.20


def test_proposal_only_entity_resolution():
    e1 = Entity(
        id="ent-1",
        case_id="case-1",
        name="Rahul Sharma",
        entity_type=EntityType.PERSON,
        source_ids=["ev-1"],
        attributes={"alias": "Rahul"},
        is_merged=False,
    )
    e2 = Entity(
        id="ent-2",
        case_id="case-1",
        name="Rahul Sharma",
        entity_type=EntityType.PERSON,
        source_ids=["ev-2"],
        attributes={"alias": "Rahul"},
        is_merged=False,
    )
    e3 = Entity(
        id="ent-3",
        case_id="case-1",
        name="Vikram Menon",
        entity_type=EntityType.PERSON,
        source_ids=["ev-3"],
        attributes={},
        is_merged=False,
    )

    proposals = generate_candidate_merge_proposals([e1, e2, e3], threshold=0.75)

    # Should generate a proposal for e1 and e2
    assert len(proposals) == 1
    p = proposals[0]
    assert p["source_entity_id"] == "ent-1"
    assert p["target_entity_id"] == "ent-2"
    assert p["similarity_score"] == 1.0
    assert p["status"] == ProposalStatus.PENDING

    # Invariant check: Verify entities are NOT auto-merged
    assert e1.is_merged is False
    assert e2.is_merged is False
    assert e1.merged_into_id is None
