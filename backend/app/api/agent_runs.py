from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.engines.dependency_analysis import compute_all_dependency_impacts
from app.api.deps import get_async_db, get_current_user, require_role
from app.models.agent_models import (
    AgentRunLog,
    CaseStateRecord,
)
from app.models.case import Case
from app.models.user import User, UserRole
from app.services.agent_service import AgentExecutionService

router = APIRouter(tags=["Agent Reasoning & Recommendations"])


class ApprovalDecisionRequest(BaseModel):
    notes: Optional[str] = None


@router.post("/cases/{case_id}/investigate")
async def trigger_investigation_cycle(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role([UserRole.INVESTIGATOR, UserRole.SUPERVISOR])),
) -> Dict[str, Any]:
    """
    Advances the LangGraph dual-agent workflow by one ReAct execution cycle.
    Executes investigation agent tools, updates beliefs, detects contradictions,
    and runs Strategy Agent EIG optimization.
    """
    case_stmt = select(Case).where(Case.id == case_id)
    case_rec = (await db.execute(case_stmt)).scalars().first()
    if not case_rec:
        raise HTTPException(status_code=404, detail="Case not found.")

    state = await AgentExecutionService.run_investigation_cycle(case_id, db)
    return {
        "status": "success",
        "case_id": case_id,
        "version": state.get("version", 1),
        "agent_status": state.get("status", "ACTIVE"),
        "working_notes": state.get("working_notes"),
        "hypotheses_count": len(state.get("hypotheses", [])),
        "gaps_count": len(state.get("evidence_gaps", [])),
        "contradictions_count": len(state.get("contradictions", [])),
        "candidate_actions_count": len(state.get("candidate_actions", [])),
        "pending_actions_count": len(state.get("pending_actions", [])),
    }


@router.get("/cases/{case_id}/state")
async def get_case_state(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieves the full current InvestigationState for a case."""
    state = await AgentExecutionService.load_or_rehydrate_state(case_id, db)
    return dict(state)


@router.get("/cases/{case_id}/recommendations")
async def get_strategy_recommendations(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieves ranked investigative recommendations computed by Strategy Agent."""
    state = await AgentExecutionService.load_or_rehydrate_state(case_id, db)
    return state.get("candidate_actions", [])


@router.get("/cases/{case_id}/dependency/{hypothesis_id}")
async def get_hypothesis_dependency_impacts(
    case_id: str,
    hypothesis_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Computes Leave-One-Out (LOO) dependency ablation impacts for all evidence
    on a target hypothesis in percentage points (pp).
    """
    state = await AgentExecutionService.load_or_rehydrate_state(case_id, db)
    impacts = compute_all_dependency_impacts(
        target_hypothesis_id=hypothesis_id,
        hypotheses=state.get("hypotheses", []),
        evidence_graph=state.get("evidence_graph", {}),
        evidence_items=state.get("evidence", []),
    )
    return impacts


@router.post("/actions/{action_id}/approve")
async def approve_pending_action(
    action_id: str,
    body: Optional[ApprovalDecisionRequest] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role([UserRole.INVESTIGATOR, UserRole.SUPERVISOR])),
) -> Dict[str, Any]:
    """
    Human-in-the-Loop Gate: Approves a pending Tier-2 REVIEW action,
    resumes agent execution state, and logs the decision.
    """
    # Find matching case state record containing pending action
    stmt = select(CaseStateRecord)
    res = await db.execute(stmt)
    records = list(res.scalars().all())

    target_record: Optional[CaseStateRecord] = None
    target_action: Optional[Dict[str, Any]] = None

    for rec in records:
        state = dict(rec.state_payload or {})
        pending = state.get("pending_actions", [])
        for act in pending:
            if act.get("id") == action_id:
                target_record = rec
                target_action = act
                break
        if target_record:
            break

    if not target_record or not target_action:
        raise HTTPException(status_code=404, detail="Pending review action not found.")

    state = dict(target_record.state_payload or {})
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # Move from pending_actions to completed_actions
    state["pending_actions"] = [
        a for a in state.get("pending_actions", []) if a.get("id") != action_id
    ]
    state.setdefault("completed_actions", []).append(
        {
            **target_action,
            "status": "APPROVED",
            "decided_by_id": current_user.id,
            "decided_at": timestamp_str,
            "notes": body.notes if body else None,
        }
    )
    state.setdefault("authorization_log", []).append(
        {
            "action_id": action_id,
            "action_type": target_action.get("action_type"),
            "tier": "REVIEW",
            "decision": "HUMAN_APPROVED",
            "decided_by_id": current_user.id,
            "timestamp": timestamp_str,
        }
    )
    state["status"] = "ACTIVE"
    state["working_notes"] = (
        f"Action '{target_action.get('action_type')}' approved by investigator {current_user.email}."
    )

    await AgentExecutionService.persist_state(target_record.case_id, state, db)
    return {
        "status": "success",
        "message": "Action approved and agent state updated.",
        "action_id": action_id,
    }


@router.post("/actions/{action_id}/reject")
async def reject_pending_action(
    action_id: str,
    body: Optional[ApprovalDecisionRequest] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role([UserRole.INVESTIGATOR, UserRole.SUPERVISOR])),
) -> Dict[str, Any]:
    """Rejects a pending Tier-2 REVIEW action and logs the decision."""
    stmt = select(CaseStateRecord)
    res = await db.execute(stmt)
    records = list(res.scalars().all())

    target_record: Optional[CaseStateRecord] = None
    target_action: Optional[Dict[str, Any]] = None

    for rec in records:
        state = dict(rec.state_payload or {})
        pending = state.get("pending_actions", [])
        for act in pending:
            if act.get("id") == action_id:
                target_record = rec
                target_action = act
                break
        if target_record:
            break

    if not target_record or not target_action:
        raise HTTPException(status_code=404, detail="Pending review action not found.")

    state = dict(target_record.state_payload or {})
    timestamp_str = datetime.now(timezone.utc).isoformat()

    state["pending_actions"] = [
        a for a in state.get("pending_actions", []) if a.get("id") != action_id
    ]
    state.setdefault("failed_actions", []).append(
        {
            **target_action,
            "status": "REJECTED_BY_HUMAN",
            "decided_by_id": current_user.id,
            "decided_at": timestamp_str,
            "reason": body.notes if body else "Rejected by investigator",
        }
    )
    state.setdefault("authorization_log", []).append(
        {
            "action_id": action_id,
            "action_type": target_action.get("action_type"),
            "tier": "REVIEW",
            "decision": "HUMAN_REJECTED",
            "decided_by_id": current_user.id,
            "timestamp": timestamp_str,
        }
    )
    state["status"] = "ACTIVE"
    state["working_notes"] = (
        f"Action '{target_action.get('action_type')}' rejected by investigator {current_user.email}."
    )

    await AgentExecutionService.persist_state(target_record.case_id, state, db)
    return {"status": "success", "message": "Action rejected.", "action_id": action_id}


@router.get("/cases/{case_id}/agent-trace")
async def get_agent_trace(
    case_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieves chronological execution trace logs for the case."""
    stmt = (
        select(AgentRunLog)
        .where(AgentRunLog.case_id == case_id)
        .order_by(AgentRunLog.timestamp.asc())
    )
    res = await db.execute(stmt)
    logs = list(res.scalars().all())

    return [
        {
            "id": log.id,
            "agent": log.agent,
            "step": log.step,
            "input_summary": log.input_summary,
            "output_summary": log.output_summary,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]
