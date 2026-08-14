import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
  hoverEffect = false,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`forensic-card ${className}`}
      style={{
        ...style,
        transition: hoverEffect ? 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease' : undefined,
      }}
      {...props}
    >
      {(title || subtitle || badge || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {title && (
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
