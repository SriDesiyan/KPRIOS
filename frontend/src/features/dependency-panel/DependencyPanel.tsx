import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { agentService } from '../../services/agentService';
import { DependencyImpact } from '../../types/agent';
import { Layers, ArrowDownRight, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface DependencyPanelProps {
  caseId: string;
  selectedHypothesisId: string | null;
  selectedHypothesisStatement?: string;
}

export const DependencyPanel: React.FC<DependencyPanelProps> = ({
  caseId,
  selectedHypothesisId,
  selectedHypothesisStatement,
}) => {
  const [impacts, setImpacts] = useState<DependencyImpact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDependencyImpacts = useCallback(async () => {
    if (!caseId || !selectedHypothesisId) return;
    try {
      setLoading(true);
      const data = await agentService.getDependencyImpacts(caseId, selectedHypothesisId);
      setImpacts(data);
    } catch (err) {
      console.error('Failed to load dependency impacts:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, selectedHypothesisId]);

  useEffect(() => {
    fetchDependencyImpacts();
  }, [fetchDependencyImpacts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Leave-One-Out Dependency Impact (Ablation)
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Sensitivity drop in percentage points (pp) if an evidence item or its source cluster is removed
          </p>
        </div>
        <Badge variant="warning">
          <Layers size={13} style={{ marginRight: '4px' }} />
          Ablation Sensitivity
        </Badge>
      </div>

      {/* Invariant Alert */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.85rem',
        fontSize: '0.75rem',
        color: '#fbbf24',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Forensic Metric Invariant:</strong> Dependency impact is measured strictly in percentage points (pp)
          via leave-one-out graph ablation. It is never presented as a calibrated probability.
        </span>
      </div>

      {!selectedHypothesisId ? (
        <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Select a hypothesis from the panel above to view its evidence dependency sensitivity breakdown.
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Computing leave-one-out graph ablation...
        </div>
      ) : impacts.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No evidence items currently linked to target hypothesis.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Target: <strong style={{ color: 'var(--color-text-primary)' }}>{selectedHypothesisStatement || selectedHypothesisId}</strong>
          </div>

          {impacts.map((imp) => {
            const isPositive = imp.dependency_impact_pp >= 0;
            const deltaAbs = Math.abs(imp.dependency_impact_pp);

            return (
              <div
                key={imp.evidence_id}
                style={{
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                    {imp.file_name || imp.evidence_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                    Modality: <span style={{ color: 'var(--color-text-secondary)' }}>{imp.modality}</span> •
                    Baseline: {Math.round(imp.baseline_belief * 100)}% → Ablated: {Math.round(imp.ablated_belief * 100)}%
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: isPositive ? '#34d399' : '#f87171',
                  }}>
                    {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    <span>{deltaAbs.toFixed(1)} pp</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    {isPositive ? 'drop on removal' : 'gain on removal'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
