import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CaseProvider, useCase } from './contexts/CaseContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ShellLayout } from './components/ShellLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardShell } from './pages/DashboardShell';
import { EvidenceExplorer } from './features/evidence-explorer/EvidenceExplorer';
import { EvidenceGraph3DView } from './features/evidence-graph-3d/EvidenceGraph3DView';
import { TimelineView } from './features/timeline/TimelineView';
import { EntityProposalsDrawer } from './features/entity-proposals/EntityProposalsDrawer';
import { AgentReasoningView } from './features/agent-reasoning/AgentReasoningView';
import { GapPanel } from './features/gap-panel/GapPanel';
import { ReportBuilderView } from './features/reports/ReportBuilderView';
import { AuditTrailView } from './features/audit-trail/AuditTrailView';
import { SettingsView } from './features/settings/SettingsView';

// Context Wrapper Components
const EvidenceExplorerPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <EvidenceExplorer activeCaseId={activeCaseId} />;
};

const EvidenceGraphPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <EvidenceGraph3DView activeCaseId={activeCaseId} />;
};

const TimelinePage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <TimelineView activeCaseId={activeCaseId} />;
};

const EntityProposalsPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <EntityProposalsDrawer activeCaseId={activeCaseId} />;
};

const AgentReasoningPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <AgentReasoningView activeCaseId={activeCaseId} />;
};

const GapPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <GapPanel activeCaseId={activeCaseId} />;
};

const AuditPage: React.FC = () => {
  const { activeCaseId } = useCase();
  return <AuditTrailView activeCaseId={activeCaseId} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CaseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ShellLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardShell />} />
                <Route path="/dashboard/evidence" element={<EvidenceExplorerPage />} />
                <Route path="/dashboard/graph" element={<EvidenceGraphPage />} />
                <Route path="/dashboard/timeline" element={<TimelinePage />} />
                <Route path="/dashboard/proposals" element={<EntityProposalsPage />} />

                {/* Agent & Reasoning Screens */}
                <Route path="/dashboard/investigation" element={<AgentReasoningPage />} />
                <Route path="/dashboard/strategy" element={<AgentReasoningPage />} />
                <Route path="/dashboard/contradictions" element={<GapPage />} />
                <Route path="/dashboard/hypotheses" element={<AgentReasoningPage />} />
                <Route path="/dashboard/approvals" element={<AgentReasoningPage />} />

                {/* Reports, Audit & Settings Screens */}
                <Route path="/dashboard/reports" element={<ReportBuilderView />} />
                <Route path="/dashboard/audit" element={<AuditPage />} />
                <Route path="/dashboard/settings" element={<SettingsView />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CaseProvider>
    </AuthProvider>
  );
};
