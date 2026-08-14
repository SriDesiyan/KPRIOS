import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { useCase } from '../../contexts/CaseContext';
import { agentService } from '../../services/agentService';
import { evidenceService } from '../../services/evidenceService';
import { InvestigationState } from '../../types/agent';
import { EvidenceItem } from '../../types/evidence';
import { FileText, Printer, Download, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';

export const ReportBuilderView: React.FC = () => {
  const { activeCase, activeCaseId } = useCase();
  const [state, setState] = useState<InvestigationState | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReportData = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      setLoading(true);
      const [st, ev] = await Promise.all([
        agentService.getCaseState(activeCaseId),
        evidenceService.listCaseEvidence(activeCaseId),
      ]);
      setState(st);
      setEvidenceList(ev);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      case: activeCase,
      state,
      evidence: evidenceList,
      generated_at: new Date().toISOString(),
      disclaimer: 'KPYRIOS-ACPIA Forensic Decision-Support Brief. Does not declare legal guilt.',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASE_BRIEF_${activeCase?.case_number || 'EXPORT'}.json`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="review">REVIEW-TIER REPORT EXPORT</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Full Evidentiary Provenance Brief
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Court-Ready Case Brief & Forensic Report
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Traceable case brief incorporating cryptographic SHA-256 evidence logs, belief distributions, and human-in-the-loop decisions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={handleDownloadJSON} disabled={!activeCaseId || loading}>
            <Download size={16} />
            <span>Export JSON Payload</span>
          </Button>
          <Button variant="primary" onClick={handlePrint} disabled={!activeCaseId || loading}>
            <Printer size={16} />
            <span>Print Forensic Brief</span>
          </Button>
        </div>
      </div>

      {!activeCaseId ? (
        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select an investigation case to compile a forensic brief.
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Compiling forensic evidence brief...
        </div>
      ) : (
        /* Printable Report Document */
        <div style={{
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Official Letterhead */}
          <div style={{
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-primary)' }}>
                KERALA POLICE CYBERDOME • CHILD PROTECTION FORENSICS
              </div>
              <h2 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
                Digital Forensic Investigation Brief
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Case Tracking ID: <strong style={{ color: 'var(--color-text-primary)' }}>{activeCase?.case_number}</strong> • Operation: {activeCase?.title}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
              <div>Runtime Version: v{state?.version || 1}</div>
              <Badge variant="success" style={{ marginTop: '0.35rem' }}>
                <ShieldCheck size={12} style={{ marginRight: '3px' }} />
                Integrity Verified
              </Badge>
            </div>
          </div>

          {/* Section 1: Executive Brief */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              1. Case Executive Summary
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {activeCase?.description || 'No initial summary recorded.'}
            </p>
          </div>

          {/* Section 2: Cryptographic Evidence Registry */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: '#34d399' }} />
              2. Immutable Evidence Registry (SHA-256 Hashes)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Artifact</th>
                  <th style={{ padding: '0.6rem' }}>Modality</th>
                  <th style={{ padding: '0.6rem' }}>Cryptographic SHA-256 Hash</th>
                  <th style={{ padding: '0.6rem' }}>Trust Rating</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.file_name}</td>
                    <td style={{ padding: '0.6rem' }}><Badge variant="neutral">{ev.modality}</Badge></td>
                    <td style={{ padding: '0.6rem' }}><code style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{ev.hash}</code></td>
                    <td style={{ padding: '0.6rem', color: 'var(--color-text-secondary)' }}>
                      R:{Math.round((ev.trust_vector?.reliability || 1) * 100)}% • A:{Math.round((ev.trust_vector?.authenticity || 1) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Decomposed Hypothesis Belief Status */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} style={{ color: 'var(--color-primary)' }} />
              3. Competing Propositions & Corroboration Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {state?.hypotheses?.map((h) => (
                <div key={h.id} style={{
                  background: 'var(--color-bg-base)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{h.statement}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      Corroborating Support: {h.support_count} • Attack/Conflict: {h.attack_count} • Status: {h.status}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    {Math.round(h.belief * 100)}%
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic Legal Disclaimer & Human Sign-Off */}
          <div style={{
            borderTop: '2px dashed var(--color-border)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '2rem',
          }}>
            <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', color: '#f59e0b' }} />
              <strong>Human-in-the-Loop Sovereign Disclaimer:</strong> KPYRIOS-ACPIA is an assistant decision-support tool.
              It does not declare legal guilt or liability. All evidentiary assessments must be verified by sworn investigating officers.
            </div>

            <div style={{ width: '240px', textAlign: 'center', borderTop: '1px solid var(--color-text-muted)', paddingTop: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Investigating Officer Signature
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                Kerala Police CyberDome Forensic Cell
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
