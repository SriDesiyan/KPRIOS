import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { agentService } from '../../services/agentService';
import { EvidenceGap, Contradiction } from '../../types/agent';
import { AlertTriangle, ShieldAlert, CheckCircle2, Search } from 'lucide-react';

interface GapPanelProps {
  activeCaseId: string | null;
}

export const GapPanel: React.FC<GapPanelProps> = ({ activeCaseId }) => {
  const [gaps, setGaps] = useState<EvidenceGap[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchGapsAndConflicts = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const state = await agentService.getCaseState(activeCaseId);
      setGaps(state.evidence_gaps || []);
      setContradictions(state.contradictions || []);
    } catch (err) {
      console.error('Failed to load gaps and contradictions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchGapsAndConflicts();
  }, [fetchGapsAndConflicts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Badge variant="warning">DETERMINISTIC GAP & CONTRADICTION ENGINE</Badge>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Domain Ontology Diffing & Spatiotemporal Conflict Detection
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Coverage Gaps & Evidentiary Contradictions
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Identifies uncollected ISP records, unverified locations, single-witness observations, and spatiotemporal impossibilities
        </p>
      </div>

      {!activeCaseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an active investigation case to view gaps and contradictions.
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Analyzing case artifacts for gaps and conflicts...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Column 1: Evidentiary Contradictions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: '#ef4444' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Detected Contradictions
                </h3>
              </div>
              <Badge variant={contradictions.length > 0 ? 'danger' : 'success'}>
                {contradictions.length} Active Conflicts
              </Badge>
            </div>

            {contradictions.length === 0 ? (
              <Card style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle2 size={32} style={{ color: '#34d399', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                  No Direct Contradictions Detected
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  All extracted facts and spatiotemporal coordinates are currently coherent.
                </p>
              </Card>
            ) : (
              contradictions.map((c) => (
                <Card key={c.id} style={{ padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Badge variant="danger">{c.conflict_type}</Badge>
                    <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                      STATUS: {c.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    {c.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Conflicting Source Items: <strong>{c.source_ids?.join(', ')}</strong>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Column 2: Coverage Gaps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Identified Evidence Gaps
                </h3>
              </div>
              <Badge variant="warning">{gaps.length} Gaps</Badge>
            </div>

            {gaps.length === 0 ? (
              <Card style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle2 size={32} style={{ color: '#34d399', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                  Ontology Coverage Satisfied
                </div>
              </Card>
            ) : (
              gaps.map((g) => (
                <Card key={g.id} style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Badge variant="warning">{g.gap_type}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      STATUS: {g.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    {g.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                    <Search size={13} />
                    <span>Target Sources: {g.source_ids?.join(', ')}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
