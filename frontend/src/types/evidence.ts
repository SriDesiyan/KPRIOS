export type EvidenceModality =
  | 'IMAGE'
  | 'DOCUMENT'
  | 'CHAT_LOG'
  | 'CALL_RECORD'
  | 'NETWORK_PCAP'
  | 'VIDEO'
  | 'AUDIO'
  | 'OTHER';

export interface TrustVector {
  reliability: number;
  authenticity: number;
  freshness: number;
  provenance_score: number;
}

export interface EvidenceItem {
  id: string;
  case_id: string;
  hash: string;
  source_fingerprint: string;
  modality: EvidenceModality;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  trust_vector: TrustVector;
  metadata_payload: Record<string, unknown>;
  ingested_at: string;
  ingested_by_id?: string | null;
  extracted_entities_count?: number;
  extracted_facts_count?: number;
}

export interface IngestionResult {
  evidence_item: EvidenceItem;
  extracted_entities: Array<Record<string, unknown>>;
  extracted_facts: Array<Record<string, unknown>>;
  message: string;
}
