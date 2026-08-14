# Third-Party License Audit & Inventory
**Project:** KPYRIOS-ACPIA (Agentic Child Protection Investigation Assistant)  
**Hackathon:** HACKP 2026 — Kerala Police CyberDome  
**Date:** August 2026  
**Auditor:** Senior Software Architect  

---

## 1. Executive Summary

This document provides a comprehensive inventory and legal audit of the ten reference repositories provided in the KPYRIOS-ACPIA research workspace. In compliance with strict intellectual property, legal compliance, and police forensic integrity guidelines:
- **Zero wholesale code copying:** All KPYRIOS-ACPIA code is independently authored and designed for the specific child-protection forensic constraints.
- **Copyleft isolation:** Permissive (MIT / Apache 2.0) and copyleft (GPLv3 / AGPLv3) projects are segregated. Code under GPL/AGPL is utilized strictly for conceptual reference and pattern study; no GPL/AGPL code is merged or bundled into KPYRIOS modules.
- **Attribution & Provenance:** Every conceptual or structural influence is explicitly documented below.

---

## 2. Reference Repository License Matrix

| # | Repository Directory | Canonical Name / Source | License Type | SPDX Identifier | Permitted Usage in KPYRIOS-ACPIA | Primary Architectural Inspiration |
|---|---|---|---|---|---|---|
| 1 | `ArkhamMirror-main` | SHATTERED (Justin McHugh) | MIT License | `MIT` | Architectural reference & pattern study | Modular service organization, Graph & Timeline UI layouts |
| 2 | `CAC-Ontology-main` | Project VIC International CAC Ontology | Apache License 2.0 | `Apache-2.0` | Semantic ontology concepts & data model reference | Crimes-against-children entity definitions, CASE/UCO 1.5 spine |
| 3 | `ChildShield-Forensics-main` | ChildShield Forensics (Joas A Santos) | MIT License | `MIT` | Forensic workflow & triage policy reference | Child-protection triage workflows, hash lookup routines |
| 4 | `DFIR-Companion-master` | DFIR Companion | GNU Affero GPL v3 | `AGPL-3.0-or-later` | **Reference-Only / Pattern Study** (Strict no-copy) | Timeline interaction flow, investigation notes UI pattern |
| 5 | `Fluenci-main (1)` | Fluenci (Hackathon Repository) | Proprietary / Hackathon Source | `LicenseRef-Proprietary` | **Reference-Only for UI/UX visual style** (No branding reuse) | Dark mode styling, telemetry cards, audit status chips |
| 6 | `IPED-master` | IPED Digital Evidence Processor (Federal Police of Brazil) | GNU GPL v3 (with Sleuthkit/plugin exceptions) | `GPL-3.0-or-later` | **Reference-Only for forensic ingestion concepts** (No copy) | Immutable SHA-256 evidence hashing, sub-item tree parsing |
| 7 | `KSPDatathon-main` | KAVAL (Prajnadeep Sarma & Team KAVAL) | MIT License | `MIT` | Police UX & audit trail reference | Police-specific UX patterns, SQL provenance, audit hashing |
| 8 | `Qantara-main` | Qantara (Qantara Contributors) | MIT License | `MIT` | UI/UX component hierarchy reference (No branding reuse) | Timeline stream components, responsive drawer and badge layouts |
| 9 | `solve-it-main` | SOLVE-IT Knowledge Base (SOLVE-IT-DF / Chris Hargreaves) | MIT License | `MIT` | Forensic taxonomy & weakness data model reference | Forensic technique weakness/mitigation schemas |
| 10 | `VolWeb-main` | VolWeb Memory Analysis Platform | GNU GPL v3 | `GPL-3.0-or-later` | **Reference-Only for visualization concepts** (No copy) | Evidence artifact status cards, job progress indicators |

---

## 3. Detailed Repository License Records

### 3.1 `ArkhamMirror-main` (SHATTERED)
- **License File Path:** `ArkhamMirror-main/ArkhamMirror-main/LICENSE`
- **License Type:** MIT License
- **Copyright Holder:** (c) 2024-2026 Justin McHugh
- **Full License Text Summary:**
  > Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction...
- **Compliance Assessment:** Fully permissive. Concepts from modular backend shards and Cytoscape/Sigma graph integration patterns can be referenced freely.

### 3.2 `CAC-Ontology-main`
- **License File Path:** `CAC-Ontology-main/CAC-Ontology-main/license.md`
- **License Type:** Apache License 2.0 (with Project VIC adoption notification request)
- **Copyright Holder:** Project VIC International
- **Full License Text Summary:**
  > Project VIC International requests persons and organizations that use the Crimes Against Children ontology to send an email to cacontology@projectvic.org... Licensed under the Apache License, Version 2.0.
- **Compliance Assessment:** Apache 2.0 allows free commercial and non-commercial utilization with proper attribution. Ontology structures for victims, offenders, forensic actions, and evidence items directly inform the KPYRIOS schema.

### 3.3 `ChildShield-Forensics-main`
- **License File Path:** `ChildShield-Forensics-main/ChildShield-Forensics-main/LICENSE`
- **License Type:** MIT License
- **Copyright Holder:** (c) 2025 Joas A Santos
- **Full License Text Summary:**
  > Standard MIT License permissions and conditions.
- **Compliance Assessment:** Fully permissive. Concepts of triage policies, media hashing, and EXIF extraction workflows inform KPYRIOS ingestion pipelines.

### 3.4 `DFIR-Companion-master`
- **License File Path:** `DFIR-Companion-master/DFIR-Companion-master/LICENSE`
- **License Type:** GNU Affero General Public License v3.0 (AGPLv3)
- **Copyright Holder:** Free Software Foundation, Inc. / DFIR Companion Authors
- **Compliance Assessment:** **Strong Copyleft.** To avoid copyleft contamination of KPYRIOS-ACPIA, **no source code from DFIR-Companion may be copied, adapted, or linked**. Architectural study is limited to observing high-level UX requirements for digital forensic timeline representation.

### 3.5 `Fluenci-main (1)`
- **License File Path:** *None present in repository root* (Hackathon code submission)
- **License Type:** Proprietary / All Rights Reserved
- **Compliance Assessment:** Visual and stylistic reference only. KPYRIOS implements an original navy/charcoal/cyber-blue police forensic design system with zero proprietary asset or code reuse.

### 3.6 `IPED-master`
- **License File Path:** `IPED-master/IPED-master/LICENSE.txt`
- **License Type:** GNU General Public License v3.0 (GPLv3) with Section 7 exception for Sleuthkit & plugin interfaces
- **Copyright Holder:** Polícia Federal do Brasil
- **Compliance Assessment:** **Strong Copyleft.** IPED's Java source code is strictly reference-only for understanding law-enforcement grade digital evidence ingestion, sub-item recursion, and cryptographic integrity verification. KPYRIOS implements its own Python 3 / FastAPI deterministic hashing and ingestion engine.

### 3.7 `KSPDatathon-main` (KAVAL)
- **License File Path:** `KSPDatathon-main/KSPDatathon-main/LICENSE`
- **License Type:** MIT License
- **Copyright Holder:** (c) 2026 Prajnadeep Sarma & Team KAVAL
- **Compliance Assessment:** Permissive MIT. Concepts such as jurisdiction clamping, tamper-evident audit hashing, and SQL provenance display are adapted conceptually for KPYRIOS-ACPIA.

### 3.8 `Qantara-main`
- **License File Path:** `Qantara-main/Qantara-main/LICENSE`
- **License Type:** MIT License
- **Copyright Holder:** (c) 2026 Qantara contributors
- **Compliance Assessment:** Permissive MIT. Component hierarchy, responsive timeline styling, and testing structure serve as architectural and UI structure reference.

### 3.9 `solve-it-main`
- **License File Path:** `solve-it-main/solve-it-main/LICENSE`
- **License Type:** MIT License
- **Copyright Holder:** (c) 2024 SOLVE-IT-DF (Chris Hargreaves)
- **Compliance Assessment:** Permissive MIT. The MITRE ATT&CK style forensic technique, weakness, and mitigation classification informs KPYRIOS's gap and contradiction taxonomy.

### 3.10 `VolWeb-main`
- **License File Path:** `VolWeb-main/VolWeb-main/LICENCE`
- **License Type:** GNU General Public License v3.0 (GPLv3)
- **Copyright Holder:** (c) 2007 Free Software Foundation / VolWeb Authors
- **Compliance Assessment:** **Strong Copyleft.** No source code is copied. UI concepts of job status tracking and artifact tabulations are studied conceptually.
