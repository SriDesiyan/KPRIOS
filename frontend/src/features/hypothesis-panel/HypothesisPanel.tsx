import React from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Hypothesis } from '../../types/agent';
import { ShieldAlert, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
  selectedHypothesisId: string | null;
  onSelectHypothesis: (id: string) => void;
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({
  hypotheses,
  selectedHypothesisId,
  onSelectHypothesis,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Competing Hypotheses & Belief Distribution
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Normalized belief distribution updated via deduplication-aware support/attack propagation
          </p>
        </div>
        <Badge variant="primary">
          <Scale size={13} style={{ marginRight: '4px' }} />
          {hypotheses.length} Propositions
        </Badge>
      </div>

      {hypotheses.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No active hypotheses found for this case. Run an agent investigation cycle to seed hypotheses.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hypotheses.map((h) => {
            const isSelected = selectedHypothesisId === h.id;
            const beliefPct = Math.round((h.belief || 0) * 100);
            const isContested = h.status === 'CONTESTED';

            return (
              <div
                key={h.id}
                onClick={() => onSelectHypothesis(h.id)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-bg-base)',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                        {h.statement}
                      </span>
                      {isContested && (
                        <Badge variant="danger">
                          <AlertCircle size={12} style={{ marginRight: '3px' }} />
                          CONTESTED
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Prior: {Math.round(h.prior_probability * 100)}% • Source clusters: {h.source_ids?.length || 0}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: isContested ? '#f87171' : 'var(--color-primary)',
                    }}>
                      {beliefPct}%
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                      Belief
                    </span>
                  </div>
                </div>

                {/* Belief Progress Bar */}
                <div style={{
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    width: `${beliefPct}%`,
                    height: '100%',
                    backgroundColor: isContested ? '#ef4444' : 'var(--color-primary)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                {/* Support and Attack Evidence Breakdown */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
                    <ShieldCheck size={14} />
                    <span>Support Clusters: <strong>{h.support_count}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171' }}>
                    <ShieldAlert size={14} />
                    <span>Attack / Conflict Clusters: <strong>{h.attack_count}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
