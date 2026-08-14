import React from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, Keyboard, Check, X } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Forensic System Settings & Access Control
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Role-based permissions, cryptographic session keys, and investigator keyboard shortcuts
        </p>
      </div>

      {/* User Profile Card */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                {user?.email}
              </h3>
              <Badge variant={user?.role === 'supervisor' ? 'supervisor' : user?.role === 'auditor' ? 'auditor' : 'investigator'}>
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Session Authenticated • JWT Signed with HS256
            </div>
          </div>
        </div>
      </Card>

      {/* RBAC Scopes Matrix */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
            Role-Based Access Control (RBAC) Matrix
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Operational Capability</th>
              <th style={{ padding: '0.75rem' }}>Investigator</th>
              <th style={{ padding: '0.75rem' }}>Supervisor</th>
              <th style={{ padding: '0.75rem' }}>Auditor</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>Evidence Ingestion & Integrity Hashing</td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#64748b' }}><X size={16} /></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>Advance Dual-Agent Reasoning Cycle</td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#64748b' }}><X size={16} /></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>Approve Tier-2 REVIEW Actions</td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#64748b' }}><X size={16} /></td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>Inspect Cryptographic Audit Ledger</td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
              <td style={{ padding: '0.75rem', color: '#34d399' }}><Check size={16} /></td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Keyboard Shortcuts Reference Guide */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Keyboard size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
            Investigator Keyboard Shortcuts
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>Advance Agent ReAct Loop</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Press <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>Ctrl + Shift + I</kbd>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>Toggle 3D / 2D Graph View</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Press <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>Alt + G</kbd>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
