import { api } from './api';
import {
  CandidateAction,
  DependencyImpact,
  InvestigationState,
  AgentTraceLog,
} from '../types/agent';
import {
  DEMO_STATE,
  DEMO_RECOMMENDATIONS,
  DEMO_DEPENDENCIES,
  DEMO_AUDIT_LOGS,
} from './demoData';

export const agentService = {
  async triggerInvestigationCycle(caseId: string): Promise<{
    status: string;
    version: number;
    agent_status: string;
    working_notes?: string;
    candidate_actions_count: number;
  }> {
    try {
      return await api.post<{
        status: string;
        version: number;
        agent_status: string;
        working_notes?: string;
        candidate_actions_count: number;
      }>(`/cases/${caseId}/investigate`, {});
    } catch {
      DEMO_STATE.version += 1;
      return {
        status: 'completed',
        version: DEMO_STATE.version,
        agent_status: 'IDLE',
        working_notes: 'Investigation Agent processed new graph facts. Contradiction resolved via Wi-Fi timeline corroboration.',
        candidate_actions_count: DEMO_RECOMMENDATIONS.length,
      };
    }
  },

  async getCaseState(caseId: string): Promise<InvestigationState> {
    try {
      return await api.get<InvestigationState>(`/cases/${caseId}/state`);
    } catch {
      return DEMO_STATE;
    }
  },

  async getRecommendations(caseId: string): Promise<CandidateAction[]> {
    try {
      return await api.get<CandidateAction[]>(`/cases/${caseId}/recommendations`);
    } catch {
      return DEMO_RECOMMENDATIONS;
    }
  },

  async getDependencyImpacts(caseId: string, hypothesisId: string): Promise<DependencyImpact[]> {
    try {
      return await api.get<DependencyImpact[]>(`/cases/${caseId}/dependency/${hypothesisId}`);
    } catch {
      return DEMO_DEPENDENCIES;
    }
  },

  async approveAction(actionId: string, notes?: string): Promise<{ status: string; message: string }> {
    try {
      return await api.post<{ status: string; message: string }>(`/actions/${actionId}/approve`, { notes });
    } catch {
      DEMO_STATE.pending_actions = DEMO_STATE.pending_actions.filter((a) => a.id !== actionId);
      return {
        status: 'approved',
        message: 'Action successfully approved by investigator and resumed.',
      };
    }
  },

  async rejectAction(actionId: string, notes?: string): Promise<{ status: string; message: string }> {
    try {
      return await api.post<{ status: string; message: string }>(`/actions/${actionId}/reject`, { notes });
    } catch {
      DEMO_STATE.pending_actions = DEMO_STATE.pending_actions.filter((a) => a.id !== actionId);
      return {
        status: 'rejected',
        message: 'Action rejected by investigator.',
      };
    }
  },

  async getAgentTrace(caseId: string): Promise<AgentTraceLog[]> {
    try {
      return await api.get<AgentTraceLog[]>(`/cases/${caseId}/agent-trace`);
    } catch {
      return DEMO_AUDIT_LOGS;
    }
  },
};
