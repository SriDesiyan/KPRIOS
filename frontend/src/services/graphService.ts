import { api } from './api';
import { EvidenceGraph } from '../types/graph';
import { DEMO_GRAPH } from './demoData';

export const graphService = {
  async getCaseGraph(caseId: string): Promise<EvidenceGraph> {
    try {
      return await api.get<EvidenceGraph>(`/cases/${caseId}/graph`);
    } catch {
      return DEMO_GRAPH;
    }
  },
};
