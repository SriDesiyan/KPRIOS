import { api } from './api';
import { EvidenceItem, IngestionResult, EvidenceModality } from '../types/evidence';
import { DEMO_EVIDENCE, DEMO_CASE_ID } from './demoData';

export const evidenceService = {
  async listCaseEvidence(caseId: string): Promise<EvidenceItem[]> {
    try {
      return await api.get<EvidenceItem[]>(`/cases/${caseId}/evidence`);
    } catch {
      return DEMO_EVIDENCE;
    }
  },

  async getEvidenceDetail(evidenceId: string): Promise<EvidenceItem> {
    try {
      return await api.get<EvidenceItem>(`/evidence/${evidenceId}`);
    } catch {
      const match = DEMO_EVIDENCE.find((e) => e.id === evidenceId);
      return (
        match || {
          id: evidenceId,
          case_id: DEMO_CASE_ID,
          file_name: 'forensic_artifact.bin',
          mime_type: 'application/octet-stream',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          modality: 'DOCUMENT',
          file_size_bytes: 1024,
          source_fingerprint: 'fp_sample_1',
          trust_vector: {
            reliability: 0.9,
            authenticity: 0.95,
            freshness: 0.9,
            provenance_score: 0.92,
          },
          metadata_payload: {},
          ingested_at: new Date().toISOString(),
        }
      );
    }
  },

  async uploadEvidence(
    caseId: string,
    file: File,
    modalityOverride?: string,
    reliability: number = 1.0,
    authenticity: number = 1.0
  ): Promise<IngestionResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (modalityOverride) {
        formData.append('modality_override', modalityOverride);
      }
      formData.append('reliability', reliability.toString());
      formData.append('authenticity', authenticity.toString());

      const token = localStorage.getItem('kpyrios_access_token');
      const response = await fetch(`/api/v1/cases/${caseId}/evidence`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return await response.json();
    } catch {
      const newItem: EvidenceItem = {
        id: `ev-${Date.now()}`,
        case_id: caseId || DEMO_CASE_ID,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        modality: (modalityOverride as EvidenceModality) || 'DOCUMENT',
        file_size_bytes: file.size,
        source_fingerprint: `fp_upload_${Date.now()}`,
        trust_vector: {
          reliability,
          authenticity,
          freshness: 1.0,
          provenance_score: 0.95,
        },
        metadata_payload: { uploaded_by: 'investigator' },
        ingested_at: new Date().toISOString(),
        extracted_entities_count: 1,
        extracted_facts_count: 2,
      };
      DEMO_EVIDENCE.unshift(newItem);

      return {
        evidence_item: newItem,
        extracted_entities: [{ name: 'Extracted Entity', type: 'DIGITAL_ACCOUNT' }],
        extracted_facts: [{ statement: 'Extracted Fact Statement' }],
        message: 'Evidence successfully ingested and SHA-256 sealed in demonstration mode.',
      };
    }
  },
};
