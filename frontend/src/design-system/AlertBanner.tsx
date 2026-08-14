import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export interface AlertBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const config = {
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#93c5fd',
      icon: <Info size={18} color="#60a5fa" />,
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#fde68a',
      icon: <AlertTriangle size={18} color="#fbbf24" />,
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#fca5a5',
      icon: <XCircle size={18} color="#f87171" />,
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#a7f3d0',
      icon: <CheckCircle2 size={18} color="#34d399" />,
    },
  }[type];

  return (
    <div
      className={`alert-banner ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '6px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        marginBottom: '1rem',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{config.icon}</div>
      <div style={{ flex: 1, fontSize: '0.875rem' }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.7,
            padding: '2px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
