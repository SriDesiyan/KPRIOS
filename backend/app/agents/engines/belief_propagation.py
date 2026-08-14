from typing import Any, Dict, List, Tuple


def compute_belief_distribution(
    hypotheses: List[Dict[str, Any]],
    evidence_graph: Dict[str, Any],
    evidence_items: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
    """
    Computes mathematically grounded belief propagation over competing hypotheses.
    Deduplication-aware: Evidence items sharing a source_fingerprint cluster are counted as one unit.
    Normalizes belief distribution across live hypotheses to sum to 1.0.
    """
    if not hypotheses:
        return [], {}

    # 1. Build cluster mapping: evidence_id -> cluster_id
    clusters: Dict[str, str] = {}
    for ev in evidence_items:
        key: str = str(ev.get("source_fingerprint") or ev.get("hash") or ev.get("id") or "")
        clusters[str(ev.get("id", ""))] = key

    # 2. Extract edges from graph
    edges = evidence_graph.get("edges", [])

    updated_hypotheses: List[Dict[str, Any]] = []
    raw_weights: Dict[str, float] = {}

    for hyp in hypotheses:
        hyp_id = hyp.get("id", "")
        prior = float(hyp.get("prior_probability", 0.5))

        # Find incoming edges to this hypothesis or linked facts
        support_clusters = set()
        attack_clusters = set()

        for edge in edges:
            tgt = edge.get("target")
            src = edge.get("source")
            rel_type = edge.get("relationship_type", "")
            src_ids = edge.get("source_ids", [src])

            if tgt == hyp_id:
                for s_id in src_ids:
                    cluster_key = clusters.get(s_id, s_id)
                    if rel_type == "supports":
                        support_clusters.add(cluster_key)
                    elif rel_type in ("attacks", "contradicts"):
                        attack_clusters.add(cluster_key)

        support_count = len(support_clusters)
        attack_count = len(attack_clusters)

        # Belief calculation: Prior * (1 + 0.4*support) / (1 + 0.6*attack)
        support_multiplier = 1.0 + (0.45 * support_count)
        attack_multiplier = 1.0 / (1.0 + (0.65 * attack_count))

        weight = max(0.01, prior * support_multiplier * attack_multiplier)
        raw_weights[hyp_id] = weight

        updated_hypotheses.append(
            {
                **hyp,
                "support_count": support_count,
                "attack_count": attack_count,
                "raw_weight": weight,
            }
        )

    # 3. Normalize across all hypotheses
    total_weight = sum(raw_weights.values()) or 1.0
    belief_map: Dict[str, float] = {}

    for h in updated_hypotheses:
        hyp_id = h["id"]
        normalized_belief = round(raw_weights[hyp_id] / total_weight, 4)
        h["belief"] = normalized_belief
        belief_map[hyp_id] = normalized_belief

    return updated_hypotheses, belief_map
