import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Badge } from '../design-system/Badge';
import { Card } from '../design-system/Card';
import { AlertBanner } from '../design-system/AlertBanner';

describe('Design System Primitives', () => {
  it('renders Button with variants and handles click events', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Investigate Evidence
      </Button>
    );

    const btn = screen.getByRole('button', { name: /investigate evidence/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Input with label, placeholder and handles change', () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="Investigator Email"
        placeholder="officer@police.in"
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('officer@police.in');
    expect(screen.getByText('Investigator Email')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'test@police.in' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders Three-Tier Badges (AUTO, REVIEW, ONLY)', () => {
    render(
      <div>
        <Badge variant="auto">AUTO</Badge>
        <Badge variant="review">REVIEW</Badge>
        <Badge variant="only">ONLY</Badge>
      </div>
    );

    expect(screen.getByText('AUTO')).toBeInTheDocument();
    expect(screen.getByText('REVIEW')).toBeInTheDocument();
    expect(screen.getByText('ONLY')).toBeInTheDocument();
  });

  it('renders Card with title, subtitle and children', () => {
    render(
      <Card title="NetworkX Graph" subtitle="12 Nodes">
        <div>Evidence Nodes Content</div>
      </Card>
    );

    expect(screen.getByText('NetworkX Graph')).toBeInTheDocument();
    expect(screen.getByText('12 Nodes')).toBeInTheDocument();
    expect(screen.getByText('Evidence Nodes Content')).toBeInTheDocument();
  });

  it('renders AlertBanner with message', () => {
    render(<AlertBanner type="warning" message="Missing ISP logs for timestamp" />);
    expect(screen.getByText('Missing ISP logs for timestamp')).toBeInTheDocument();
  });
});
