# KPYRIOS-ACPIA REST API Reference

Base URL: `/api/v1`  
Authentication: HTTP Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. System & Health
- `GET /health`: Basic health check (`status`, `timestamp`, `environment`, `version`).
- `GET /health/db`: Database connectivity verification (`SELECT 1`).

---

## 2. Authentication (`/auth`)
- `POST /auth/register`: Register new user account with role (`investigator`, `supervisor`, `auditor`).
- `POST /auth/login`: Authenticate and receive signed access/refresh JWT tokens.
- `POST /auth/refresh`: Refresh expired access token using valid refresh token.
- `GET /auth/me`: Get active authenticated user profile and permissions.

---

## 3. Cases (`/cases`)
- `POST /cases`: Create new investigation case. *[RBAC: INVESTIGATOR, SUPERVISOR]*
- `GET /cases`: List all investigation cases. *[RBAC: INVESTIGATOR, SUPERVISOR, AUDITOR]*
- `GET /cases/{case_id}`: Retrieve case details and metadata.
- `PUT /cases/{case_id}`: Update case title, description, or status.
- `GET /cases/{case_id}/timeline`: Retrieve chronological forensic timeline events.
- `GET /cases/{case_id}/graph`: Query NetworkX multi-directed evidence graph nodes and edges.

---

## 4. Evidence Management (`/cases/{case_id}/evidence`)
- `POST /cases/{case_id}/evidence`: Ingest new digital artifact with SHA-256 integrity hash.
- `GET /cases/{case_id}/evidence`: List ingested evidence artifacts with trust vectors and duplicate clusters.
- `GET /cases/{case_id}/evidence/{evidence_id}`: Retrieve specific artifact metadata and derived facts.

---

## 5. Entity Resolution (`/cases/{case_id}/entities`)
- `GET /cases/{case_id}/entities`: List all extracted entities.
- `GET /cases/{case_id}/entities/candidates`: List candidate merge proposals.
- `POST /cases/{case_id}/entities/proposals`: Create new candidate entity merge proposal (Tier 2 REVIEW).
- `POST /cases/{case_id}/entities/proposals/{proposal_id}/review`: Approve or reject proposal. *[RBAC: INVESTIGATOR, SUPERVISOR]*

---

## 6. Dual-Agent Reasoning Runtime (`/cases/{case_id}`)
- `POST /cases/{case_id}/investigate`: Advance LangGraph dual-agent workflow by one ReAct execution cycle. *[RBAC: INVESTIGATOR, SUPERVISOR]*
- `GET /cases/{case_id}/state`: Retrieve full `InvestigationState` container.
- `GET /cases/{case_id}/recommendations`: Retrieve Strategy Agent ranked candidate actions with Shannon EIG scores.
- `GET /cases/{case_id}/dependency/{hypothesis_id}`: Compute leave-one-out dependency impacts in percentage points (`pp`).
- `GET /cases/{case_id}/agent-trace`: Retrieve chronological ReAct execution logs.

---

## 7. Three-Tier Authorization Gateways (`/actions`)
- `POST /actions/{action_id}/approve`: Approve pending Tier-2 REVIEW action, resume agent state, and log decision. *[RBAC: INVESTIGATOR, SUPERVISOR]*
- `POST /actions/{action_id}/reject`: Reject pending Tier-2 REVIEW action with optional investigator notes. *[RBAC: INVESTIGATOR, SUPERVISOR]*
