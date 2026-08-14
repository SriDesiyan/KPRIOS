/**
 * KPYRIOS-ACPIA Design Tokens
 * Visual Identity: CyberDome Law Enforcement Forensic Aesthetic
 * Palette: Deep Navy, Dark Charcoal, Slate, Restrained Electric Blue, Alert Accents
 */

export const colors = {
  // Backgrounds & Surface
  bg: {
    base: '#080c14',       // Deep forensic void
    surface: '#0d1321',    // Main dark container
    card: '#141c2e',       // Card and panel surface
    cardHover: '#1c263d',  // Elevated card on hover
    border: '#22304d',     // Subtle border line
    borderFocus: '#3b82f6',// Focused input border
  },
  
  // Brand & Accents
  brand: {
    primary: '#2563eb',    // Restrained Kerala Police Blue
    primaryHover: '#1d4ed8',
    primaryGlow: 'rgba(37, 99, 235, 0.25)',
    accent: '#06b6d4',     // Cyber CyberDome Teal
    accentGlow: 'rgba(6, 182, 212, 0.2)',
  },

  // Three-Tier Authorization Colors
  tiers: {
    auto: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#10b981',
      border: 'rgba(16, 185, 129, 0.35)',
    },
    review: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.35)',
    },
    only: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#ef4444',
      border: 'rgba(239, 68, 68, 0.35)',
    },
  },

  // Roles
  roles: {
    investigator: {
      bg: 'rgba(59, 130, 246, 0.15)',
      text: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.35)',
    },
    supervisor: {
      bg: 'rgba(168, 85, 247, 0.15)',
      text: '#c084fc',
      border: 'rgba(168, 85, 247, 0.35)',
    },
    auditor: {
      bg: 'rgba(20, 184, 166, 0.15)',
      text: '#2dd4bf',
      border: 'rgba(20, 184, 166, 0.35)',
    },
  },

  // Text & Typography
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    disabled: '#475569',
  },

  // Status & Feedback
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
};

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
};
