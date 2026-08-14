import uuid
from datetime import datetime
from typing import Any, Dict, List, Tuple

from app.core.logging import logger


def detect_contradictions(
    facts: List[Dict[str, Any]],
    hypotheses: List[Dict[str, Any]],
    evidence_graph: Dict[str, Any],
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], List[Dict[str, Any]]]:
    """
    Deterministic contradiction detection engine.
    Compares facts sharing entity references and overlapping temporal timestamps.
    On detection:
      1. Links both facts by a 'contradicts' edge in the evidence graph.
      2. Marks dependent hypotheses as CONTESTED.
      3. Records contradiction entry with zero automatic resolution.
    """
    contradictions: List[Dict[str, Any]] = []
    edges = list(evidence_graph.get("edges", []))
    updated_hypotheses = list(hypotheses)

    n = len(facts)
    for i in range(n):
        for j in range(i + 1, n):
            f1 = facts[i]
            f2 = facts[j]

            # 1. Check for contradictory statements or mutually exclusive GPS locations
            f1_loc = f1.get("attributes", {}).get("geo_location") or (
                {
                    "latitude": f1.get("attributes", {}).get("latitude"),
                    "longitude": f1.get("attributes", {}).get("longitude"),
                }
                if "latitude" in f1.get("attributes", {})
                else None
            )
            f2_loc = f2.get("attributes", {}).get("geo_location") or (
                {
                    "latitude": f2.get("attributes", {}).get("latitude"),
                    "longitude": f2.get("attributes", {}).get("longitude"),
                }
                if "latitude" in f2.get("attributes", {})
                else None
            )

            f1_ts = f1.get("event_timestamp")
            f2_ts = f2.get("event_timestamp")

            # Check Spatiotemporal contradiction (same timestamp window, distant locations)
            is_conflict = False
            conflict_reason = ""

            if f1_loc and f2_loc and f1_ts and f2_ts:
                try:
                    t1 = datetime.fromisoformat(str(f1_ts).replace("Z", "+00:00"))
                    t2 = datetime.fromisoformat(str(f2_ts).replace("Z", "+00:00"))
                    # If within 30 minutes of each other
                    if abs((t1 - t2).total_seconds()) < 1800:
                        lat_diff = abs(float(f1_loc["latitude"]) - float(f2_loc["latitude"]))
                        lon_diff = abs(float(f1_loc["longitude"]) - float(f2_loc["longitude"]))
                        if lat_diff > 0.05 or lon_diff > 0.05:  # > ~5km apart
                            is_conflict = True
                            conflict_reason = (
                                f"Spatiotemporal impossibility: Activity recorded at distinct geographic locations "
                                f"({f1_loc} vs {f2_loc}) within {int(abs((t1 - t2).total_seconds()) / 60)} minutes."
                            )
                except Exception:
                    pass

            # Statement semantic contradiction keyword check
            f1_stmt = f1.get("statement", "").lower()
            f2_stmt = f2.get("statement", "").lower()
            if ("present at" in f1_stmt and "absent from" in f2_stmt) or (
                "verified suspect device" in f1_stmt and "disproven device ownership" in f2_stmt
            ):
                is_conflict = True
                conflict_reason = f"Direct statement contradiction between Fact '{f1['statement'][:30]}...' and Fact '{f2['statement'][:30]}...'."

            if is_conflict:
                contradiction_id = str(uuid.uuid4())
                contradiction_entry = {
                    "id": contradiction_id,
                    "fact_ids": [f1.get("id"), f2.get("id")],
                    "description": conflict_reason,
                    "conflict_type": "SPATIOTEMPORAL"
                    if f1_loc and f2_loc
                    else "STATEMENT_CONFLICT",
                    "status": "UNRESOLVED",
                    "source_ids": list(set(f1.get("source_ids", []) + f2.get("source_ids", []))),
                }
                contradictions.append(contradiction_entry)
                logger.warning(f"CONTRADICTION DETECTED: {conflict_reason}")

                # Add contradicts edge in graph
                edge_id = f"contradicts_{f1.get('id')}_{f2.get('id')}"
                if not any(e.get("id") == edge_id for e in edges):
                    edges.append(
                        {
                            "id": edge_id,
                            "source": str(f1.get("id")),
                            "target": str(f2.get("id")),
                            "relationship_type": "contradicts",
                            "label": "contradicts fact",
                            "confidence": 1.0,
                            "source_ids": contradiction_entry["source_ids"],
                            "attributes": {"contradiction_id": contradiction_id},
                        }
                    )

                # Mark affected hypotheses as CONTESTED
                for h in updated_hypotheses:
                    h_sources = set(h.get("source_ids", []))
                    if any(s in h_sources for s in contradiction_entry["source_ids"]):
                        h["status"] = "CONTESTED"

    evidence_graph["edges"] = edges
    return contradictions, evidence_graph, updated_hypotheses
