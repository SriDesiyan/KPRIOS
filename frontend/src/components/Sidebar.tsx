import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Network,
  Activity,
  GitMerge,
  Bot,
  BrainCircuit,
  AlertTriangle,
  GitFork,
  FileCheck,
  ShieldCheck,
  FileText,
  Settings,
  Cpu,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  tier?: 'AUTO' | 'REVIEW' | 'ONLY';
}

const navItems: SidebarItem[] = [
  {
    name: 'Case Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: 'Evidence Explorer',
    path: '/dashboard/evidence',
    icon: <Files size={18} />,
    tier: 'AUTO',
  },
  {
    name: '3D Evidence Graph',
    path: '/dashboard/graph',
    icon: <Network size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Forensic Timeline',
    path: '/dashboard/timeline',
    icon: <Activity size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Entity Resolution',
    path: '/dashboard/proposals',
    icon: <GitMerge size={18} />,
    tier: 'REVIEW',
  },
  {
    name: 'Investigation Agent (ReAct)',
    path: '/dashboard/investigation',
    icon: <Bot size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Strategy Agent (EIG)',
    path: '/dashboard/strategy',
    icon: <BrainCircuit size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Contradictions & Gaps',
    path: '/dashboard/contradictions',
    icon: <AlertTriangle size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Competing Hypotheses',
    path: '/dashboard/hypotheses',
    icon: <GitFork size={18} />,
    tier: 'REVIEW',
  },
  {
    name: 'Three-Tier Approvals',
    path: '/dashboard/approvals',
    icon: <ShieldCheck size={18} />,
    tier: 'REVIEW',
  },
  {
    name: 'Case Brief Reports',
    path: '/dashboard/reports',
    icon: <FileText size={18} />,
    tier: 'REVIEW',
  },
  {
    name: 'Audit & Provenance Ledger',
    path: '/dashboard/audit',
    icon: <FileCheck size={18} />,
    tier: 'AUTO',
  },
  {
    name: 'Settings & RBAC',
    path: '/dashboard/settings',
    icon: <Settings size={18} />,
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
      }}
    >
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700 }}>
          Forensic Modules
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.8rem',
              borderRadius: '6px',
              color: isActive ? '#60a5fa' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.15s ease',
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </div>
            {item.tier && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  backgroundColor:
                    item.tier === 'AUTO'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : item.tier === 'REVIEW'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color:
                    item.tier === 'AUTO'
                      ? '#34d399'
                      : item.tier === 'REVIEW'
                      ? '#fbbf24'
                      : '#f87171',
                }}
              >
                {item.tier}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Provenance & Runtime Invariant Footer */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(7, 11, 19, 0.6)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Cpu size={14} color="#06b6d4" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dual-Agent LangGraph Core</span>
        </div>
        <div style={{ fontSize: '0.6875rem', lineHeight: 1.3 }}>
          Three.js 3D spatial graph & SHA-256 integrity active.
        </div>
      </div>
    </aside>
  );
};
