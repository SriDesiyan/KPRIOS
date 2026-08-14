from app.agents.engines.dependency_analysis import (
    calculate_dependency_impact,
    compute_all_dependency_impacts,
)


def test_dependency_ablation_percentage_points():
    """
    Verifies leave-one-out dependency impact computation in percentage points (pp).
    """
    hypotheses = [
        {"id": "H1", "statement": "Primary Hypothesis", "prior_probability": 0.5},
        {"id": "H2", "statement": "Secondary Hypothesis", "prior_probability": 0.5},
    ]

    evidence_items = [
        {
            "id": "E1",
            "file_name": "critical_chat.txt",
            "modality": "CHAT_LOG",
            "source_fingerprint": "f1",
        },
        {
            "id": "E2",
            "file_name": "corroborating_photo.jpg",
            "modality": "IMAGE",
            "source_fingerprint": "f2",
        },
    ]

    graph = {
        "nodes": [{"id": "H1"}, {"id": "H2"}, {"id": "E1"}, {"id": "E2"}],
        "edges": [
            {
                "id": "edge1",
                "source": "E1",
                "target": "H1",
                "relationship_type": "supports",
                "source_ids": ["E1"],
            },
            {
                "id": "edge2",
                "source": "E2",
                "target": "H1",
                "relationship_type": "supports",
                "source_ids": ["E2"],
            },
        ],
    }

    # Ablate E1
    impact = calculate_dependency_impact(
        target_evidence_id="E1",
        target_hypothesis_id="H1",
        hypotheses=hypotheses,
        evidence_graph=graph,
        evidence_items=evidence_items,
    )

    assert impact["evidence_id"] == "E1"
    assert impact["hypothesis_id"] == "H1"
    assert impact["unit"] == "percentage_points"
    # When E1 is removed, support drops, so baseline belief > ablated belief
    assert impact["dependency_impact_pp"] > 0
    assert "pp" in impact["interpretation"]

    # Compute all impacts
    all_impacts = compute_all_dependency_impacts(
        target_hypothesis_id="H1",
        hypotheses=hypotheses,
        evidence_graph=graph,
        evidence_items=evidence_items,
    )
    assert len(all_impacts) == 2
    assert all_impacts[0]["dependency_impact_pp"] > 0
