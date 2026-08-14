from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class GraphNode(BaseModel):
    id: str
    label: str
    node_type: str  # "entity", "fact", "hypothesis", "evidence"
    sub_type: Optional[str] = None  # e.g. "PERSON", "PHONE_NUMBER", "OBSERVATION"
    attributes: Dict[str, Any] = {}
    source_ids: List[str] = []
    cluster_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: (
        str  # "supports", "attacks", "derives_from", "contradicts", "associated_with"
    )
    label: Optional[str] = None
    confidence: float = 1.0
    source_ids: List[str] = []
    attributes: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class EvidenceGraphResponse(BaseModel):
    case_id: str
    node_count: int
    edge_count: int
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    dedup_clusters: Dict[str, List[str]] = {}
