export interface GraphNode {
  id: string;
  label: string;
  node_type: string; // 'entity' | 'fact' | 'hypothesis' | 'evidence'
  sub_type?: string | null;
  attributes: Record<string, unknown>;
  source_ids: string[];
  confidence?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: 'supports' | 'attacks' | 'derives_from' | 'contradicts' | 'associated_with';
  label?: string | null;
  confidence: number;
  source_ids: string[];
  attributes: Record<string, unknown>;
}

export interface EvidenceGraph {
  case_id: string;
  node_count: number;
  edge_count: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  dedup_clusters: Record<string, string[]>;
}
