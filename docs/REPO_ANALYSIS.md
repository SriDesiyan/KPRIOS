# Reference Repository Analysis & Reuse Decisions
**Project:** KPYRIOS-ACPIA (Agentic Child Protection Investigation Assistant)  
**Hackathon:** HACKP 2026 — Kerala Police CyberDome  
**Status:** Mandatory Deliverable — Phase 1 Technical Foundation  

---

## 1. Overview & Evaluation Framework

In establishing the foundation for KPYRIOS-ACPIA, ten reference repositories in the workspace were subjected to technical and legal evaluation against the project's non-negotiable architectural invariants:
1. **Never Decides Guilt:** The platform provides investigator assistance only; humans control every consequential decision.
2. **Exactly Two Agents:** Investigation Agent (ReAct loop) and Strategy Agent (EIG ranking & gap analysis). Everything else (ingestion, hashing, OCR, NLP, graph algorithms, EIG math) is deterministic Python code.
3. **No Fused Composite Score:** Decomposed, individually interpretable quantities only (Corroboration Count, Dependency Impact, Contradiction List, Coverage Gaps, Hypothesis Support/Attack, EIG).
4. **Three-Tier Authorization:** AUTO / REVIEW / ONLY enforced strictly in code.
5. **Structural Provenance:** Every fact, relationship, and hypothesis must have a non-empty `source_ids` array.
6. **Immutable Evidence & Injection Defense:** SHA-256 on ingestion; data treated as data (structured JSON only), never as agent commands.

---

## 2. Exhaustive Repository Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              REFERENCE REPOSITORIES INVENTORY                                │
├────┬─────────────────────────────┬──────────────────┬───────────────────┬──────────────────┤
│ #  │ Repository Directory        │ License          │ Domain Mapping    │ Decision         │
├────┼─────────────────────────────┼──────────────────┼───────────────────┼──────────────────┤
│ 1  │ ArkhamMirror-main           │ MIT              │ Graph/Timeline UI │ REFERENCE-ONLY   │
│ 2  │ CAC-Ontology-main           │ Apache 2.0       │ Ontology/Schema   │ CONCEPT-REUSE    │
│ 3  │ ChildShield-Forensics-main  │ MIT              │ Forensic Workflow │ CONCEPT-REUSE    │
│ 4  │ DFIR-Companion-master       │ AGPLv3           │ Workflow / UI     │ REJECT (Code) /  │
│    │                             │                  │                   │ REFERENCE-ONLY   │
│ 5  │ Fluenci-main (1)            │ Proprietary      │ Visual UI/UX      │ REFERENCE-ONLY   │
│ 6  │ IPED-master                 │ GPLv3            │ Forensic Ingest   │ REJECT (Code) /  │
│    │                             │                  │                   │ REFERENCE-ONLY   │
│ 7  │ KSPDatathon-main            │ MIT              │ Police UX / Audit │ CONCEPT-REUSE    │
│ 8  │ Qantara-main                │ MIT              │ UI Architecture   │ REFERENCE-ONLY   │
│ 9  │ solve-it-main               │ MIT              │ Forensic KB       │ CONCEPT-REUSE    │
│ 10 │ VolWeb-main                 │ GPLv3            │ Evidence Display  │ REJECT (Code) /  │
│    │                             │                  │                   │ REFERENCE-ONLY   │
└────┴─────────────────────────────┴──────────────────┴───────────────────┴──────────────────┘
```

---

### 2.1 `ArkhamMirror-main` (SHATTERED)

- **Repository Summary:**  
  A modular intelligence analysis platform ("SHATTERED") for document analysis, entity extraction, timeline visualization, and knowledge graph exploration. Built with Python/FastAPI micro-packages ("shards") and a React frontend utilizing Cytoscape and Sigma.js for graph rendering.
- **License:**  
  MIT License (`ArkhamMirror-main/ArkhamMirror-main/LICENSE`).
- **Identified Concepts & Components:**  
  - Entity-relationship graph schema with nodes (`Person`, `Organization`, `Location`, `Document`, `Event`).
  - Timeline shard parsing ISO timestamps, intervals, and chronological sequences.
  - Media forensics and OCR shard integration patterns for document ingestion.
  - Multi-panel analyst interface separating graph views, document previews, and entity inspectors.
- **Explicit Decision:**  
  **`REFERENCE-ONLY` (Architectural & UI Layout Inspiration)**
- **Reasoning:**  
  ArkhamMirror is designed as an open-ended intelligence investigation tool utilizing Neo4j and a heavy multi-package monorepo. KPYRIOS-ACPIA operates under locked constraints (NetworkX for deterministic graph math, PostgreSQL for relational storage, strict two-agent loop, child-protection specific entities). While ArkhamMirror's UI layout for graph/timeline panels provides excellent visual inspiration, its codebase is too sprawling and generalized. No code will be copied directly; UI layout ideas will be implemented cleanly in our native React design system.

---

### 2.2 `CAC-Ontology-main` (Project VIC International)

- **Repository Summary:**  
  Crimes Against Children (CAC) Ontology v3.1.0 maintained by Project VIC International. A standardized RDF/OWL vocabulary aligned with CASE and UCO (Unified Cyber Ontology) v1.5.0, capturing victims, offenders, offenses, forensic media analysis, digital evidence, and legal proceedings.
- **License:**  
  Apache License 2.0 (`CAC-Ontology-main/CAC-Ontology-main/license.md`).
- **Identified Concepts & Components:**  
  - Formal domain classes for child protection: `cac:Victim`, `cac:Offender`, `cac:ChildExploitationMaterial`, `cac:InvestigativeLead`, `cac:ForensicExamination`, `cac:LegalProcess`.
  - Relationship assertions tying digital evidence items directly to physical devices, online accounts, and communication sessions.
  - Provenance predicates (`uco-core:hasFacet`, `uco-core:source`) linking extracted assertions to immutable evidence sources.
- **Explicit Decision:**  
  **`CONCEPT-REUSE` (Domain Ontology & Data Model Alignment)**
- **Reasoning:**  
  Adopting the standardized naming conventions and entity structures from CAC Ontology ensures KPYRIOS-ACPIA speaks the global language of law enforcement child-protection units (such as Kerala Police CyberDome, Interpol, Project VIC, and NCMEC). We will align our Pydantic/SQLAlchemy data models with CAC Ontology entity semantics while keeping the implementation in lightweight deterministic Python and PostgreSQL.

---

### 2.3 `ChildShield-Forensics-main`

- **Repository Summary:**  
  Automated digital forensics triage toolkit for child sexual exploitation cases (CSAM/CSAE). Provides hashing (MD5, SHA-256), EXIF metadata extraction, media carving, keyword scanning, and risk triage reporting.
- **License:**  
  MIT License (`ChildShield-Forensics-main/ChildShield-Forensics-main/LICENSE`).
- **Identified Concepts & Components:**  
  - Media ingestion triage rules (prioritizing EXIF creation dates, camera serial numbers, GPS tags).
  - Cryptographic hashing pipelines for evidence integrity verification.
  - Triage classification policies for flagging critical digital artifacts for investigator review.
- **Explicit Decision:**  
  **`CONCEPT-REUSE` (Forensic Triage & Ingestion Logic Reference)**
- **Reasoning:**  
  ChildShield provides concrete domain knowledge on which metadata tags and hashing routines are critical during the first hours of a child protection investigation. We will adapt these forensic triage logic patterns into deterministic Python ingestion tools for KPYRIOS.

---

### 2.4 `DFIR-Companion-master`

- **Repository Summary:**  
  Digital Forensics and Incident Response companion application providing timeline analysis, Cytoscape graph visualization, evidence inventory, and interactive case notes.
- **License:**  
  GNU Affero General Public License v3.0 (`AGPL-3.0-or-later`) (`DFIR-Companion-master/DFIR-Companion-master/LICENSE`).
- **Identified Concepts & Components:**  
  - Interactive evidence timeline with chronological zoom and filtering.
  - Case note markdown editor integrated with evidence tag cross-references.
  - Artifact tracking tables linking forensic items to case hypotheses.
- **Explicit Decision:**  
  **`REJECT` (for Code Integration) / `REFERENCE-ONLY` (for Interaction UX Study)**
- **Reasoning:**  
  AGPLv3 is a strong copyleft license that imposes viral source-distribution requirements over network interactions. To protect KPYRIOS-ACPIA's legal and distribution boundaries, **zero code, components, or libraries from DFIR-Companion will be used or linked**. However, observing how investigators cross-reference markdown notes with timeline events provides valuable UX insight for our independently built React interface.

---

### 2.5 `Fluenci-main (1)`

- **Repository Summary:**  
  Real-time streaming payment application built on QIE blockchain featuring an off-chain AI Auditor worker and telemetry dashboard with dark-mode aesthetic styling.
- **License:**  
  Proprietary / Hackathon Source (No standalone OSS license file).
- **Identified Concepts & Components:**  
  - High-contrast dark mode palette with cyan/teal glowing accents and dark slate cards.
  - Live auditor badge status chips (`SAFE`, `FLAGGED`, `PAUSED`).
  - Real-time telemetry feed cards.
- **Explicit Decision:**  
  **`REFERENCE-ONLY` (Visual Design System Inspiration Only — Zero Code/Branding Reuse)**
- **Reasoning:**  
  Per the Global Context specification: *"Fluenci-main and Quantara-main (UI/UX visual reference only — no branding reuse)"*. Furthermore, the repository lacks an open-source license. KPYRIOS-ACPIA has an original, purpose-built police forensic visual identity (deep navy `#0a0f1d`, slate `#1e293b`, restrained blue `#2563eb`, and strict three-tier authorization badges). We study Fluenci purely as a reference for modern dashboard aesthetics and card spacing.

---

### 2.6 `IPED-master` (Digital Evidence Processor)

- **Repository Summary:**  
  The Brazilian Federal Police Digital Evidence Processor (IPED) is a high-throughput Java-based digital forensics processing engine used by law enforcement agencies worldwide. It performs automated file carving, recursive archive expansion, hashing (MD5, SHA-1, SHA-256, PhotoDNA, SSDEEP), metadata extraction, and sub-item hierarchy indexing.
- **License:**  
  GNU General Public License v3.0 (`GPL-3.0-or-later`) (`IPED-master/IPED-master/LICENSE.txt`).
- **Identified Concepts & Components:**  
  - Immutable evidence containerization: files are assigned an invariant cryptographic hash at ingestion and never modified.
  - Sub-item parent-child tree hierarchy (e.g., email -> attachment -> embedded image).
  - Deterministic processing pipelines where ingestion and parsing never depend on probabilistic AI.
- **Explicit Decision:**  
  **`REJECT` (for Code Integration) / `REFERENCE-ONLY` (for Ingestion Architecture Concepts)**
- **Reasoning:**  
  IPED is written in Java under GPLv3. KPYRIOS-ACPIA is a lightweight Python/FastAPI/React platform. We will not port or wrap IPED code. However, IPED's core architectural principle—that evidence must be hashed immediately on ingestion, stored immutably, and that all derivative extractions must maintain strict parent-child provenance—is adopted as a foundational tenet in KPYRIOS.

---

### 2.7 `KSPDatathon-main` (KAVAL)

- **Repository Summary:**  
  KAVAL is an intelligent conversational AI assistant built for the Karnataka State Police Datathon 2026. Built with FastAPI and React, it features strict jurisdiction clamping, compiled-SQL provenance tracking, tamper-evident audit hashing, and bilingual (Kannada/English) support.
- **License:**  
  MIT License (`KSPDatathon-main/KSPDatathon-main/LICENSE`).
- **Identified Concepts & Components:**  
  - Police-specific operational UX: provenance chips showing the exact origin and query behind every displayed conclusion.
  - Tamper-evident audit logging for state police oversight.
  - Clear separation of backend auth and API endpoints with FastAPI.
- **Explicit Decision:**  
  **`CONCEPT-REUSE` (Police UX Patterns & Audit Trail Mechanics)**
- **Reasoning:**  
  KAVAL was specifically tailored for Indian police investigation workflows and demonstrates how law enforcement personnel require provenance chips, jurisdiction safeguards, and immutable audit logs. We adapt these UX and audit concepts directly into KPYRIOS-ACPIA's Kerala Police CyberDome interface.

---

### 2.8 `Qantara-main`

- **Repository Summary:**  
  A modern, high-polish Web3 payment and settlement workspace built with React, Vite, Tailwind, and TypeScript. Features timeline transaction feeds, responsive drawers, modal dialogs, and comprehensive end-to-end testing suites.
- **License:**  
  MIT License (`Qantara-main/Qantara-main/LICENSE`).
- **Identified Concepts & Components:**  
  - Component hierarchy: layout shell with collapsible sidebar, active session banner, and timeline stream cards.
  - Testing architecture: robust Vitest and Playwright test setup.
  - Toast and modal notification patterns.
- **Explicit Decision:**  
  **`REFERENCE-ONLY` (UI Component Structure & Test Setup Reference — No Branding Reuse)**
- **Reasoning:**  
  Per the Global Context specification: *"Fluenci-main and Quantara-main (UI/UX visual reference only — no branding reuse)"*. Qantara's clean React component organization and testing setup provide an excellent benchmark for frontend engineering rigor, but all styling and components in KPYRIOS are authored cleanly from scratch in vanilla CSS design tokens.

---

### 2.9 `solve-it-main` (SOLVE-IT Digital Forensics KB)

- **Repository Summary:**  
  A structured digital forensics knowledge base (Systematic Objective-based Listing of Various Established digital Investigation Techniques) inspired by MITRE ATT&CK. It provides a formal taxonomy of forensic techniques (`DFT-xxx`), inherent weaknesses (`DFW-xxx`), and mitigations (`DFM-xxx`).
- **License:**  
  MIT License (`solve-it-main/solve-it-main/LICENSE`).
- **Identified Concepts & Components:**  
  - Structured JSON schemas categorizing forensic investigative techniques.
  - Formal definitions of investigation gaps, forensic weaknesses, and counter-mitigations.
  - Graph-ready relationship model linking evidence types to potential weaknesses.
- **Explicit Decision:**  
  **`CONCEPT-REUSE` (Forensic Knowledge Representation & Gap Taxonomy)**
- **Reasoning:**  
  SOLVE-IT's weakness-and-mitigation schema is directly applicable to KPYRIOS's Strategy Agent. When the Strategy Agent identifies an investigative gap or contradiction, it can draw upon SOLVE-IT's structured taxonomy to formulate candidate investigative actions with quantifiable Expected Information Gain (EIG).

---

### 2.10 `VolWeb-main`

- **Repository Summary:**  
  A centralized web-based memory forensics platform utilizing the Volatility 3 framework. Features a Django REST API backend, Vue/React frontend, artifact management, and job status tracking.
- **License:**  
  GNU General Public License v3.0 (`GPL-3.0-or-later`) (`VolWeb-main/VolWeb-main/LICENCE`).
- **Identified Concepts & Components:**  
  - Case and evidence management tables with status indicators (Pending, Processing, Completed, Error).
  - Visual summary cards for extracted forensic artifacts.
- **Explicit Decision:**  
  **`REJECT` (for Code Integration) / `REFERENCE-ONLY` (for Artifact Status Presentation)**
- **Reasoning:**  
  GPLv3 license restrictions preclude copying or bundling VolWeb code into KPYRIOS. Memory forensics via Volatility is not within KPYRIOS's scope (which focuses on digital evidence graph analysis, timeline reasoning, and child-protection investigation assistance). We reference VolWeb solely for its visual layout of forensic job status queues.

---

## 3. Summary of Architectural Directives

1. **Independent Authoring:** All KPYRIOS frontend and backend code is created fresh with modern TypeScript and Python 3.12+.
2. **Zero GPL/AGPL Contamination:** Neither IPED, VolWeb, nor DFIR-Companion code will be imported or merged.
3. **Domain Alignment:** Data structures will respect CAC Ontology naming (`cac:Victim`, `cac:Offender`, `cac:ChildExploitationMaterial`) and SOLVE-IT forensic weakness taxonomy.
4. **Law Enforcement Integrity:** Audit trails and provenance tracking follow the principles demonstrated in KAVAL and IPED.
