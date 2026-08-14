import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCase } from '../contexts/CaseContext';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Shield, LogOut, FolderGit2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeCase, cases, setActiveCase } = useCase();

  return (
    <header
      style={{
        height: '60px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 20,
      }}
    >
      {/* Brand & Organization Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(37, 99, 235, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(37, 99, 235, 0.25)',
          }}
        >
          <Shield size={20} color="#3b82f6" />
          <div style={{ lineHeight: 1.1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.08em', color: '#60a5fa' }}>
              KPYRIOS
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
              ACPIA
            </span>
          </div>
        </div>

        <div
          style={{
            height: '24px',
            width: '1px',
            backgroundColor: 'var(--border-subtle)',
          }}
        />

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Kerala Police CyberDome</span>
          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
          <span>HACKP 2026 Child Protection Forensics</span>
        </div>
      </div>

      {/* Case Selector & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Active Case Switcher */}
        {cases.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FolderGit2 size={16} style={{ color: 'var(--color-primary)' }} />
            <select
              value={activeCase?.id || ''}
              onChange={(e) => {
                const selected = cases.find((c) => c.id === e.target.value);
                if (selected) setActiveCase(selected);
              }}
              style={{
                backgroundColor: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                outline: 'none',
                maxWidth: '220px',
              }}
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number}: {c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Three-Tier Guard Active Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Badge variant="auto" size="sm" showIcon>
            AUTO
          </Badge>
          <Badge variant="review" size="sm" showIcon>
            REVIEW
          </Badge>
          <Badge variant="only" size="sm" showIcon>
            ONLY
          </Badge>
        </div>

        <div
          style={{
            height: '24px',
            width: '1px',
            backgroundColor: 'var(--border-subtle)',
          }}
        />

        {/* User Role & Identifier */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <Badge variant={user.role} size="sm">
                  {user.role}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut size={15} />}
              title="Sign out of forensic session"
              style={{ color: '#f87171' }}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
