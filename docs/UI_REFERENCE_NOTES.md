# UI Reference & Design Architecture Notes

## 1. Study of Reference Applications (Fluenci & Quantara)
In accordance with Prompt 4 requirements, the architectural and interaction patterns of **Fluenci** and **Quantara** were analyzed for layout hierarchy, forensic data density, and human-in-the-loop workflows:

### A. Layout Hierarchy & Spacing
- **Sidebar Navigation**: Fixed left-rail with high-contrast active states, clear operational grouping, and Three-Tier Authorization badges (`AUTO`, `REVIEW`, `ONLY`) beside each module.
- **Header & Active Context**: Persistent global case selector displaying case number, legal status, cryptographic SHA-256 seal status, and active investigator identity.
- **Two-Column & Split Canvas**: Flexible grid layouts allowing simultaneous examination of competing hypotheses alongside leave-one-out dependency impacts.
- **Collapsible Inspector Drawers**: Right-side contextual inspection panels providing deep provenance drill-down without losing primary graph context.

### B. Interaction & Information Architecture Patterns
- **Decomposed Metrics (No Fused Score)**: Avoiding black-box composite scores by strictly rendering independent quantities (Corroboration Count, Dependency Delta in `pp`, Shannon EIG in bits, Contradiction Lists, Coverage Gaps).
- **Human-in-the-Loop Sovereign Gates**: Visual distinction for Tier-2 REVIEW actions requiring approval before state mutation, with transparent justification citations.
- **3D / 2D Graph Interactivity**: Meaningful 3D spatial node clustering with physics simulation, orbit controls, node-type visual cues, edge-type color coding (support=green, attack=red, derives=blue, contradicts=orange), and instant fallback to 2D canvas for low-end hardware.

---

## 2. KPYRIOS-ACPIA Original Visual Identity

| Token | Dark Palette (Default) | Light Palette | Forensic Semantics |
|---|---|---|---|
| `--color-bg-base` | `#070b13` (Deep Navy-Black) | `#f8fafc` (Slate Light) | Application root canvas |
| `--color-bg-panel` | `#0f172a` (Navy Charcoal) | `#ffffff` (Pure White) | Card & inspector containers |
| `--color-border` | `#1e293b` (Subtle Slate) | `#e2e8f0` (Border Gray) | Structural dividers & cards |
| `--color-primary` | `#3b82f6` (Electric Blue) | `#2563eb` (Royal Blue) | Primary actions & entities |
| `--color-success` | `#10b981` (Emerald Green) | `#059669` (Deep Emerald) | Support edges, SHA-256 verified |
| `--color-warning` | `#f59e0b` (Amber) | `#d97706` (Amber Ochre) | Tier-2 REVIEW gates, gaps |
| `--color-danger` | `#ef4444` (Crimson Red) | `#dc2626` (Crimson) | Attack edges, contradictions |
| `--color-text-primary` | `#f8fafc` (Crisp White) | `#0f172a` (Deep Slate) | Headings & high-priority text |
| `--color-text-secondary` | `#94a3b8` (Muted Slate) | `#475569` (Dark Slate) | Metadata, descriptions |
| `--color-text-muted` | `#64748b` (Dim Slate) | `#94a3b8` (Medium Gray) | Timestamps, secondary labels |

---

## 3. Interaction & Keyboard Accessibility Shortcuts
- `Ctrl + Shift + I` / `Cmd + Shift + I`: Advance Dual-Agent ReAct cycle.
- `Alt + A`: Approve selected pending Tier-2 review action.
- `Alt + R`: Reject selected pending Tier-2 review action.
- `Alt + G`: Toggle between 3D and 2D Evidence Graph view.
- `Escape`: Close any active modal or inspector drawer.
- `Tab / Shift + Tab`: Full keyboard focus navigation across all interactive elements with high-contrast outlines.
