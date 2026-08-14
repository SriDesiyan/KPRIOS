import copy
from typing import Any, Dict, List

from app.agents.engines.belief_propagation import compute_belief_distribution


def calculate_dependency_impact(
    target_evidence_id: str,
    target_hypothesis_id: str,
    hypotheses: List[Dict[str, Any]],
    evidence_graph: Dict[str, Any],
    evidence_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Performs Leave-One-Out (LOO) graph ablation to calculate Dependency Impact.
    Measures the sensitivity drop in percentage points (pp) when target evidence is removed.
    Invariant: Result is reported strictly in percentage points (pp), never as a calibrated probability.
    """
    # 1. Compute baseline belief distribution
    _, baseline_beliefs = compute_belief_distribution(hypotheses, evidence_graph, evidence_items)
    baseline_belief = baseline_beliefs.get(target_hypothesis_id, 0.5)

    # 2. Deep-copy and ablate target evidence item & its connected graph edges
    ablated_evidence = [e for e in evidence_items if e.get("id") != target_evidence_id]

    ablated_graph = copy.deepcopy(evidence_graph)
    ablated_nodes = [n for n in ablated_graph.get("nodes", []) if n.get("id") != target_evidence_id]
    ablated_edges = [
        e
        for e in ablated_graph.get("edges", [])
        if target_evidence_id not in e.get("source_ids", [])
        and e.get("source") != target_evidence_id
        and e.get("target") != target_evidence_id
    ]
    ablated_graph["nodes"] = ablated_nodes
    ablated_graph["edges"] = ablated_edges

    # 3. Compute ablated belief distribution
    _, ablated_beliefs = compute_belief_distribution(hypotheses, ablated_graph, ablated_evidence)
    ablated_belief = ablated_beliefs.get(target_hypothesis_id, 0.5)

    # 4. Compute delta in percentage points (pp)
    # Delta > 0 means the evidence supported the hypothesis; Delta < 0 means it refuted it
    delta_pp = round((baseline_belief - ablated_belief) * 100.0, 2)

    return {
        "evidence_id": target_evidence_id,
        "hypothesis_id": target_hypothesis_id,
        "baseline_belief": baseline_belief,
        "ablated_belief": ablated_belief,
        "dependency_impact_pp": delta_pp,
        "unit": "percentage_points",
        "interpretation": (
            f"Removing this evidence causes a {abs(delta_pp):.2f} pp "
            f"{'drop' if delta_pp >= 0 else 'gain'} in belief for the target hypothesis."
        ),
    }


def compute_all_dependency_impacts(
    target_hypothesis_id: str,
    hypotheses: List[Dict[str, Any]],
    evidence_graph: Dict[str, Any],
    evidence_items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Calculates leave-one-out dependency impact for every evidence item on a target hypothesis."""
    results: List[Dict[str, Any]] = []
    for ev in evidence_items:
        ev_id = ev.get("id")
        if ev_id:
            impact = calculate_dependency_impact(
                target_evidence_id=ev_id,
                target_hypothesis_id=target_hypothesis_id,
                hypotheses=hypotheses,
                evidence_graph=evidence_graph,
                evidence_items=evidence_items,
            )
            impact["file_name"] = ev.get("file_name", "unknown")
            impact["modality"] = ev.get("modality", "OTHER")
            results.append(impact)

    # Sort by absolute impact descending
    results.sort(key=lambda x: abs(x["dependency_impact_pp"]), reverse=True)
    return results
