import React, { useState, useRef } from 'react';
import { Button } from '../../design-system/Button';
import { evidenceService } from '../../services/evidenceService';
import { EvidenceItem, IngestionResult } from '../../types/evidence';
import { X, UploadCloud, AlertCircle, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface UploadEvidenceModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (item: EvidenceItem) => void;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  caseId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalityOverride, setModalityOverride] = useState<string>('');
  const [reliability, setReliability] = useState<number>(1.0);
  const [authenticity, setAuthenticity] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<IngestionResult | null>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an evidence file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await evidenceService.uploadEvidence(
        caseId,
        selectedFile,
        modalityOverride || undefined,
        reliability,
        authenticity
      );
      setUploadResult(result);
      onUploadSuccess(result.evidence_item);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evidence upload failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '560px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Ingest Evidence Artifact
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Automated SHA-256 Hashing • EXIF/OCR • NLP Entity Extraction
              </p>
            </div>
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

        {uploadResult ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <CheckCircle2 size={24} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Evidence Successfully Ingested & Verified</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  SHA-256: <code>{uploadResult.evidence_item.hash.substring(0, 16)}...</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{
                background: 'var(--color-bg-base)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Extracted Entities</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                  {uploadResult.extracted_entities.length}
                </div>
              </div>
              <div style={{
                background: 'var(--color-bg-base)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Extracted Facts & Timestamps</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                  {uploadResult.extracted_facts.length}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="primary" onClick={onClose}>
                Done & View in Explorer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                color: '#ef4444',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: selectedFile ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-bg-base)',
                borderColor: selectedFile ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              {selectedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon size={36} style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <FileText size={36} style={{ color: 'var(--color-primary)' }} />
                  )}
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedFile.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Generic Document'}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={36} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Click or drag forensic artifact here
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Images (JPG, PNG), Transcripts (TXT, JSON, CSV), PCAP, Documents
                  </span>
                </div>
              )}
            </div>

            {/* Modality Override */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                Forensic Modality Classification
              </label>
              <select
                value={modalityOverride}
                onChange={(e) => setModalityOverride(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="">Auto-Detect from File Header / MIME</option>
                <option value="IMAGE">IMAGE (EXIF & OCR Processing)</option>
                <option value="DOCUMENT">DOCUMENT (Text & Entity Extraction)</option>
                <option value="CHAT_LOG">CHAT_LOG (Message & Participant Parser)</option>
                <option value="CALL_RECORD">CALL_RECORD (CDR & Phone Telephony)</option>
                <option value="NETWORK_PCAP">NETWORK_PCAP (Packet Trace)</option>
                <option value="VIDEO">VIDEO (Media Metadata)</option>
                <option value="AUDIO">AUDIO (Audio Artifact)</option>
              </select>
            </div>

            {/* Trust Vector Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    Initial Reliability
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {Math.round(reliability * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={reliability}
                  onChange={(e) => setReliability(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    Authenticity Rating
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                    {Math.round(authenticity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={authenticity}
                  onChange={(e) => setAuthenticity(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading || !selectedFile}>
                {loading ? 'Ingesting & Hashing...' : 'Ingest Evidence'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
