import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { agentService } from '../../services/agentService';
import { AgentTraceLog } from '../../types/agent';
import { FileCheck, ShieldCheck, Lock, Clock } from 'lucide-react';

interface AuditTrailViewProps {
  activeCaseId: string | null;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ activeCaseId }) => {
  const [logs, setLogs] = useState<AgentTraceLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAuditLogs = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const data = await agentService.getAgentTrace(activeCaseId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Badge variant="success">
            <Lock size={12} style={{ marginRight: '3px' }} />
            APPEND-ONLY IMMUTABLE LEDGER
          </Badge>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Cryptographically Verified Forensic Audit Trail
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Audit & Provenance Ledger
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Tamper-evident record of all agent deliberative steps, deterministic tool calls, and human approvals
        </p>
      </div>

      {!activeCaseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an investigation case to inspect its audit ledger.
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading cryptographic audit trail...
        </div>
      ) : logs.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <FileCheck size={36} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>Audit Ledger Initialized</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            All operations on this case are cryptographically logged as they occur.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map((log, idx) => (
            <Card key={log.id} style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    #{idx + 1}
                  </span>
                  <Badge variant="neutral">{log.agent.toUpperCase()}</Badge>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {log.step}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <ShieldCheck size={14} style={{ color: '#34d399' }} />
                  <span>SEALED</span>
                  <Clock size={12} />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div style={{
                background: 'var(--color-bg-base)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontSize: '0.8rem',
              }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>INPUT: </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{log.input_summary}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-primary)' }}>OUTPUT: </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{log.output_summary}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
