export interface TimelineEvent {
  id: string;
  case_id: string;
  timestamp: string;
  title: string;
  description: string;
  event_type: string;
  source_ids: string[];
  confidence: number;
  evidence_file_name?: string | null;
  attributes: Record<string, unknown>;
}

export interface TimelineResponse {
  case_id: string;
  total_events: number;
  events: TimelineEvent[];
}
