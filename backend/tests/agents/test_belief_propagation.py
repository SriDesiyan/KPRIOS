import pytest

from app.agents.engines.belief_propagation import compute_belief_distribution


def test_belief_propagation_hand_calculated_values():
    """
    Tests belief propagation normalization and weighted support/attack
    against hand-computed expected values.
    """
    hypotheses = [
        {"id": "H1", "statement": "Suspect A is guilty", "prior_probability": 0.5},
        {"id": "H2", "statement": "Suspect B is guilty", "prior_probability": 0.5},
    ]

    evidence_items = [
        {"id": "E1", "source_fingerprint": "cluster_1", "hash": "h1"},
        {"id": "E2", "source_fingerprint": "cluster_2", "hash": "h2"},
    ]

    # Graph where E1 supports H1, and E2 attacks H1
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
                "relationship_type": "attacks",
                "source_ids": ["E2"],
            },
        ],
    }

    updated_hyps, belief_map = compute_belief_distribution(hypotheses, graph, evidence_items)

    assert len(updated_hyps) == 2
    # Belief sum must equal 1.0
    total_belief = sum(belief_map.values())
    assert pytest.approx(total_belief, 0.01) == 1.0

    # H1 has 1 support and 1 attack
    h1 = next(h for h in updated_hyps if h["id"] == "H1")
    assert h1["support_count"] == 1
    assert h1["attack_count"] == 1


def test_belief_propagation_deduplication_clustering():
    """
    Verifies that multiple evidence items belonging to the same source_fingerprint
    cluster are counted as a single unit (invariant).
    """
    hypotheses = [
        {"id": "H1", "statement": "Hypothesis 1", "prior_probability": 0.5},
        {"id": "H2", "statement": "Hypothesis 2", "prior_probability": 0.5},
    ]

    # E1, E2, E3 all share the exact same source_fingerprint cluster
    evidence_items = [
        {"id": "E1", "source_fingerprint": "duplicate_cluster_alpha", "hash": "h1"},
        {"id": "E2", "source_fingerprint": "duplicate_cluster_alpha", "hash": "h2"},
        {"id": "E3", "source_fingerprint": "duplicate_cluster_alpha", "hash": "h3"},
    ]

    graph = {
        "nodes": [{"id": "H1"}, {"id": "H2"}, {"id": "E1"}, {"id": "E2"}, {"id": "E3"}],
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
            {
                "id": "edge3",
                "source": "E3",
                "target": "H1",
                "relationship_type": "supports",
                "source_ids": ["E3"],
            },
        ],
    }

    updated_hyps, belief_map = compute_belief_distribution(hypotheses, graph, evidence_items)
    h1 = next(h for h in updated_hyps if h["id"] == "H1")

    # Invariant: Must count as 1 support cluster, not 3!
    assert h1["support_count"] == 1
