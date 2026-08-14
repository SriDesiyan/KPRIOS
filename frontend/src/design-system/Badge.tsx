import React from 'react';
import { ShieldCheck, Eye, AlertOctagon, UserCheck, ShieldAlert, Tag } from 'lucide-react';

export type BadgeVariant =
  | 'auto'
  | 'review'
  | 'only'
  | 'investigator'
  | 'supervisor'
  | 'auditor'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  showIcon = false,
  size = 'md',
  className = '',
  style,
  ...props
}) => {
  const getIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'sm' ? 12 : 14;
    switch (variant) {
      case 'auto':
        return <ShieldCheck size={iconSize} />;
      case 'review':
        return <Eye size={iconSize} />;
      case 'only':
        return <AlertOctagon size={iconSize} />;
      case 'investigator':
      case 'supervisor':
      case 'auditor':
        return <UserCheck size={iconSize} />;
      case 'danger':
        return <ShieldAlert size={iconSize} />;
      case 'primary':
        return <Tag size={iconSize} />;
      default:
        return null;
    }
  };

  const getCustomStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'auto':
        return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' };
      case 'review':
        return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' };
      case 'only':
        return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' };
      case 'primary':
      case 'investigator':
        return { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' };
      case 'supervisor':
        return { backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' };
      case 'auditor':
        return { backgroundColor: 'rgba(20, 184, 166, 0.12)', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.3)' };
      case 'success':
        return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' };
      case 'warning':
        return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' };
      case 'danger':
        return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        ...getCustomStyle(),
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        padding: size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.6rem',
        border: '1px solid',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style,
      }}
      {...props}
    >
      {getIcon()}
      <span>{children}</span>
    </span>
  );
};
