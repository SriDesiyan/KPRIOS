from app.models.entity import Entity, EntityType
from app.models.evidence import EvidenceItem, EvidenceModality
from app.models.fact import Fact, FactType
from app.models.hypothesis import Hypothesis, HypothesisStatus
from app.models.relationship import Relationship, RelationshipType
from app.services.evidence_graph import EvidenceGraphEngine


def test_evidence_graph_construction_and_serialization():
    case_id = "case-graph-test-001"
    ev1 = EvidenceItem(
        id="ev-1",
        case_id=case_id,
        hash="a" * 64,
        source_fingerprint="fp1",
        modality=EvidenceModality.IMAGE,
        file_name="suspect_device_photo.jpg",
        file_size_bytes=1024,
        mime_type="image/jpeg",
        storage_path="/tmp/photo.jpg",
        trust_vector={},
        metadata_payload={},
    )
    ent1 = Entity(
        id="ent-1",
        case_id=case_id,
        name="Suspect Device iPhone",
        entity_type=EntityType.DEVICE,
        source_ids=["ev-1"],
        attributes={},
        is_merged=False,
    )
    ent2 = Entity(
        id="ent-2",
        case_id=case_id,
        name="Target Location",
        entity_type=EntityType.LOCATION,
        source_ids=["ev-1"],
        attributes={},
        is_merged=False,
    )
    rel1 = Relationship(
        id="rel-1",
        case_id=case_id,
        source_entity_id="ent-1",
        target_entity_id="ent-2",
        relationship_type=RelationshipType.ASSOCIATED_WITH,
        source_ids=["ev-1"],
    )
    fact1 = Fact(
        id="fact-1",
        case_id=case_id,
        statement="Device connected to local Wi-Fi router",
        fact_type=FactType.OBSERVATION,
        source_ids=["ev-1"],
    )
    hyp1 = Hypothesis(
        id="hyp-1",
        case_id=case_id,
        statement="Device was present at scene",
        status=HypothesisStatus.ACTIVE,
        prior_probability=0.7,
        source_ids=["ev-1"],
    )

    engine = EvidenceGraphEngine(case_id=case_id)
    g = engine.populate(
        evidence_items=[ev1],
        entities=[ent1, ent2],
        facts=[fact1],
        relationships=[rel1],
        hypotheses=[hyp1],
    )

    # Check node count: 1 evidence + 2 entities + 1 fact + 1 hypothesis = 5 nodes
    assert g.number_of_nodes() == 5

    # Check edges: 3 derivation edges (ev1->ent1, ev1->ent2, ev1->fact1) + 1 explicit rel (ent1->ent2) = 4 edges
    assert g.number_of_edges() == 4

    # Serialize
    serialized = engine.serialize(evidence_items=[ev1])
    assert serialized["case_id"] == case_id
    assert serialized["node_count"] == 5
    assert serialized["edge_count"] == 4
    assert len(serialized["nodes"]) == 5
    assert len(serialized["edges"]) == 4
