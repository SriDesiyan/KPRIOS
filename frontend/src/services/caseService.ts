import { api } from './api';
import { Case, CaseCreate } from '../types/case';
import { DEMO_CASES, DEMO_CASE_ID } from './demoData';

export const caseService = {
  async listCases(): Promise<Case[]> {
    try {
      return await api.get<Case[]>('/cases');
    } catch {
      return DEMO_CASES;
    }
  },

  async getCase(caseId: string): Promise<Case> {
    try {
      return await api.get<Case>(`/cases/${caseId}`);
    } catch {
      const match = DEMO_CASES.find((c) => c.id === caseId);
      return (
        match || {
          id: caseId || DEMO_CASE_ID,
          case_number: 'CR-KP-ACPIA-2026-001',
          title: 'Operation CyberShield — Digital Forensics Investigation',
          description: 'Investigation into distributed peer-to-peer child exploitation ring.',
          status: 'ACTIVE',
          created_by_id: 'officer-uuid-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          evidence_count: 3,
          entity_count: 3,
          fact_count: 5,
          hypothesis_count: 2,
          gap_count: 1,
        }
      );
    }
  },

  async createCase(caseData: CaseCreate): Promise<Case> {
    try {
      return await api.post<Case>('/cases', caseData);
    } catch {
      const newCase: Case = {
        id: `case-${Date.now()}`,
        case_number: caseData.case_number,
        title: caseData.title,
        description: caseData.description || '',
        status: caseData.status || 'ACTIVE',
        created_by_id: 'officer-uuid-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        evidence_count: 0,
        entity_count: 0,
        fact_count: 0,
        hypothesis_count: 0,
        gap_count: 0,
      };
      DEMO_CASES.unshift(newCase);
      return newCase;
    }
  },
};
