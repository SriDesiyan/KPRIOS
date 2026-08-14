import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardShell } from '../pages/DashboardShell';
import { AuthProvider } from '../contexts/AuthContext';
import { CaseProvider } from '../contexts/CaseContext';

describe('DashboardShell Component', () => {
  it('renders investigation cases dashboard and Kerala Police CyberDome title', () => {
    render(
      <AuthProvider>
        <CaseProvider>
          <BrowserRouter>
            <DashboardShell />
          </BrowserRouter>
        </CaseProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/Kerala Police CyberDome/i)).toBeInTheDocument();
    expect(screen.getByText(/Investigation Cases Management/i)).toBeInTheDocument();
    expect(screen.getByText(/New Investigation Case/i)).toBeInTheDocument();
  });
});
