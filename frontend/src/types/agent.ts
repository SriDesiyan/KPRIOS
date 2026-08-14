export interface Hypothesis {
  id: string;
  statement: string;
  status: string;
  belief: number;
  prior_probability: number;
  support_count: number;
  attack_count: number;
  source_ids: string[];
}

export interface CandidateAction {
  id: string;
  action_type: string;
  description: string;
  eig_score: number;
  justification: string;
  tier: 'AUTO' | 'REVIEW' | 'ONLY';
  payload: Record<string, unknown>;
  discriminates_between: string[];
  current_entropy?: number;
  expected_posterior_entropy?: number;
  is_poc_approximation: boolean;
}

export interface PendingAction {
  id: string;
  action_type: string;
  description: string;
  tier: string;
  requested_at: string;
  status: string;
  payload: Record<string, unknown>;
}

export interface DependencyImpact {
  evidence_id: string;
  hypothesis_id: string;
  file_name?: string;
  modality?: string;
  baseline_belief: number;
  ablated_belief: number;
  dependency_impact_pp: number;
  unit: string;
  interpretation: string;
}

export interface Contradiction {
  id: string;
  fact_ids: string[];
  conflict_type: string;
  description: string;
  status: string;
  source_ids: string[];
}

export interface EvidenceGap {
  id: string;
  gap_type: string;
  description: string;
  status: string;
  source_ids: string[];
  target_entity_id?: string | null;
}

export interface AgentTraceLog {
  id: string;
  agent: string;
  step: string;
  input_summary: string;
  output_summary: string;
  timestamp: string;
}

export interface InvestigationState {
  case_id: string;
  version: number;
  status: string;
  current_agent: string;
  working_notes?: string;
  hypotheses: Hypothesis[];
  evidence: Array<Record<string, unknown>>;
  evidence_graph: Record<string, unknown>;
  evidence_gaps: EvidenceGap[];
  contradictions: Contradiction[];
  completed_actions: Array<Record<string, unknown>>;
  failed_actions: Array<Record<string, unknown>>;
  pending_actions: PendingAction[];
  candidate_actions: CandidateAction[];
  authorization_log: Array<Record<string, unknown>>;
  audit_log: AgentTraceLog[];
}
