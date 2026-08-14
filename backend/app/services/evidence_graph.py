from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import networkx as nx

from app.models.entity import Entity
from app.models.evidence import EvidenceItem
from app.models.fact import Fact
from app.models.hypothesis import Hypothesis
from app.models.relationship import Relationship
from app.services.deduplication import cluster_evidence_by_fingerprint


class EvidenceGraphEngine:
    """
    NetworkX-backed Evidence Graph Engine.
    Constructs, serializes, and analyzes multi-directed graphs of investigation entities,
    facts, hypotheses, and evidence nodes with strict structural provenance.
    """

    def __init__(self, case_id: str):
        self.case_id = case_id
        self.graph = nx.MultiDiGraph(case_id=case_id)

    def populate(
        self,
        evidence_items: List[EvidenceItem],
        entities: List[Entity],
        facts: List[Fact],
        relationships: List[Relationship],
        hypotheses: Optional[List[Hypothesis]] = None,
    ) -> nx.MultiDiGraph:
        self.graph.clear()
        hypotheses = hypotheses or []

        # 1. Add EvidenceItem nodes
        for ev in evidence_items:
            ingested_dt = getattr(ev, "ingested_at", None)
            ingested_str = (
                ingested_dt.isoformat()
                if ingested_dt is not None
                else datetime.now(timezone.utc).isoformat()
            )
            self.graph.add_node(
                ev.id,
                label=ev.file_name,
                node_type="evidence",
                sub_type=ev.modality.value if hasattr(ev.modality, "value") else str(ev.modality),
                hash=ev.hash,
                source_fingerprint=ev.source_fingerprint,
                file_size=ev.file_size_bytes,
                trust_vector=ev.trust_vector,
                attributes={"mime_type": ev.mime_type, "ingested_at": ingested_str},
                source_ids=[ev.id],
            )

        # 2. Add Entity nodes & derivation edges
        for ent in entities:
            self.graph.add_node(
                ent.id,
                label=ent.name,
                node_type="entity",
                sub_type=ent.entity_type.value
                if hasattr(ent.entity_type, "value")
                else str(ent.entity_type),
                confidence=ent.confidence,
                attributes=ent.attributes or {},
                source_ids=ent.source_ids or [],
                is_merged=ent.is_merged,
            )
            # Add derives_from edges from evidence to entity
            for src_id in ent.source_ids:
                if self.graph.has_node(src_id):
                    self.graph.add_edge(
                        src_id,
                        ent.id,
                        key=f"derives_{src_id}_{ent.id}",
                        relationship_type="derives_from",
                        label="derives entity",
                        confidence=ent.confidence,
                        source_ids=[src_id],
                    )

        # 3. Add Fact nodes & derivation edges
        for fact in facts:
            event_ts = getattr(fact, "event_timestamp", None)
            event_ts_str = event_ts.isoformat() if event_ts is not None else None
            self.graph.add_node(
                fact.id,
                label=fact.statement[:40] + "..." if len(fact.statement) > 40 else fact.statement,
                node_type="fact",
                sub_type=fact.fact_type.value
                if hasattr(fact.fact_type, "value")
                else str(fact.fact_type),
                confidence=fact.confidence,
                statement=fact.statement,
                event_timestamp=event_ts_str,
                attributes=fact.attributes or {},
                source_ids=fact.source_ids or [],
            )
            for src_id in fact.source_ids:
                if self.graph.has_node(src_id):
                    self.graph.add_edge(
                        src_id,
                        fact.id,
                        key=f"derives_{src_id}_{fact.id}",
                        relationship_type="derives_from",
                        label="derives fact",
                        confidence=fact.confidence,
                        source_ids=[src_id],
                    )

        # 4. Add Hypothesis nodes
        for hyp in hypotheses:
            self.graph.add_node(
                hyp.id,
                label=hyp.statement[:40] + "..." if len(hyp.statement) > 40 else hyp.statement,
                node_type="hypothesis",
                sub_type=hyp.status.value if hasattr(hyp.status, "value") else str(hyp.status),
                statement=hyp.statement,
                prior_probability=hyp.prior_probability,
                attributes=hyp.attributes or {},
                source_ids=hyp.source_ids or [],
            )

        # 5. Add Explicit Relationships (supports, attacks, derives_from, contradicts, associated_with)
        for rel in relationships:
            rel_type = (
                rel.relationship_type.value
                if hasattr(rel.relationship_type, "value")
                else str(rel.relationship_type)
            )
            if self.graph.has_node(rel.source_entity_id) and self.graph.has_node(
                rel.target_entity_id
            ):
                self.graph.add_edge(
                    rel.source_entity_id,
                    rel.target_entity_id,
                    key=rel.id,
                    relationship_type=rel_type,
                    label=rel.statement or rel_type,
                    confidence=rel.confidence,
                    source_ids=rel.source_ids or [],
                    attributes=rel.attributes or {},
                )

        return self.graph

    def serialize(self, evidence_items: Optional[List[EvidenceItem]] = None) -> Dict[str, Any]:
        """Serializes NetworkX graph to API JSON payload."""
        nodes_list: List[Dict[str, Any]] = []
        for node_id, data in self.graph.nodes(data=True):
            nodes_list.append(
                {
                    "id": str(node_id),
                    "label": data.get("label", str(node_id)),
                    "node_type": data.get("node_type", "unknown"),
                    "sub_type": data.get("sub_type"),
                    "attributes": data.get("attributes", {}),
                    "source_ids": data.get("source_ids", []),
                    "confidence": data.get("confidence", 1.0),
                }
            )

        edges_list: List[Dict[str, Any]] = []
        for u, v, key, data in self.graph.edges(keys=True, data=True):
            edges_list.append(
                {
                    "id": str(key),
                    "source": str(u),
                    "target": str(v),
                    "relationship_type": data.get("relationship_type", "associated_with"),
                    "label": data.get("label"),
                    "confidence": data.get("confidence", 1.0),
                    "source_ids": data.get("source_ids", []),
                    "attributes": data.get("attributes", {}),
                }
            )

        clusters = cluster_evidence_by_fingerprint(evidence_items) if evidence_items else {}

        return {
            "case_id": self.case_id,
            "node_count": len(nodes_list),
            "edge_count": len(edges_list),
            "nodes": nodes_list,
            "edges": edges_list,
            "dedup_clusters": clusters,
        }
