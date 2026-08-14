import React, { useState } from 'react';
import { Button } from '../../design-system/Button';
import { Input } from '../../design-system/Input';
import { caseService } from '../../services/caseService';
import { Case } from '../../types/case';
import { X, FolderPlus, AlertCircle } from 'lucide-react';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: Case) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ isOpen, onClose, onCaseCreated }) => {
  const [caseNumber, setCaseNumber] = useState(`CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Case title is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await caseService.createCase({
        case_number: caseNumber.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onCaseCreated(created);
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create case.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
    }}>
      <div style={{
        background: 'var(--color-bg-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}>
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Create Forensic Case
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Initialize a verified digital evidence container
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              color: '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
              Case Tracking Number *
            </label>
            <Input
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. CR-2026-0891"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
              Case Title / Operation Name *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operation CyberShield - Telegram Ring"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
              Investigation Summary / Initial Brief
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on victim protection, suspects, and forensic targets..."
              rows={4}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                padding: '0.75rem',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
