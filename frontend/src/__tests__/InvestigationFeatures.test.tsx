import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EvidenceExplorer } from '../features/evidence-explorer/EvidenceExplorer';
import { TimelineView } from '../features/timeline/TimelineView';
import { EvidenceGraphView } from '../features/evidence-graph/EvidenceGraphView';
import { EntityProposalsDrawer } from '../features/entity-proposals/EntityProposalsDrawer';

describe('Investigation Engine Frontend Features', () => {
  it('renders EvidenceExplorer headers and upload CTA', () => {
    render(
      <BrowserRouter>
        <EvidenceExplorer activeCaseId="test-case-001" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Evidence Explorer & Integrity Registry/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Evidence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by filename/i)).toBeInTheDocument();
  });

  it('renders TimelineView with forensic chronology title', () => {
    render(
      <BrowserRouter>
        <TimelineView activeCaseId="test-case-001" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Forensic Chronological Timeline/i)).toBeInTheDocument();
  });

  it('renders EvidenceGraphView with NetworkX title and filter chips', () => {
    render(
      <BrowserRouter>
        <EvidenceGraphView activeCaseId="test-case-001" />
      </BrowserRouter>
    );

    expect(screen.getByText(/NetworkX Evidence Graph/i)).toBeInTheDocument();
    expect(screen.getByText('ENTITY')).toBeInTheDocument();
    expect(screen.getByText('FACT')).toBeInTheDocument();
    expect(screen.getByText('HYPOTHESIS')).toBeInTheDocument();
    expect(screen.getByText('EVIDENCE')).toBeInTheDocument();
  });

  it('renders EntityProposalsDrawer with zero auto-merge invariant banner', () => {
    render(
      <BrowserRouter>
        <EntityProposalsDrawer activeCaseId="test-case-001" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Candidate Entity Resolution Proposals/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Auto-Merge Invariant Active/i)).toBeInTheDocument();
    expect(screen.getByText(/REVIEW-TIER PROPOSALS/i)).toBeInTheDocument();
  });
});
