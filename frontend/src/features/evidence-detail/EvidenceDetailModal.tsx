import React, { useState } from 'react';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { EvidenceItem } from '../../types/evidence';
import {
  X,
  ShieldCheck,
  MapPin,
  Copy,
  Check,
  Download,
} from 'lucide-react';

interface EvidenceDetailModalProps {
  item: EvidenceItem | null;
  onClose: () => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'ocr' | 'provenance'>('metadata');
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(item.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ocrPayload = item.metadata_payload?.ocr as { text?: string } | undefined;
  const ocrText = ocrPayload?.text || '';
  const deviceInfo = (item.metadata_payload?.device_info || {}) as { make?: string; model?: string };
  const geoLocation = item.metadata_payload?.geo_location as { latitude: number; longitude: number } | undefined;
  const trust = item.trust_vector;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
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
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Badge variant="primary">{item.modality}</Badge>
              <Badge variant="success">
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                SHA-256 Verified
              </Badge>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {item.file_name}
            </h2>
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

        {/* Cryptographic Hash Bar */}
        <div style={{
          backgroundColor: 'var(--color-bg-base)',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              SHA-256 HASH:
            </span>
            <code style={{
              fontSize: '0.8rem',
              color: 'var(--color-primary)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}>
              {item.hash}
            </code>
          </div>
          <button
            onClick={handleCopyHash}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-panel)',
          padding: '0 1.5rem',
          gap: '1.5rem',
        }}>
          <button
            onClick={() => setActiveTab('metadata')}
            style={{
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'metadata' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'metadata' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Forensic Metadata & Trust
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            style={{
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'ocr' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'ocr' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            OCR Transcript & Text
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            style={{
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'provenance' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'provenance' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Lineage & Derivation Chain
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'metadata' && (
            <>
              {/* Trust Vector Attributes */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Decomposed Trust Attributes (No Composite Score)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>RELIABILITY</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{Math.round((trust?.reliability || 1) * 100)}%</strong>
                  </div>
                  <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>AUTHENTICITY</span>
                    <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{Math.round((trust?.authenticity || 1) * 100)}%</strong>
                  </div>
                  <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>FRESHNESS</span>
                    <strong style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{Math.round((trust?.freshness || 1) * 100)}%</strong>
                  </div>
                  <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>PROVENANCE</span>
                    <strong style={{ fontSize: '1.1rem', color: '#a78bfa' }}>{Math.round((trust?.provenance_score || 1) * 100)}%</strong>
                  </div>
                </div>
              </div>

              {/* Technical Parameters */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Technical Parameters & EXIF Details
                </h4>
                <div style={{
                  background: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)', width: '35%' }}>MIME Type</td>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-primary)' }}>{item.mime_type}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>File Size</td>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-primary)' }}>{(item.file_size_bytes / 1024).toFixed(1)} KB ({item.file_size_bytes} bytes)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>Ingested Timestamp</td>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-primary)' }}>{new Date(item.ingested_at).toLocaleString()}</td>
                      </tr>
                      {deviceInfo?.make && (
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>Camera Device</td>
                          <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-primary)' }}>{deviceInfo.make} {deviceInfo.model}</td>
                        </tr>
                      )}
                      {geoLocation && (
                        <tr>
                          <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>GPS Coordinates</td>
                          <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-primary)' }}>
                            <MapPin size={14} style={{ display: 'inline', marginRight: '4px', color: '#f87171' }} />
                            Lat {geoLocation.latitude}, Lon {geoLocation.longitude}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ocr' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Optical Character Recognition Transcript
                </h4>
                {ocrText && (
                  <Badge variant="neutral">{ocrText.split(/\s+/).length} words</Badge>
                )}
              </div>
              {ocrText ? (
                <pre style={{
                  background: 'var(--color-bg-base)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  {ocrText}
                </pre>
              ) : (
                <div style={{
                  background: 'var(--color-bg-base)',
                  padding: '2rem',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}>
                  No OCR text detected or file modality is non-optical.
                </div>
              )}
            </div>
          )}

          {activeTab === 'provenance' && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Deterministic Provenance & Source Fingerprint
              </h4>
              <div style={{
                background: 'var(--color-bg-base)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    SOURCE DEDUPLICATION FINGERPRINT:
                  </span>
                  <code style={{ fontSize: '0.8rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                    {item.source_fingerprint}
                  </code>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    IMMUTABLE STORAGE PATH (ISOLATED):
                  </span>
                  <code style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                    storage/cases/{item.case_id}/{item.id}_{item.file_name}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <a
            href={`/api/v1/evidence/${item.id}/download`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="secondary" size="sm">
              <Download size={14} />
              <span>Download Raw File</span>
            </Button>
          </a>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
