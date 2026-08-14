import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from app.core.logging import logger


class ActionTier(str, enum.Enum):
    AUTO = "AUTO"
    REVIEW = "REVIEW"
    ONLY = "ONLY"


class HumanOnlyActionError(Exception):
    """
    Inviolable Safety Invariant:
    Tier 3 (ONLY) actions represent sovereign legal and human judgments (guilt declaration,
    victim identification, suspect legal liability). No executable function exists in code.
    """

    pass


class ReviewGateHalt(Exception):
    """
    Tier 2 (REVIEW) actions require explicit human investigator authorization.
    Execution halts until an approved API call is received.
    """

    def __init__(self, action_id: str, action_type: str, reason: str):
        super().__init__(f"Action '{action_type}' ({action_id}) halted for human review: {reason}")
        self.action_id = action_id
        self.action_type = action_type
        self.reason = reason


# Code-enforced Action Tier Registry
AUTHORIZATION_TIER: Dict[str, ActionTier] = {
    # Tier 1: AUTO (Autonomous execution permitted)
    "ingest_evidence": ActionTier.AUTO,
    "extract_metadata": ActionTier.AUTO,
    "extract_ocr": ActionTier.AUTO,
    "extract_nlp_entities": ActionTier.AUTO,
    "calculate_eig": ActionTier.AUTO,
    "detect_gaps": ActionTier.AUTO,
    "detect_contradictions": ActionTier.AUTO,
    "update_graph": ActionTier.AUTO,
    "compute_belief_propagation": ActionTier.AUTO,
    "compute_dependency_impact": ActionTier.AUTO,
    "propose_entity_merge": ActionTier.AUTO,
    # Tier 2: REVIEW (Halts execution until explicit human authorization)
    "merge_entities": ActionTier.REVIEW,
    "elevate_hypothesis": ActionTier.REVIEW,
    "execute_external_query": ActionTier.REVIEW,
    "issue_summons_warrant": ActionTier.REVIEW,
    "export_forensic_report": ActionTier.REVIEW,
    # Tier 3: ONLY (Human-only judgment; strictly unexecutable)
    "declare_guilt": ActionTier.ONLY,
    "confirm_victim_identity": ActionTier.ONLY,
    "attribute_suspect_legal_liability": ActionTier.ONLY,
    "render_legal_conclusion": ActionTier.ONLY,
}


def get_action_tier(action_type: str) -> ActionTier:
    """Returns the authorization tier for an action, defaulting to REVIEW for unregistered actions."""
    return AUTHORIZATION_TIER.get(action_type, ActionTier.REVIEW)


def execute_action(
    action_type: str,
    payload: Dict[str, Any],
    state: Any,
    auto_executor: Optional[Callable[[Dict[str, Any]], Any]] = None,
) -> Dict[str, Any]:
    """
    Central Authorization Gateway.
    Strictly enforces the Three-Tier policy across the agent runtime.
    """
    tier = get_action_tier(action_type)
    action_id = payload.get("action_id") or str(uuid.uuid4())
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # 1. Tier 3 (ONLY): Inviolable Block
    if tier == ActionTier.ONLY:
        logger.error(
            f"SECURITY POLICY VIOLATION: Attempted invocation of Tier-3 (ONLY) action '{action_type}'. "
            f"No automated execution path exists."
        )
        # Record in authorization audit log
        state.setdefault("authorization_log", []).append(
            {
                "action_id": action_id,
                "action_type": action_type,
                "tier": "ONLY",
                "decision": "BLOCKED",
                "timestamp": timestamp_str,
                "reason": "Attempted invocation of Tier 3 sovereign judgment action.",
            }
        )
        raise HumanOnlyActionError(
            f"Action '{action_type}' is Tier 3 (HUMAN ONLY). Automated execution is strictly prohibited by system policy."
        )

    # 2. Tier 2 (REVIEW): Enforce Human-in-the-Loop Halt Gate
    if tier == ActionTier.REVIEW:
        logger.warning(
            f"REVIEW GATE TRIGGERED: Halting agent execution for '{action_type}' (id={action_id}). Awaiting human approval."
        )
        pending_action = {
            "id": action_id,
            "action_type": action_type,
            "payload": payload,
            "tier": "REVIEW",
            "requested_at": timestamp_str,
            "status": "PENDING",
            "description": payload.get("description", f"Review required for {action_type}"),
        }
        state.setdefault("pending_actions", []).append(pending_action)
        state.setdefault("authorization_log", []).append(
            {
                "action_id": action_id,
                "action_type": action_type,
                "tier": "REVIEW",
                "decision": "HALTED_FOR_REVIEW",
                "timestamp": timestamp_str,
            }
        )
        state["status"] = "AWAITING_REVIEW"
        raise ReviewGateHalt(
            action_id=action_id,
            action_type=action_type,
            reason=f"Action '{action_type}' requires investigator approval before state update.",
        )

    # 3. Tier 1 (AUTO): Execute Automatically
    logger.info(f"Executing Tier-1 AUTO action: '{action_type}' (id={action_id})")
    result = auto_executor(payload) if auto_executor else {"status": "executed", "payload": payload}

    state.setdefault("completed_actions", []).append(
        {
            "id": action_id,
            "action_type": action_type,
            "payload": payload,
            "tier": "AUTO",
            "result": result,
            "executed_at": timestamp_str,
        }
    )
    state.setdefault("authorization_log", []).append(
        {
            "action_id": action_id,
            "action_type": action_type,
            "tier": "AUTO",
            "decision": "AUTO_APPROVED",
            "timestamp": timestamp_str,
        }
    )

    return result
