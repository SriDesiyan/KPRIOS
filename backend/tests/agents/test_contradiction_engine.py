from app.agents.engines.contradiction_engine import detect_contradictions


def test_spatiotemporal_contradiction_detection():
    """
    Tests detection of spatiotemporally impossible location reports,
    automatic insertion of 'contradicts' edge, and marking hypotheses as CONTESTED.
    """
    facts = [
        {
            "id": "F1",
            "statement": "Suspect device connected to Wi-Fi at Kochi location.",
            "event_timestamp": "2026-08-14T10:00:00+00:00",
            "attributes": {"geo_location": {"latitude": 9.9312, "longitude": 76.2673}},
            "source_ids": ["E1"],
        },
        {
            "id": "F2",
            "statement": "Suspect device photographed at Thiruvananthapuram.",
            "event_timestamp": "2026-08-14T10:05:00+00:00",  # 5 minutes later, ~200km away
            "attributes": {"geo_location": {"latitude": 8.5241, "longitude": 76.9366}},
            "source_ids": ["E2"],
        },
    ]

    hypotheses = [
        {
            "id": "H1",
            "statement": "Suspect was sole physical operator.",
            "status": "ACTIVE",
            "source_ids": ["E1", "E2"],
        },
    ]

    graph = {"nodes": [{"id": "F1"}, {"id": "F2"}], "edges": []}

    contradictions, updated_graph, updated_hyps = detect_contradictions(facts, hypotheses, graph)

    assert len(contradictions) == 1
    assert contradictions[0]["conflict_type"] == "SPATIOTEMPORAL"
    assert "Spatiotemporal impossibility" in contradictions[0]["description"]

    # Invariant 1: contradicts edge inserted
    contradicts_edges = [
        e for e in updated_graph["edges"] if e.get("relationship_type") == "contradicts"
    ]
    assert len(contradicts_edges) == 1
    assert contradicts_edges[0]["source"] == "F1"
    assert contradicts_edges[0]["target"] == "F2"

    # Invariant 2: dependent hypothesis marked CONTESTED
    h1 = next(h for h in updated_hyps if h["id"] == "H1")
    assert h1["status"] == "CONTESTED"
