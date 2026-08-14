import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { agentService } from '../../services/agentService';
import { AgentTraceLog } from '../../types/agent';
import { Terminal, Bot, RefreshCw, Clock } from 'lucide-react';

interface AgentTraceViewProps {
  caseId: string | null;
}

export const AgentTraceView: React.FC<AgentTraceViewProps> = ({ caseId }) => {
  const [logs, setLogs] = useState<AgentTraceLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrace = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const data = await agentService.getAgentTrace(caseId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load agent trace:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchTrace();
  }, [fetchTrace]);

  const getStepBadgeVariant = (step: string) => {
    switch (step.toLowerCase()) {
      case 'observe':
        return 'info';
      case 'understand':
        return 'primary';
      case 'plan':
        return 'neutral';
      case 'execute':
        return 'success';
      case 'replan':
        return 'warning';
      case 'rank':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="primary">EXECUTION TRACE</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ReAct Step-by-Step Cycle Logs
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Agent Reasoning & Action Trace
          </h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Full observable trace of Investigation Agent and Strategy Agent deliberation steps
          </p>
        </div>

        <button
          onClick={fetchTrace}
          disabled={loading || !caseId}
          style={{
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            padding: '0.45rem 0.85rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Trace</span>
        </button>
      </div>

      {!caseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an active case to view agent execution traces.
        </Card>
      ) : loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading agent execution logs...
        </div>
      ) : logs.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <Terminal size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Execution Logs Recorded</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Click &quot;Advance Agent Cycle&quot; in Strategy Recommendations to run the Investigation Agent ReAct loop.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map((log) => (
            <Card key={log.id} style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bot size={16} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {log.agent === 'investigation_agent' ? 'Investigation Agent' : 'Strategy Agent'}
                  </span>
                  <Badge variant={getStepBadgeVariant(log.step)}>
                    {log.step.toUpperCase()}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <Clock size={12} />
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-text-muted)' }}>Input:</strong> {log.input_summary}
                </div>
                <div style={{ color: 'var(--color-text-primary)' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>Output:</strong> {log.output_summary}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
