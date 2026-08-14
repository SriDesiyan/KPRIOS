import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { caseService } from '../../services/caseService';
import { Case } from '../../types/case';
import { CreateCaseModal } from './CreateCaseModal';
import {
  FolderPlus,
  Files,
  Users,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';

interface CaseDashboardProps {
  activeCaseId: string | null;
  onSelectCase: (caseItem: Case) => void;
}

export const CaseDashboard: React.FC<CaseDashboardProps> = ({ activeCaseId, onSelectCase }) => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await caseService.listCases();
      setCases(data);
      if (data.length > 0 && !activeCaseId) {
        onSelectCase(data[0]);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCaseId, onSelectCase]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCaseCreated = (newCase: Case) => {
    setCases((prev) => [newCase, ...prev]);
    onSelectCase(newCase);
  };

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner / Case Overview */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-primary)',
            }}>
              Kerala Police CyberDome • Child Protection Forensics
            </span>
            <Badge variant="success">Engine v0.2.0 Active</Badge>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Investigation Cases Management
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Deterministic ingestion, cryptographic hashing, and NetworkX evidentiary graph modeling
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <FolderPlus size={16} />
          <span>New Investigation Case</span>
        </Button>
      </div>

      {/* Active Case Decomposed Quantities Ribbon */}
      {activeCase && (
        <Card style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant="primary">{activeCase.case_number}</Badge>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {activeCase.title}
                </h2>
              </div>
              {activeCase.description && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {activeCase.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard/evidence')}
              >
                <Files size={14} />
                <span>Evidence Explorer</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard/graph')}
              >
                <Layers size={14} />
                <span>Evidence Graph</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard/timeline')}
              >
                <Activity size={14} />
                <span>Timeline</span>
              </Button>
            </div>
          </div>

          {/* 5 Decomposed Evidentiary Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                <Files size={16} />
                <span>INGESTED EVIDENCE</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                {activeCase.evidence_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Immutable SHA-256 verified
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600 }}>
                <Users size={16} />
                <span>EXTRACTED ENTITIES</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                {activeCase.entity_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                CAC-Ontology classes
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>PROVENANCE FACTS</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                {activeCase.fact_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Mandatory source_ids bound
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                <HelpCircle size={16} />
                <span>ACTIVE HYPOTHESES</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                {activeCase.hypothesis_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Competing propositions
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>COVERAGE GAPS</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                {activeCase.gap_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Missing corroboration points
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Case Catalog Cards */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
          All Registered Cases ({cases.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            Loading forensic cases...
          </div>
        ) : cases.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <FolderPlus size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No Cases Initialized Yet</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Create your first investigation container to begin ingesting evidence files, extracting entities, and building the NetworkX graph.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <FolderPlus size={16} />
              <span>Create Initial Case</span>
            </Button>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}>
            {cases.map((c) => {
              const isSelected = c.id === activeCaseId;
              return (
                <Card
                  key={c.id}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => onSelectCase(c)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <Badge variant="primary">{c.case_number}</Badge>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {c.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.5rem',
                    }}>
                      {c.description || 'No detailed description recorded.'}
                    </p>
                  </div>

                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <span><strong>{c.evidence_count}</strong> Evidence</span>
                      <span>•</span>
                      <span><strong>{c.entity_count}</strong> Entities</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      <span>{isSelected ? 'Active Case' : 'Select'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />
    </div>
  );
};
