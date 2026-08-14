import React from 'react';
import { useCase } from '../contexts/CaseContext';
import { CaseDashboard } from '../features/case-dashboard/CaseDashboard';

export const DashboardShell: React.FC = () => {
  const { activeCaseId, setActiveCase } = useCase();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <CaseDashboard
        activeCaseId={activeCaseId}
        onSelectCase={setActiveCase}
      />
    </div>
  );
};
