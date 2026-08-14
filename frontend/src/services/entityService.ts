import { api } from './api';
import { EntityMergeProposal } from '../types/entity';
import { DEMO_PROPOSALS } from './demoData';

export const entityService = {
  async getCandidateMergeProposals(caseId: string): Promise<EntityMergeProposal[]> {
    try {
      return await api.get<EntityMergeProposal[]>(`/cases/${caseId}/entities/candidates`);
    } catch {
      return DEMO_PROPOSALS;
    }
  },

  async reviewMergeProposal(
    proposalId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ): Promise<{ status: string; message: string }> {
    try {
      return await api.post<{ status: string; message: string }>(
        `/cases/entities/proposals/${proposalId}/review`,
        { action, notes }
      );
    } catch {
      const idx = DEMO_PROPOSALS.findIndex((p) => p.id === proposalId);
      if (idx !== -1) {
        DEMO_PROPOSALS[idx].status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      }
      return {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        message: `Proposal ${proposalId} marked ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`,
      };
    }
  },
};
