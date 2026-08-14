from typing import Any, Dict, List, Optional, TypedDict

from pydantic import BaseModel, Field


class HypothesisState(BaseModel):
    id: str
    statement: str
    status: str = "ACTIVE"  # "PROPOSED", "ACTIVE", "REFUTED", "ELEVATED", "CONTESTED"
    belief: float = 0.5
    prior_probability: float = 0.5
    support_count: int = 0
    attack_count: int = 0
    source_ids: List[str] = Field(default_factory=list)


class EvidenceState(BaseModel):
    id: str
    hash: str
    source_fingerprint: str
    modality: str
    file_name: str
    trust_vector: Dict[str, float] = Field(default_factory=dict)
    metadata_payload: Dict[str, Any] = Field(default_factory=dict)


class GapState(BaseModel):
    id: str
    gap_type: str
    description: str
    status: str = "IDENTIFIED"  # "IDENTIFIED", "INVESTIGATING", "RESOLVED"
    target_entity_id: Optional[str] = None
    source_ids: List[str] = Field(default_factory=list)


class ContradictionState(BaseModel):
    id: str
    fact_ids: List[str]
    entity_id: Optional[str] = None
    description: str
    conflict_type: str = "TEMPORAL_LOCATION"  # "TEMPORAL_LOCATION", "STATEMENT_DISCREPANCY"
    status: str = "UNRESOLVED"
    source_ids: List[str] = Field(default_factory=list)


class ActionRecord(BaseModel):
    id: str
    action_type: str
    description: str
    tier: str = "AUTO"  # "AUTO", "REVIEW", "ONLY"
    payload: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    executed_at: Optional[str] = None


class CandidateActionState(BaseModel):
    id: str
    action_type: str
    description: str
    eig_score: float = 0.0
    justification: str
    tier: str = "REVIEW"
    payload: Dict[str, Any] = Field(default_factory=dict)
    discriminates_between: List[str] = Field(default_factory=list)  # Named hypothesis IDs/labels


class InvestigationStateDict(TypedDict):
    case_id: str
    version: int
    hypotheses: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    evidence_graph: Dict[str, Any]
    evidence_gaps: List[Dict[str, Any]]
    contradictions: List[Dict[str, Any]]
    completed_actions: List[Dict[str, Any]]
    failed_actions: List[Dict[str, Any]]
    pending_actions: List[Dict[str, Any]]
    candidate_actions: List[Dict[str, Any]]
    authorization_log: List[Dict[str, Any]]
    audit_log: List[Dict[str, Any]]
    current_agent: str
    status: str
    working_notes: str


def create_initial_state(case_id: str) -> InvestigationStateDict:
    """Creates a clean initial state dictionary for a case."""
    return {
        "case_id": case_id,
        "version": 1,
        "hypotheses": [],
        "evidence": [],
        "evidence_graph": {"nodes": [], "edges": [], "dedup_clusters": {}},
        "evidence_gaps": [],
        "contradictions": [],
        "completed_actions": [],
        "failed_actions": [],
        "pending_actions": [],
        "candidate_actions": [],
        "authorization_log": [],
        "audit_log": [],
        "current_agent": "investigation_agent",
        "status": "ACTIVE",
        "working_notes": "Initialized investigation state container.",
    }
