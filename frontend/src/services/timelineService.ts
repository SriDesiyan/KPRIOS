import { api } from './api';
import { TimelineResponse } from '../types/timeline';
import { DEMO_TIMELINE_RESPONSE } from './demoData';

export const timelineService = {
  async getCaseTimeline(caseId: string): Promise<TimelineResponse> {
    try {
      return await api.get<TimelineResponse>(`/cases/${caseId}/timeline`);
    } catch {
      return DEMO_TIMELINE_RESPONSE;
    }
  },
};
