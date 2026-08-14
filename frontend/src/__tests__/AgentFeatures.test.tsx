import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisPanel } from '../features/hypothesis-panel/HypothesisPanel';
import { DependencyPanel } from '../features/dependency-panel/DependencyPanel';
import { StrategyRecommendations } from '../features/strategy-recommendations/StrategyRecommendations';
import { ApprovalQueue } from '../features/approval-queue/ApprovalQueue';
import { Hypothesis, CandidateAction, PendingAction } from '../types/agent';

describe('Agent Reasoning Frontend Components', () => {
  it('renders HypothesisPanel with belief distributions and support counts', () => {
    const mockHypotheses: Hypothesis[] = [
      {
        id: 'h1',
        statement: 'Suspect operated Telegram channel',
        status: 'ACTIVE',
        belief: 0.72,
        prior_probability: 0.5,
        support_count: 3,
        attack_count: 0,
        source_ids: ['e1', 'e2'],
      },
      {
        id: 'h2',
        statement: 'Device infected by RAT malware',
        status: 'CONTESTED',
        belief: 0.28,
        prior_probability: 0.5,
        support_count: 1,
        attack_count: 2,
        source_ids: ['e3'],
      },
    ];

    const onSelect = vi.fn();

    render(
      <HypothesisPanel
        hypotheses={mockHypotheses}
        selectedHypothesisId="h1"
        onSelectHypothesis={onSelect}
      />
    );

    expect(screen.getByText('Suspect operated Telegram channel')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('28%')).toBeInTheDocument();
    expect(screen.getByText('CONTESTED')).toBeInTheDocument();

    // Click on hypothesis to trigger selection
    fireEvent.click(screen.getByText('Device infected by RAT malware'));
    expect(onSelect).toHaveBeenCalledWith('h2');
  });

  it('renders StrategyRecommendations with EIG score and PoC approximation label', () => {
    const mockRecs: CandidateAction[] = [
      {
        id: 'rec-1',
        action_type: 'request_isp_subscriber_records',
        description: 'Request ISP IP subscriber records for active chat timestamps',
        eig_score: 0.421,
        justification: 'Discriminates between suspect identity vs third-party operator.',
        tier: 'REVIEW',
        payload: { authority: 'Section 91' },
        discriminates_between: ['h1', 'h2'],
        is_poc_approximation: true,
      },
    ];

    const onCycle = vi.fn();

    render(
      <StrategyRecommendations
        caseId="case-1"
        recommendations={mockRecs}
        onCycleCompleted={onCycle}
      />
    );

    expect(screen.getByText('Request ISP IP subscriber records for active chat timestamps')).toBeInTheDocument();
    expect(screen.getByText(/EIG: 0.421 bits \(PoC approx\)/i)).toBeInTheDocument();
    expect(screen.getByText('TIER: REVIEW')).toBeInTheDocument();
    expect(screen.getByText('Advance Agent Cycle')).toBeInTheDocument();
  });

  it('renders ApprovalQueue with pending Tier-2 review action and approval button', () => {
    const mockPending: PendingAction[] = [
      {
        id: 'act-10',
        action_type: 'merge_candidate_entities',
        description: 'Candidate Entity Merge: @anand_cyber and Anand Kumar',
        tier: 'REVIEW',
        requested_at: new Date().toISOString(),
        status: 'PENDING',
        payload: { source: 'ent1', target: 'ent2' },
      },
    ];

    const onDecided = vi.fn();

    render(
      <ApprovalQueue
        pendingActions={mockPending}
        onActionDecided={onDecided}
      />
    );

    expect(screen.getByText('Candidate Entity Merge: @anand_cyber and Anand Kumar')).toBeInTheDocument();
    expect(screen.getByText('AWAITING APPROVAL')).toBeInTheDocument();
    expect(screen.getByText('Approve & Resume State')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders DependencyPanel with percentage points invariant note', () => {
    render(
      <DependencyPanel
        caseId="case-1"
        selectedHypothesisId="h1"
        selectedHypothesisStatement="Primary Hypothesis"
      />
    );

    expect(screen.getByText(/Dependency impact is measured strictly in percentage points \(pp\)/i)).toBeInTheDocument();
  });
});
