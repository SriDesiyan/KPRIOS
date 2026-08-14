import React, { useState } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { agentService } from '../../services/agentService';
import { CandidateAction } from '../../types/agent';
import { Sparkles, Play, Compass, Info, CheckCircle2 } from 'lucide-react';

interface StrategyRecommendationsProps {
  caseId: string | null;
  recommendations: CandidateAction[];
  onCycleCompleted: () => void;
}

export const StrategyRecommendations: React.FC<StrategyRecommendationsProps> = ({
  caseId,
  recommendations,
  onCycleCompleted,
}) => {
  const [running, setRunning] = useState(false);
  const [lastCycleMessage, setLastCycleMessage] = useState<string | null>(null);

  const handleRunAgentCycle = async () => {
    if (!caseId) return;
    try {
      setRunning(true);
      setLastCycleMessage(null);
      const res = await agentService.triggerInvestigationCycle(caseId);
      setLastCycleMessage(
        `Cycle completed (Version ${res.version}). Generated ${res.candidate_actions_count} ranked recommendations.`
      );
      onCycleCompleted();
    } catch (err: unknown) {
      console.error('Agent cycle error:', err);
      const msg = err instanceof Error ? err.message : 'Agent cycle failed.';
      setLastCycleMessage(`Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'AUTO':
        return 'auto';
      case 'REVIEW':
        return 'review';
      case 'ONLY':
        return 'only';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & ReAct Trigger */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="primary">STRATEGY AGENT</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Shannon Entropy & EIG Optimizer
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Ranked Investigative Actions
          </h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Recommended next investigative steps optimized by Expected Information Gain to discriminate between competing hypotheses
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleRunAgentCycle}
          disabled={!caseId || running}
        >
          {running ? (
            <>
              <Sparkles size={16} className="animate-spin" />
              <span>Executing Dual-Agent Loop...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Advance Agent Cycle</span>
            </>
          )}
        </Button>
      </div>

      {lastCycleMessage && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--color-primary)',
        }}>
          <CheckCircle2 size={16} />
          <span>{lastCycleMessage}</span>
        </div>
      )}

      {/* Approximation Invariant Notice */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span>
          <strong>Methodological Note:</strong> EIG scores reflect Simulated Outcome Entropy Reduction in bits (Proof-of-Concept approximation).
          They are decision-support ranking heuristics for investigators, not calibrated probabilities.
        </span>
      </div>

      {/* Recommendations Cards List */}
      {!caseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an active investigation case to view Strategy Agent recommendations.
        </Card>
      ) : recommendations.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <Compass size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Recommendations Generated Yet</h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Click &quot;Advance Agent Cycle&quot; to execute the Investigation Agent ReAct loop and Strategy Agent EIG optimizer.
          </p>
          <Button variant="primary" onClick={handleRunAgentCycle} disabled={running}>
            <Play size={16} />
            <span>Run Initial Agent Cycle</span>
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map((rec, index) => (
            <Card key={rec.id} style={{ padding: '1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: index === 0 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: index === 0 ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    #{index + 1}
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                    {rec.description}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={getTierBadgeVariant(rec.tier)}>
                    TIER: {rec.tier}
                  </Badge>
                  <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}>
                    EIG: {rec.eig_score.toFixed(3)} bits (PoC approx)
                  </span>
                </div>
              </div>

              {/* Justification Text */}
              <p style={{
                margin: '0 0 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}>
                {rec.justification}
              </p>

              {/* Action Type Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '0.6rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
              }}>
                <span>Action Type: <code>{rec.action_type}</code></span>
                {rec.discriminates_between?.length > 0 && (
                  <span>Discriminates: {rec.discriminates_between.length} proposition(s)</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
