import React from 'react';
import { Card } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Info, Clock } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  moduleKey: string;
  description: string;
  tier?: 'AUTO' | 'REVIEW' | 'ONLY';
  scheduledPhase: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  moduleKey,
  description,
  tier = 'AUTO',
  scheduledPhase,
}) => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Card
        title={title}
        subtitle={`Module Key: ${moduleKey}`}
        badge={
          <Badge
            variant={tier === 'AUTO' ? 'auto' : tier === 'REVIEW' ? 'review' : 'only'}
            showIcon
          >
            {tier} TIER
          </Badge>
        }
      >
        <div style={{ padding: '1rem 0' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Info size={18} color="#3b82f6" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                Forensic Module Specification
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Clock size={14} />
            <span>Scheduled Implementation: <strong>{scheduledPhase}</strong></span>
          </div>
        </div>
      </Card>
    </div>
  );
};
