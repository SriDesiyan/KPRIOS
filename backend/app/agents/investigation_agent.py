import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from app.agents.authorization import ReviewGateHalt, execute_action
from app.agents.engines.belief_propagation import compute_belief_distribution
from app.agents.engines.contradiction_engine import detect_contradictions
from app.agents.engines.gap_engine import detect_evidence_gaps
from app.agents.state import InvestigationStateDict
from app.core.logging import logger
from app.services.entity_resolution import generate_candidate_merge_proposals


def run_investigation_agent_step(state: InvestigationStateDict) -> InvestigationStateDict:
    """
    Investigation Agent Node (ReAct Loop):
    Observe -> Understand -> Plan -> Select Tool -> Execute -> Observe Result -> Update State -> Replan/Escalate.
    Operates strictly on AUTO-tier deterministic tools; halts at REVIEW/ONLY boundaries.
    """
    case_id = state.get("case_id", "unknown")
    state["current_agent"] = "investigation_agent"
    version = state.get("version", 1) + 1
    state["version"] = version

    audit_log = state.setdefault("audit_log", [])
    completed = state.setdefault("completed_actions", [])
    failed = state.setdefault("failed_actions", [])
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # Step 1: OBSERVE current state
    evidence_items = state.get("evidence", [])
    hypotheses = state.get("hypotheses", [])
    graph = state.get("evidence_graph", {"nodes": [], "edges": [], "dedup_clusters": {}})
    entities = [n for n in graph.get("nodes", []) if n.get("node_type") == "entity"]
    facts = [n for n in graph.get("nodes", []) if n.get("node_type") == "fact"]

    audit_log.append(
        {
            "agent": "investigation_agent",
            "step": "Observe",
            "input_summary": f"Observed state for case {case_id}: {len(evidence_items)} evidence items, {len(hypotheses)} hypotheses, {len(facts)} facts.",
            "output_summary": "State metrics loaded.",
            "timestamp": timestamp_str,
        }
    )

    # Step 2: UNDERSTAND (Gap and Contradiction Detection)
    # Detect gaps
    gaps = detect_evidence_gaps(evidence_items, entities, hypotheses)
    state["evidence_gaps"] = gaps

    # Detect contradictions
    contradictions, updated_graph, updated_hyps = detect_contradictions(facts, hypotheses, graph)
    state["contradictions"] = contradictions
    state["evidence_graph"] = updated_graph
    state["hypotheses"] = updated_hyps

    # Step 3 & 4: PLAN & SELECT TOOL
    # Look for unresolved high-priority tasks
    executed_action_types = {a.get("action_type") for a in completed}

    selected_action: str = ""
    payload: Dict[str, Any] = {}

    # Check for pending entity merges first
    unmerged_entities = [e for e in entities if not e.get("is_merged")]
    if len(unmerged_entities) >= 2 and "propose_entity_merges" not in executed_action_types:
        selected_action = "propose_entity_merges"
        payload = {"entities": unmerged_entities}
    elif contradictions and "flag_contradictions" not in executed_action_types:
        selected_action = "flag_contradictions"
        payload = {"contradictions": contradictions}
    elif "compute_belief_propagation" not in executed_action_types:
        selected_action = "compute_belief_propagation"
        payload = {}
    else:
        # Check for unaddressed gaps
        unaddressed_gaps = [g for g in gaps if g.get("status") == "IDENTIFIED"]
        if unaddressed_gaps:
            target_gap = unaddressed_gaps[0]
            selected_action = f"investigate_gap_{target_gap.get('gap_type')}"
            payload = {"gap": target_gap}
        else:
            selected_action = "compute_belief_propagation"
            payload = {}

    audit_log.append(
        {
            "agent": "investigation_agent",
            "step": "Plan",
            "input_summary": f"Identified priority task: '{selected_action}' (Gaps: {len(gaps)}, Contradictions: {len(contradictions)}).",
            "output_summary": f"Selected action: {selected_action}",
            "timestamp": timestamp_str,
        }
    )

    # Step 5 & 6: EXECUTE & OBSERVE RESULT
    action_id = str(uuid.uuid4())
    try:

        def tool_executor(p: Dict[str, Any]) -> Dict[str, Any]:
            if selected_action == "propose_entity_merges":
                # Proposal-only similarity matching
                proposals = generate_candidate_merge_proposals(
                    p.get("entities", []), threshold=0.70
                )
                return {"proposals_count": len(proposals), "proposals": proposals}
            elif selected_action == "compute_belief_propagation":
                hyps, belief_map = compute_belief_distribution(
                    state.get("hypotheses", []),
                    state.get("evidence_graph", {}),
                    state.get("evidence", []),
                )
                state["hypotheses"] = hyps
                return {"belief_map": belief_map}
            elif selected_action.startswith("investigate_gap"):
                # Mark gap as investigating
                gap_data = p.get("gap", {})
                gap_id = gap_data.get("id")
                for g in state.get("evidence_gaps", []):
                    if g.get("id") == gap_id:
                        g["status"] = "INVESTIGATING"
                return {"gap_investigated": gap_id, "status": "INVESTIGATING"}
            return {"status": "success", "action": selected_action}

        # Execute through Three-Tier Authorization Gateway
        result = execute_action(
            action_type=selected_action,
            payload={"action_id": action_id, **payload},
            state=state,
            auto_executor=tool_executor,
        )

        audit_log.append(
            {
                "agent": "investigation_agent",
                "step": "Execute",
                "input_summary": f"Invoked AUTO tool '{selected_action}'.",
                "output_summary": f"Execution successful: {result.get('status', 'completed')}",
                "timestamp": timestamp_str,
            }
        )

    except ReviewGateHalt as review_err:
        audit_log.append(
            {
                "agent": "investigation_agent",
                "step": "Execute",
                "input_summary": f"Triggered REVIEW gate for '{selected_action}'.",
                "output_summary": str(review_err),
                "timestamp": timestamp_str,
            }
        )
        state["status"] = "AWAITING_REVIEW"
        state["working_notes"] = f"Halted at Tier-2 REVIEW boundary: {review_err.reason}"
        return state

    except Exception as exec_err:
        logger.error(f"Investigation agent tool execution error: {str(exec_err)}")
        failed.append(
            {
                "id": action_id,
                "action_type": selected_action,
                "payload": payload,
                "error": str(exec_err),
                "failed_at": timestamp_str,
            }
        )
        audit_log.append(
            {
                "agent": "investigation_agent",
                "step": "Replan",
                "input_summary": f"Tool '{selected_action}' encountered failure: {str(exec_err)}",
                "output_summary": "Recorded failure in state; triggering ReAct replan on next cycle.",
                "timestamp": timestamp_str,
            }
        )
        state["working_notes"] = (
            f"Tool failure encountered on {selected_action}: {str(exec_err)}. Replanned."
        )

    # Step 7: UPDATE STATE & Propagate beliefs
    updated_hyps, _ = compute_belief_distribution(
        state.get("hypotheses", []), state.get("evidence_graph", {}), state.get("evidence", [])
    )
    state["hypotheses"] = updated_hyps

    return state
