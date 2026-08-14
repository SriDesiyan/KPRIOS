from datetime import datetime, timezone
from typing import Any, Dict, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import investigation_graph
from app.agents.state import InvestigationStateDict, create_initial_state
from app.models.agent_models import AgentRunLog, CandidateAction, CaseStateRecord
from app.models.entity import Entity
from app.models.evidence import EvidenceItem
from app.models.fact import Fact
from app.models.hypothesis import Hypothesis
from app.models.relationship import Relationship
from app.services.evidence_graph import EvidenceGraphEngine


class AgentExecutionService:
    """
    Coordinates state rehydration, LangGraph agent execution,
    and PostgreSQL persistence for KPYRIOS-ACPIA reasoning runs.
    """

    @staticmethod
    async def load_or_rehydrate_state(case_id: str, db: AsyncSession) -> InvestigationStateDict:
        """Loads persisted state from DB or rehydrates from core investigation tables."""
        # 1. Check if CaseStateRecord exists
        stmt = select(CaseStateRecord).where(CaseStateRecord.case_id == case_id)
        res = await db.execute(stmt)
        record = res.scalars().first()

        if record and record.state_payload:
            state_data = dict(record.state_payload)
            state_data["case_id"] = case_id
            state_data["version"] = record.version
            return cast(InvestigationStateDict, state_data)

        # 2. Rehydrate state from database tables
        state: InvestigationStateDict = create_initial_state(case_id)

        # Load Evidence
        ev_stmt = select(EvidenceItem).where(EvidenceItem.case_id == case_id)
        ev_res = await db.execute(ev_stmt)
        ev_items = list(ev_res.scalars().all())
        state["evidence"] = [
            {
                "id": ev.id,
                "file_name": ev.file_name,
                "hash": ev.hash,
                "source_fingerprint": ev.source_fingerprint,
                "modality": ev.modality.value
                if hasattr(ev.modality, "value")
                else str(ev.modality),
                "file_size_bytes": ev.file_size_bytes,
                "trust_vector": ev.trust_vector or {},
                "metadata_payload": ev.metadata_payload or {},
            }
            for ev in ev_items
        ]

        # Load Entities, Facts, Relationships, Hypotheses
        ent_stmt = select(Entity).where(Entity.case_id == case_id)
        entities = list((await db.execute(ent_stmt)).scalars().all())

        fact_stmt = select(Fact).where(Fact.case_id == case_id)
        facts = list((await db.execute(fact_stmt)).scalars().all())

        rel_stmt = select(Relationship).where(Relationship.case_id == case_id)
        rels = list((await db.execute(rel_stmt)).scalars().all())

        hyp_stmt = select(Hypothesis).where(Hypothesis.case_id == case_id)
        hyps = list((await db.execute(hyp_stmt)).scalars().all())

        # If no hypotheses exist, seed initial competing propositions
        if not hyps:
            h1 = Hypothesis(
                case_id=case_id,
                statement="Suspect orchestrated unauthorized digital media transmission.",
                prior_probability=0.5,
                source_ids=[ev.id for ev in ev_items[:1]] if ev_items else [case_id],
            )
            h2 = Hypothesis(
                case_id=case_id,
                statement="Device compromised by third-party remote access trojan.",
                prior_probability=0.5,
                source_ids=[ev.id for ev in ev_items[:1]] if ev_items else [case_id],
            )
            db.add_all([h1, h2])
            await db.flush()
            hyps = [h1, h2]

        state["hypotheses"] = [
            {
                "id": h.id,
                "statement": h.statement,
                "status": h.status.value if hasattr(h.status, "value") else str(h.status),
                "prior_probability": h.prior_probability,
                "belief": h.prior_probability,
                "source_ids": h.source_ids or [],
                "support_count": 0,
                "attack_count": 0,
            }
            for h in hyps
        ]

        # Rehydrate NetworkX graph
        engine = EvidenceGraphEngine(case_id)
        engine.populate(ev_items, entities, facts, rels, hyps)
        state["evidence_graph"] = engine.serialize(ev_items)

        return state

    @staticmethod
    async def persist_state(case_id: str, state: Dict[str, Any], db: AsyncSession) -> None:
        """Persists updated state and candidate actions to PostgreSQL."""
        version = state.get("version", 1)

        # 1. Update or Insert CaseStateRecord
        stmt = select(CaseStateRecord).where(CaseStateRecord.case_id == case_id)
        res = await db.execute(stmt)
        record = res.scalars().first()

        if record:
            record.version = version
            record.state_payload = state
            record.updated_at = datetime.now(timezone.utc)
        else:
            record = CaseStateRecord(
                case_id=case_id,
                version=version,
                state_payload=state,
            )
            db.add(record)

        # 2. Persist Candidate Actions
        for cand in state.get("candidate_actions", []):
            cand_id = cand.get("id")
            if cand_id:
                cand_stmt = select(CandidateAction).where(CandidateAction.id == cand_id)
                cand_rec = (await db.execute(cand_stmt)).scalars().first()
                if not cand_rec:
                    cand_rec = CandidateAction(
                        id=cand_id,
                        case_id=case_id,
                        action_type=cand.get("action_type", "investigation_step"),
                        description=cand.get("description", ""),
                        eig_score=float(cand.get("eig_score", 0.0)),
                        justification=cand.get("justification", ""),
                        tier=cand.get("tier", "REVIEW"),
                        payload=cand.get("payload", {}),
                    )
                    db.add(cand_rec)

        # 3. Persist Agent Run Logs
        for audit in state.get("audit_log", []):
            log_id = audit.get("id")
            if not log_id:
                log_entry = AgentRunLog(
                    case_id=case_id,
                    agent=audit.get("agent", "agent"),
                    step=audit.get("step", "Step"),
                    input_summary=audit.get("input_summary", ""),
                    output_summary=audit.get("output_summary", ""),
                    details=audit.get("details", {}),
                )
                db.add(log_entry)

        await db.commit()

    @staticmethod
    async def run_investigation_cycle(case_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Executes one complete cycle of the LangGraph dual-agent workflow."""
        state = await AgentExecutionService.load_or_rehydrate_state(case_id, db)
        updated_state = investigation_graph.invoke(state)
        await AgentExecutionService.persist_state(case_id, updated_state, db)
        return updated_state
