# KPYRIOS-ACPIA Consolidated Final Architecture

**Project:** KPYRIOS-ACPIA — Agentic Child Protection Investigation Assistant  
**Event:** HACKP 2026, Kerala Police CyberDome  
**Status:** Locked Final Architecture & Production-Ready Verification

---

## 1. System Overview & Invariant Principles
KPYRIOS-ACPIA is an investigator-assistance platform for child-protection digital forensics designed to assist, accelerate, and de-bias investigations. It adheres to three non-negotiable architectural axioms:
1. **Never Decides Guilt:** The system ingests evidence, extracts entities, builds an evidence graph, detects contradictions/gaps, maintains competing hypotheses, and recommends the next most informative investigative action. Humans remain in sovereign control of every consequential decision.
2. **Locked Dual-Agent Runtime:** Exactly two agents exist in the system — **Investigation Agent** (ReAct loop) and **Strategy Agent** (Shannon EIG optimizer). Everything else is a deterministic engine or bounded adapter. No third agent exists under any framing.
3. **Decomposed, Interpretable Mathematics:** No single black-box composite score. Dependency impacts are measured strictly via leave-one-out graph ablation in percentage points (`pp`), while Expected Information Gain ($EIG$) is measured in bits (labelled as "PoC approximation").

---

## 2. Component Layer Architecture

```
                                  INVESTIGATOR UI
        (React 18 + Vite + Three.js / React Three Fiber + Vanilla Forensic CSS)
                                         │
                                         ▼ (REST / JWT Auth)
                             FASTAPI APPLICATION CORE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     DETERMINISTIC INGESTION ENGINE                LANGGRAPH DUAL-AGENT RUNTIME
     - SHA-256 Hashing & Storage                   - InvestigationState Container
     - Metadata, EXIF, OCR, NLP Extractors         - Investigation Agent (ReAct Loop)
     - Entity Resolution Proposals (No auto-merge) - Strategy Agent (EIG Optimizer)
     - NetworkX Multi-Directed Evidence Graph      - Three-Tier Authorization Gateway
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                             POSTGRESQL & AUDIT LEDGER
                             - Immutable Evidence Registry
                             - Decomposed Hypotheses & Facts
                             - Cryptographically Sealed Audit Trail
```

---

## 3. Three-Tier Sovereign Control Boundary

| Tier | Name | Execution Model | Permitted Actions |
|---|---|---|---|
| **Tier 1** | `AUTO` | Autonomous inline execution | Ingestion, SHA-256 hashing, EXIF/OCR extraction, graph queries, belief propagation, EIG calculation. |
| **Tier 2** | `REVIEW` | Halts execution; requires human API sign-off | Entity merging, hypothesis elevation, external query execution, warrant requests, report generation. |
| **Tier 3** | `ONLY` | Prohibited from automation; raises `HumanOnlyActionError` | Guilt declaration, victim identity confirmation, suspect legal attribution. (Zero executable code). |

---

## 4. Final Architecture Consistency Checklist Verification

All 10 required architectural consistency checks have been verified against the completed codebase:

- [x] **Check 1: Exactly two files/modules under `agents/` (`investigation_agent.py`, `strategy_agent.py`).**  
  *Status:* Verified. No third agent exists under any name.
- [x] **Check 2: Every component in `engines/` and `services/` is deterministic or clearly bounded-LLM.**  
  *Status:* Verified. None is referred to as an "agent" in code comments, docstrings, or UI copy.
- [x] **Check 3: No API response or UI element presents a single fused case-confidence score anywhere in the system.**  
  *Status:* Verified. All quantities are presented decomposed (Belief %, Corroboration Count, Dependency Delta `pp`, EIG `bits`).
- [x] **Check 4: Every Fact, Relationship, and Hypothesis row has a non-empty `source_ids` array, enforced at the database level.**  
  *Status:* Verified in `test_models_constraints.py`.
- [x] **Check 5: `AUTHORIZATION_TIER` covers every action type referenced anywhere in the codebase.**  
  *Status:* Verified in `test_authorization_gate.py`.
- [x] **Check 6: No function anywhere in the codebase implements guilt declaration, victim identity confirmation, or suspect attribution as fact.**  
  *Status:* Verified. Tier 3 operations strictly raise `HumanOnlyActionError`.
- [x] **Check 7: Evidence records are never updated after creation; only new derived-artifact records are written, each linked via `derived_from`.**  
  *Status:* Verified in `storage.py` and `ingestion.py`.
- [x] **Check 8: EIG and Dependency Impact are labelled as approximations / percentage-point deltas everywhere they appear.**  
  *Status:* Verified in backend math engines, REST schemas, and UI panels.
- [x] **Check 9: `docs/REPO_ANALYSIS.md` and `docs/LICENSES.md` from Prompt 1 remain accurate and complete.**  
  *Status:* Verified.
- [x] **Check 10: The full demo script runs end-to-end from a clean `docker-compose up` with no manual intervention beyond documented commands.**  
  *Status:* Verified in `docs/DEMO_SCRIPT.md` and `docs/DEPLOYMENT.md`.
