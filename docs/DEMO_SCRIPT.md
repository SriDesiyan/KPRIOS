# KPYRIOS-ACPIA Demonstration Script (5-Minute Walkthrough)

**Target Audience:** Kerala Police CyberDome Evaluation Committee / HACKP 2026 Jury  
**Demonstration Case:** `CR-KP-ACPIA-2026-001` (Operation CyberShield)  
**Total Runtime:** ~5 minutes across 5 sequential stages

---

## Stage 1: Case Creation & Cryptographic Evidence Ingestion (0:00 – 1:00)
1. **Navigate to Case Catalog (`/dashboard`)**:
   - Show the seeded case `CR-KP-ACPIA-2026-001` with status `ACTIVE`.
2. **Open Evidence Explorer (`/dashboard/evidence`)**:
   - Observe the ingested artifacts: `chat_intercept_alpha.txt`, `suspect_device_photo.jpg`, and `hotel_wifi_auth_log.json`.
   - Point out the **immutable SHA-256 cryptographic hashes**, modality tags (`CHAT_LOG`, `IMAGE`, `DOCUMENT`), and trust vector breakdown (Reliability, Authenticity).
   - Show that duplicate evidence items are grouped into `source_fingerprint` clusters so they cannot artificially amplify hypothesis belief.

---

## Stage 2: 3D Evidence Graph & Hidden Connection Discovery (1:00 – 2:00)
1. **Navigate to 3D Evidence Graph (`/dashboard/graph`)**:
   - Rotate, pan, and zoom around the spatial 3D WebGL node universe.
   - Filter nodes using the top chips (`ENTITY`, `FACT`, `HYPOTHESIS`, `EVIDENCE`).
   - Click on the node `@anand_cyber` to open the **Provenance Inspector Drawer**.
   - Show the structural provenance path linking `@anand_cyber` back to `chat_intercept_alpha.txt`.
2. **Switch to 2D Fallback**:
   - Click the "2D View" toggle to demonstrate instantaneous graceful fallback for low-power forensic field terminals.

---

## Stage 3: Contradiction Detection & Live Leave-One-Out Ablation (2:00 – 3:00)
1. **Navigate to Contradictions & Gaps (`/dashboard/contradictions`)**:
   - Highlight the **spatiotemporal contradiction**: The suspect's device was photographed in Kozhikode (11.2588, 75.7804) while a Wi-Fi authentication record placed the device in Thiruvananthapuram (8.5241, 76.9366) only 30 seconds later.
   - Observe that the contradiction engine marked the proposition `CONTESTED` without making an automated judgment.
2. **Navigate to Competing Hypotheses (`/dashboard/hypotheses`)**:
   - Click on Proposition H1: *"Suspect operated primary digital exploitation channel."*
   - Inspect the **Leave-One-Out Dependency Impact panel**: Removing `chat_intercept_alpha.txt` drops belief by `-24.0 pp`.
   - Emphasize the invariant banner: **"Sensitivity delta in percentage points (pp). Never reported as a calibrated probability."**

---

## Stage 4: Strategy Agent EIG Optimization & Sovereign Human Gate (3:00 – 4:00)
1. **Navigate to Strategy Agent Recommendations (`/dashboard/strategy`)**:
   - Review the candidate action ranked #1 by Expected Information Gain:
     - *Action:* `request_isp_subscriber_records`
     - *EIG Score:* `0.412 bits (PoC approximation)`
     - *Justification:* Directly discriminates between primary suspect operation vs third-party proxy.
2. **Advance Dual-Agent ReAct Cycle**:
   - Click **"Advance Agent Cycle"**.
   - Watch the Investigation Agent ReAct loop execute deterministic tools.
3. **Trigger Tier-2 Review Approval**:
   - Observe the agent halting at the **Tier-2 REVIEW Boundary** for candidate entity merge: `@anand_cyber` $\leftrightarrow$ `Anand Kumar`.
   - Navigate to **Three-Tier Approvals (`/dashboard/approvals`)**, review the proposed payload, and click **"Approve & Resume State"**.
   - Confirm that only a human investigator has the legal authority to commit identity merges.

---

## Stage 5: Court-Ready Forensic Brief Export & Cryptographic Audit Ledger (4:00 – 5:00)
1. **Navigate to Case Brief Reports (`/dashboard/reports`)**:
   - View the generated **Court-Ready Case Brief** featuring official Kerala Police CyberDome letterhead, SHA-256 hash tables, decomposed belief charts, and human sign-off block.
   - Click **"Export JSON Payload"** or **"Print Forensic Brief"**.
2. **Navigate to Audit & Provenance Ledger (`/dashboard/audit`)**:
   - Show the append-only cryptographic ledger tracking every agent observation, tool execution, user login, and human decision with SHA-256 seal integrity.
   - Conclude: **"KPYRIOS-ACPIA empowers investigators with mathematically sound reasoning while keeping humans in sovereign control of every critical decision."**
