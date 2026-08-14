import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { entityService } from '../../services/entityService';
import { EntityMergeProposal } from '../../types/entity';
import { GitMerge, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EntityProposalsDrawerProps {
  activeCaseId: string | null;
}

export const EntityProposalsDrawer: React.FC<EntityProposalsDrawerProps> = ({ activeCaseId }) => {
  const [proposals, setProposals] = useState<EntityMergeProposal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const data = await entityService.getCandidateMergeProposals(activeCaseId);
      setProposals(data);
    } catch (err) {
      console.error('Failed to load candidate entity proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Badge variant="warning">REVIEW-TIER PROPOSALS</Badge>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Zero Auto-Merge Invariant Active
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Candidate Entity Resolution Proposals
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Deterministic similarity matches queued for human investigator review (no auto-merge occurs)
        </p>
      </div>

      {/* Safety Invariant Notice */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <ShieldAlert size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <strong>Forensic Integrity Rule:</strong> Entity resolution in KPYRIOS-ACPIA is strictly proposal-only.
          Potential duplicate entities are highlighted with similarity scores, but graph nodes remain distinct until explicitly approved by an authorized investigator.
        </div>
      </div>

      {!activeCaseId ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Please select an active investigation case to view candidate proposals.
          </p>
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading candidate merge proposals...
        </div>
      ) : proposals.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle2 size={36} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Ambiguous Entity Matches</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            All extracted entities are currently distinct with no pending resolution proposals detected.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {proposals.map((p) => (
            <Card key={p.id} style={{ padding: '1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitMerge size={18} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Candidate Resolution Proposal
                  </span>
                  <Badge variant="warning">PENDING REVIEW</Badge>
                </div>

                <Badge variant="primary">
                  {Math.round(p.similarity_score * 100)}% Similarity Match
                </Badge>
              </div>

              {/* Source vs Target Entities Comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '1rem',
                alignItems: 'center',
                background: 'var(--color-bg-base)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '1rem',
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    SOURCE ENTITY ({p.source_entity?.entity_type})
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                    {p.source_entity?.name}
                  </strong>
                </div>

                <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
                  ⇄
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    TARGET ENTITY ({p.target_entity?.entity_type})
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                    {p.target_entity?.name}
                  </strong>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <strong>Reason:</strong> {p.reason}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
