import React, { useState } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { agentService } from '../../services/agentService';
import { PendingAction } from '../../types/agent';
import { ShieldCheck, ShieldAlert, Check, X, Clock } from 'lucide-react';

interface ApprovalQueueProps {
  pendingActions: PendingAction[];
  onActionDecided: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  pendingActions,
  onActionDecided,
}) => {
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  const handleApprove = async (actionId: string) => {
    try {
      setDecidingId(actionId);
      await agentService.approveAction(actionId, notes);
      setNotes('');
      onActionDecided();
    } catch (err) {
      console.error('Failed to approve action:', err);
    } finally {
      setDecidingId(null);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      setDecidingId(actionId);
      await agentService.rejectAction(actionId, notes);
      setNotes('');
      onActionDecided();
    } catch (err) {
      console.error('Failed to reject action:', err);
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Badge variant="review">TIER-2 REVIEW GATE</Badge>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Human-in-the-Loop Sovereign Approval Queue
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Pending Action Approvals
        </h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Actions queued at the Three-Tier Authorization boundary requiring explicit human investigator sign-off
        </p>
      </div>

      {pendingActions.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldCheck size={36} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Actions Awaiting Review</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            All agent execution cycles are clear and no Tier-2 review gates are currently halted.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingActions.map((act) => (
            <Card key={act.id} style={{ padding: '1.25rem', border: '1px solid var(--color-warning)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--color-warning)' }} />
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                      {act.description}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      Action Type: <code>{act.action_type}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="warning">AWAITING APPROVAL</Badge>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <Clock size={12} />
                    <span>{new Date(act.requested_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Payload Parameters */}
              {act.payload && Object.keys(act.payload).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    ACTION PARAMETERS & PAYLOAD:
                  </span>
                  <pre style={{
                    background: 'var(--color-bg-base)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    overflowX: 'auto',
                  }}>
                    {JSON.stringify(act.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Optional Notes & Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '0.85rem',
              }}>
                <input
                  type="text"
                  placeholder="Optional investigator decision notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.75rem',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(act.id)}
                    disabled={decidingId === act.id}
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(act.id)}
                    disabled={decidingId === act.id}
                  >
                    <Check size={14} />
                    <span>Approve & Resume State</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
