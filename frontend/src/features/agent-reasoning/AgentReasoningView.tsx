import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { agentService } from '../../services/agentService';
import { InvestigationState } from '../../types/agent';
import { HypothesisPanel } from '../hypothesis-panel/HypothesisPanel';
import { DependencyPanel } from '../dependency-panel/DependencyPanel';
import { StrategyRecommendations } from '../strategy-recommendations/StrategyRecommendations';
import { ApprovalQueue } from '../approval-queue/ApprovalQueue';
import { AgentTraceView } from '../agent-trace/AgentTraceView';
import { Bot, ShieldAlert, CheckCircle2, History } from 'lucide-react';

interface AgentReasoningViewProps {
  activeCaseId: string | null;
}

export const AgentReasoningView: React.FC<AgentReasoningViewProps> = ({ activeCaseId }) => {
  const [state, setState] = useState<InvestigationState | null>(null);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'approvals' | 'trace'>('approvals');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchState = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const data = await agentService.getCaseState(activeCaseId);
      setState(data);
      if (data.hypotheses && data.hypotheses.length > 0 && !selectedHypothesisId) {
        setSelectedHypothesisId(data.hypotheses[0].id);
      }
    } catch (err) {
      console.error('Failed to load investigation state:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId, selectedHypothesisId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const selectedHyp = state?.hypotheses?.find((h) => h.id === selectedHypothesisId);
  const pendingCount = state?.pending_actions?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                LangGraph Dual-Agent Reasoning Runtime
              </h2>
              {state?.status === 'AWAITING_REVIEW' ? (
                <Badge variant="warning">HALTED (AWAITING REVIEW)</Badge>
              ) : (
                <Badge variant="success">ACTIVE</Badge>
              )}
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Investigation Agent (ReAct) • Strategy Agent (EIG Optimizer) • Three-Tier Sovereign Control Gate
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              STATE VERSION
            </span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
              v{state?.version || 1}
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              PENDING REVIEWS
            </span>
            <strong style={{ fontSize: '1.1rem', color: pendingCount > 0 ? '#f59e0b' : '#34d399' }}>
              {pendingCount}
            </strong>
          </div>
        </div>
      </div>

      {!activeCaseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an investigation case to launch the dual-agent reasoning runtime.
        </Card>
      ) : loading && !state ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading agent reasoning runtime state...
        </div>
      ) : (
        <>
          {/* Top Section: Strategy Recommendations & Action Optimizer */}
          <StrategyRecommendations
            caseId={activeCaseId}
            recommendations={state?.candidate_actions || []}
            onCycleCompleted={fetchState}
          />

          {/* Middle Section 2-Column Grid: Live Beliefs + LOO Dependency Impact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '1.5rem',
            alignItems: 'start',
          }}>
            <Card style={{ padding: '1.25rem' }}>
              <HypothesisPanel
                hypotheses={state?.hypotheses || []}
                selectedHypothesisId={selectedHypothesisId}
                onSelectHypothesis={(id) => setSelectedHypothesisId(id)}
              />
            </Card>

            <Card style={{ padding: '1.25rem' }}>
              <DependencyPanel
                caseId={activeCaseId}
                selectedHypothesisId={selectedHypothesisId}
                selectedHypothesisStatement={selectedHyp?.statement}
              />
            </Card>
          </div>

          {/* Bottom Section: Tabs for Approval Queue & ReAct Execution Trace */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-border)',
              gap: '1.5rem',
              marginBottom: '1.25rem',
            }}>
              <button
                onClick={() => setActiveBottomTab('approvals')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeBottomTab === 'approvals' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  padding: '0.5rem 0',
                  color: activeBottomTab === 'approvals' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {pendingCount > 0 ? (
                  <ShieldAlert size={16} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                )}
                <span>Human Approval Queue</span>
                {pendingCount > 0 && (
                  <Badge variant="warning">{pendingCount}</Badge>
                )}
              </button>

              <button
                onClick={() => setActiveBottomTab('trace')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeBottomTab === 'trace' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  padding: '0.5rem 0',
                  color: activeBottomTab === 'trace' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <History size={16} />
                <span>ReAct Execution Trace</span>
              </button>
            </div>

            {activeBottomTab === 'approvals' ? (
              <ApprovalQueue
                pendingActions={state?.pending_actions || []}
                onActionDecided={fetchState}
              />
            ) : (
              <AgentTraceView caseId={activeCaseId} />
            )}
          </Card>
        </>
      )}
    </div>
  );
};
