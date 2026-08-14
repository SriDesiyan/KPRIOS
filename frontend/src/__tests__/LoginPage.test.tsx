import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';

describe('LoginPage Component', () => {
  it('renders KPYRIOS title and login form elements', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('KPYRIOS-ACPIA')).toBeInTheDocument();
    expect(screen.getByText(/Kerala Police CyberDome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Officer \/ Investigator Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Security Passphrase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticate Session/i })).toBeInTheDocument();
  });

  it('updates form values when demo preset role buttons are clicked', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const supervisorBtn = screen.getByRole('button', { name: 'Supervisor' });
    fireEvent.click(supervisorBtn);

    const emailInput = screen.getByLabelText(/Officer \/ Investigator Email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('supervisor@kpyrios.police.in');

    const auditorBtn = screen.getByRole('button', { name: 'Auditor' });
    fireEvent.click(auditorBtn);
    expect(emailInput.value).toBe('auditor@kpyrios.police.in');
  });
});
