import pytest

from app.agents.authorization import (
    HumanOnlyActionError,
    ReviewGateHalt,
    execute_action,
)


def test_tier_3_human_only_action_strictly_blocked():
    """
    Security Test: Verifies that Tier 3 (ONLY) sovereign legal judgments
    (e.g. declare_guilt, confirm_victim_identity) raise HumanOnlyActionError with no execution path.
    """
    state = {"authorization_log": [], "status": "ACTIVE"}

    # Attempt guilt declaration
    with pytest.raises(HumanOnlyActionError) as excinfo:
        execute_action("declare_guilt", {"suspect_id": "S123"}, state)

    assert "Tier 3 (HUMAN ONLY)" in str(excinfo.value)
    # Confirm blocked in audit log
    assert any(log["decision"] == "BLOCKED" for log in state["authorization_log"])

    # Attempt victim identification
    with pytest.raises(HumanOnlyActionError):
        execute_action("confirm_victim_identity", {"victim_id": "V456"}, state)


def test_tier_2_review_action_halts_at_gate():
    """
    Security Test: Verifies that Tier 2 (REVIEW) actions cannot execute without human approval,
    triggering ReviewGateHalt and queueing in pending_actions.
    """
    state = {"pending_actions": [], "authorization_log": [], "status": "ACTIVE"}

    with pytest.raises(ReviewGateHalt) as excinfo:
        execute_action(
            "merge_entities", {"source_entity_id": "E1", "target_entity_id": "E2"}, state
        )

    assert excinfo.value.action_type == "merge_entities"
    assert len(state["pending_actions"]) == 1
    assert state["pending_actions"][0]["action_type"] == "merge_entities"
    assert state["status"] == "AWAITING_REVIEW"


def test_tier_1_auto_action_executes_inline():
    """
    Verifies that Tier 1 (AUTO) deterministic tools execute inline and record in completed_actions.
    """
    state = {"completed_actions": [], "authorization_log": [], "status": "ACTIVE"}

    def sample_executor(p):
        return {"extracted": 5}

    result = execute_action(
        "extract_ocr", {"file": "image.png"}, state, auto_executor=sample_executor
    )

    assert result["extracted"] == 5
    assert len(state["completed_actions"]) == 1
    assert state["completed_actions"][0]["action_type"] == "extract_ocr"
