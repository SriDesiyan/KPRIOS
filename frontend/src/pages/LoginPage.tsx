import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { AlertBanner } from '../design-system/AlertBanner';
import { Shield, Lock, Mail, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('investigator@kpyrios.police.in');
  const [password, setPassword] = useState('Investigator@2026');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'investigator' | 'supervisor' | 'auditor') => {
    setError(null);
    if (role === 'investigator') {
      setEmail('investigator@kpyrios.police.in');
      setPassword('Investigator@2026');
    } else if (role === 'supervisor') {
      setEmail('supervisor@kpyrios.police.in');
      setPassword('Supervisor@2026');
    } else if (role === 'auditor') {
      setEmail('auditor@kpyrios.police.in');
      setPassword('Auditor@2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-base)',
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)',
        padding: '1.5rem',
      }}
    >
      <div
        className="forensic-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <Shield size={36} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.05em', color: '#f8fafc' }}>
            KPYRIOS-ACPIA
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Agentic Child Protection Investigation Assistant
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
              Kerala Police CyberDome • HACKP 2026
            </span>
          </div>
        </div>

        {/* Demo Quick Account Selectors */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            SELECT PRESET ROLE FOR DEMO EVALUATION:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleRoleSelect('investigator')}
              style={{
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: email.includes('investigator') ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                backgroundColor: email.includes('investigator') ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-surface)',
                color: email.includes('investigator') ? '#60a5fa' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Investigator
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('supervisor')}
              style={{
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: email.includes('supervisor') ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                backgroundColor: email.includes('supervisor') ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-surface)',
                color: email.includes('supervisor') ? '#c084fc' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Supervisor
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('auditor')}
              style={{
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: email.includes('auditor') ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
                backgroundColor: email.includes('auditor') ? 'rgba(20, 184, 166, 0.2)' : 'var(--bg-surface)',
                color: email.includes('auditor') ? '#2dd4bf' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Auditor
            </button>
          </div>
        </div>

        {error && (
          <AlertBanner
            type="error"
            title="Authentication Failure"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Officer / Investigator Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail size={16} />}
            placeholder="officer@kpyrios.police.in"
          />

          <Input
            label="Security Passphrase"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            isPassword
            leftIcon={<Lock size={16} />}
            placeholder="••••••••••••"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
            leftIcon={<KeyRound size={16} />}
          >
            Authenticate Session
          </Button>
        </form>

        {/* Legal & Security Invariant Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Protected Law Enforcement Intelligence System. All access attempts, token issuances, and queries are immutable and cryptographically audited.
        </div>
      </div>
    </div>
  );
};
