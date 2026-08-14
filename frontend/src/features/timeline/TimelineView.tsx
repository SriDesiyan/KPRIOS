import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { timelineService } from '../../services/timelineService';
import { TimelineEvent } from '../../types/timeline';
import {
  Clock,
  Calendar,
  ShieldCheck,
  MapPin,
  MessageSquare,
  FileText,
  Activity,
} from 'lucide-react';

interface TimelineViewProps {
  activeCaseId: string | null;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ activeCaseId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const data = await timelineService.getCaseTimeline(activeCaseId);
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'GEO_LOCATION':
        return <MapPin size={16} style={{ color: '#f87171' }} />;
      case 'COMMUNICATION':
      case 'CHAT_MESSAGE':
        return <MessageSquare size={16} style={{ color: '#38bdf8' }} />;
      case 'TIMELINE_EVENT':
        return <Clock size={16} style={{ color: '#fbbf24' }} />;
      default:
        return <FileText size={16} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Forensic Chronological Timeline
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Extracted EXIF timestamps, message activities, and technical observation events
        </p>
      </div>

      {!activeCaseId ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Please select an investigation case to view timeline events.
          </p>
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading forensic timeline...
        </div>
      ) : events.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <Activity size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Timeline Events Extracted</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Upload evidence with EXIF timestamps or date-stamped chat logs to populate the forensic timeline.
          </p>
        </Card>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical Timeline Guide Line */}
          <div style={{
            position: 'absolute',
            left: '11px',
            top: '10px',
            bottom: '10px',
            width: '2px',
            background: 'var(--color-border)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {events.map((ev) => {
              const dt = new Date(ev.timestamp);
              return (
                <div key={ev.id} style={{ position: 'relative', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  {/* Timeline node badge */}
                  <div style={{
                    position: 'absolute',
                    left: '-2rem',
                    top: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-bg-panel)',
                    border: '2px solid var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  </div>

                  {/* Event Card */}
                  <Card style={{ flex: 1, padding: '1.25rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '0.5rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getEventIcon(ev.event_type)}
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {ev.title}
                        </span>
                        <Badge variant="neutral">{ev.event_type}</Badge>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <Calendar size={14} />
                        <span>{dt.toLocaleDateString()}</span>
                        <Clock size={14} />
                        <span>{dt.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 0.75rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {ev.description}
                    </p>

                    {/* Source Provenance Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
                        <ShieldCheck size={14} />
                        <span>Source: <strong>{ev.evidence_file_name || ev.source_ids[0]?.substring(0, 8)}</strong></span>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Confidence: {Math.round(ev.confidence * 100)}%
                      </span>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
