import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { Input } from '../../design-system/Input';
import { evidenceService } from '../../services/evidenceService';
import { EvidenceItem, EvidenceModality } from '../../types/evidence';
import { UploadEvidenceModal } from './UploadEvidenceModal';
import { EvidenceDetailModal } from '../evidence-detail/EvidenceDetailModal';
import {
  UploadCloud,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  PhoneCall,
  Wifi,
  Video,
  ExternalLink,
} from 'lucide-react';

interface EvidenceExplorerProps {
  activeCaseId: string | null;
}

export const EvidenceExplorer: React.FC<EvidenceExplorerProps> = ({ activeCaseId }) => {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  const fetchEvidence = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const data = await evidenceService.listCaseEvidence(activeCaseId);
      setEvidenceItems(data);
    } catch (err) {
      console.error('Failed to load evidence items:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleUploadSuccess = (newItem: EvidenceItem) => {
    setEvidenceItems((prev) => [newItem, ...prev]);
  };

  // Filter items
  const filteredItems = evidenceItems.filter((item) => {
    const matchesSearch =
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.modality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModality === 'ALL' || item.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  const getModalityIcon = (modality: EvidenceModality) => {
    switch (modality) {
      case 'IMAGE':
        return <ImageIcon size={16} style={{ color: 'var(--color-primary)' }} />;
      case 'CHAT_LOG':
        return <MessageSquare size={16} style={{ color: '#38bdf8' }} />;
      case 'CALL_RECORD':
        return <PhoneCall size={16} style={{ color: '#fbbf24' }} />;
      case 'NETWORK_PCAP':
        return <Wifi size={16} style={{ color: '#a78bfa' }} />;
      case 'VIDEO':
        return <Video size={16} style={{ color: '#f472b6' }} />;
      default:
        return <FileText size={16} style={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Evidence Explorer & Integrity Registry
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Immutable SHA-256 verified digital artifacts, extraction summaries, and trust vectors
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadOpen(true)}
          disabled={!activeCaseId}
        >
          <UploadCloud size={16} />
          <span>Upload Evidence</span>
        </Button>
      </div>

      {/* Control Bar: Search & Modality Filters */}
      <Card style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Search Box */}
          <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, SHA-256, or type..."
            />
          </div>

          {/* Modality Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['ALL', 'IMAGE', 'DOCUMENT', 'CHAT_LOG', 'CALL_RECORD', 'NETWORK_PCAP'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModality(m)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: selectedModality === m ? 'var(--color-primary)' : 'var(--color-bg-base)',
                  borderColor: selectedModality === m ? 'var(--color-primary)' : 'var(--color-border)',
                  color: selectedModality === m ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Evidence Table */}
      {!activeCaseId ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Please select an investigation case from the dashboard to explore evidence.
          </p>
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading case evidence items...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <UploadCloud size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Evidence Items Found</h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Upload evidence files (images, chat transcripts, PCAP) to automatically compute SHA-256 hashes and extract entities.
          </p>
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={16} />
            <span>Upload Initial Evidence</span>
          </Button>
        </Card>
      ) : (
        <div style={{
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                background: 'var(--color-bg-base)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <th style={{ padding: '0.75rem 1rem' }}>Artifact Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Modality</th>
                <th style={{ padding: '0.75rem 1rem' }}>SHA-256 Hash</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trust Vector</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ingested At</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {getModalityIcon(item.modality)}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {item.file_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {(item.file_size_bytes / 1024).toFixed(1)} KB • {item.mime_type}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge variant="neutral">{item.modality}</Badge>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} style={{ color: '#34d399' }} />
                      <code style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        {item.hash.substring(0, 12)}...
                      </code>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span title="Reliability" style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--color-primary)',
                      }}>
                        R:{Math.round((item.trust_vector?.reliability || 1) * 100)}%
                      </span>
                      <span title="Authenticity" style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                      }}>
                        A:{Math.round((item.trust_vector?.authenticity || 1) * 100)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {new Date(item.ingested_at).toLocaleDateString()} {new Date(item.ingested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      <ExternalLink size={12} />
                      <span>Inspect</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {activeCaseId && (
        <UploadEvidenceModal
          caseId={activeCaseId}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Detail Modal */}
      <EvidenceDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};
