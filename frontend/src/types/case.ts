export type CaseStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string | null;
  status: CaseStatus;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  entity_count: number;
  fact_count: number;
  hypothesis_count: number;
  gap_count: number;
}

export interface CaseCreate {
  case_number: string;
  title: string;
  description?: string;
  status?: CaseStatus;
}
