export type EntityType =
  | 'PERSON'
  | 'OFFENDER'
  | 'VICTIM'
  | 'DIGITAL_ACCOUNT'
  | 'PHONE_NUMBER'
  | 'DEVICE'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'CRYPTO_ADDRESS'
  | 'ONLINE_SERVICE';

export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Entity {
  id: string;
  case_id: string;
  name: string;
  entity_type: EntityType;
  attributes: Record<string, unknown>;
  source_ids: string[];
  is_merged: boolean;
  merged_into_id?: string | null;
  confidence: number;
  created_at: string;
}

export interface EntityMergeProposal {
  id: string;
  case_id: string;
  source_entity: Entity;
  target_entity: Entity;
  similarity_score: number;
  reason: string;
  status: ProposalStatus;
  created_at: string;
}
