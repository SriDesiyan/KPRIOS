# KPYRIOS-ACPIA
### Agentic Child Protection Investigation Assistant
**Kerala Police CyberDome — HACKP 2026**

---

## 1. Executive Summary

**KPYRIOS-ACPIA** is an AI-assisted digital forensics platform purpose-built for child protection investigations (CSAE/CSAM analysis, digital evidence correlation, and timeline synthesis). 

### Locked Architectural Invariants:
1. **Never Decides Guilt:** The system operates strictly as an investigator's analytical assistant. Humans maintain sovereign control of every consequential operational, investigative, and legal decision.
2. **Exactly Two Agents:**
   - **Investigation Agent:** Operates in a ReAct loop (`Observe` → `Understand` → `Plan` → `Select Tool` → `Execute` → `Observe Result` → `Update State`).
   - **Strategy Agent:** Analyzes graph state, identifies coverage gaps/contradictions, and computes **Expected Information Gain (EIG)** to recommend the most informative next action.
   - **Deterministic Engines Only:** Hashing, OCR, NLP extraction, entity resolution, graph algorithms (NetworkX), contradiction detection, and EIG math are pure deterministic Python tools—never probabilistic agents.
3. **No Fused Composite Score:** Evidentiary quantities are strictly decomposed and individually interpretable (Corroboration Count, Dependency Impact, Contradiction List, Coverage Gaps, Hypothesis Support/Attack, EIG).
4. **Three-Tier Authorization (Enforced in Code):**
   - `AUTO` (Tier 1): Ingestion, SHA-256 verification, OCR, graph updates, EIG math.
   - `REVIEW` (Tier 2): Entity merges, hypothesis elevation, action execution, report export (Execution halts until explicit signed human approval).
   - `ONLY` (Tier 3): Guilt declaration, victim attribution, legal conclusions (No executable function exists in the codebase).
5. **Structural Provenance:** Every fact, relationship, and hypothesis enforces a non-empty `source_ids` array tying directly to immutable SHA-256 evidence.
6. **Prompt-Injection Defense:** Evidence data is treated strictly as data (structured JSON only), never as executable instructions.

---

## 2. Directory Structure

```
kpyrios-acpia/
├── frontend/                     # React 18 + Vite + TypeScript + Vitest
│   ├── src/
│   │   ├── design-system/        # Navy/Charcoal/Cyber Blue design system (tokens, Button, Input, Card, Badge)
│   │   ├── components/           # Navbar, Sidebar, ProtectedRoute, ShellLayout
│   │   ├── pages/                # LoginPage, DashboardShell, PlaceholderPage (stubs)
│   │   ├── contexts/             # AuthContext (JWT management, roles)
│   │   ├── services/             # API client & AuthService
│   │   └── types/                # TypeScript models
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2
│   ├── app/
│   │   ├── core/                 # Config, Security (bcrypt + JWT), Database, Structured JSON Logging
│   │   ├── models/               # SQLAlchemy models (User with role enum)
│   │   ├── schemas/              # Pydantic validation models
│   │   ├── api/                  # API routers (/auth/login, /auth/refresh, /auth/logout, /auth/me)
│   │   ├── middleware/           # Structured JSON request logging & Three-tier RBAC guards
│   │   └── main.py               # FastAPI application entrypoint
│   ├── alembic/                  # Database migration scripts
│   ├── tests/                    # Unit tests & integration test suites
│   ├── pyproject.toml
│   └── requirements.txt
├── docs/
│   ├── REPO_ANALYSIS.md          # Exhaustive analysis of all 10 reference repositories with reuse decisions
│   ├── ARCHITECTURE.md           # System architecture blueprint & invariant specifications
│   └── LICENSES.md               # Legal license inventory and third-party attribution
├── docker/
│   ├── backend.Dockerfile        # Python 3.12 slim container
│   ├── frontend.Dockerfile       # Node 22 + Nginx Alpine multi-stage container
│   └── nginx.conf                # Nginx reverse proxy configuration
├── docker-compose.yml            # Orchestrates postgres, backend, and frontend
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 3. Quickstart & Local Development

### Option A: Docker Compose (Recommended)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Build and start all three services:
   ```bash
   docker compose up --build -d
   ```
3. Open your browser:
   - **Frontend UI:** `http://localhost:5173` (or `http://localhost:3000`)
   - **Backend API & Swagger Docs:** `http://localhost:8000/docs`
   - **API Health Check:** `http://localhost:8000/health`

### Option B: Local Development (Without Docker)

#### 1. Backend Service (FastAPI):
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Application (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Default Demo Accounts for Evaluation

For rapid evaluation and testing, the system initializes three pre-seeded accounts:

| Role | Email | Password | Allowed Authorization Scope |
|---|---|---|---|
| **Investigator** | `investigator@kpyrios.police.in` | `Investigator@2026` | Tier 1 (`AUTO`), Proposes Tier 2 (`REVIEW`) |
| **Supervisor** | `supervisor@kpyrios.police.in` | `Supervisor@2026` | Tier 1 (`AUTO`), Signs & Approves Tier 2 (`REVIEW`) |
| **Auditor** | `auditor@kpyrios.police.in` | `Auditor@2026` | Read-only access to cryptographic provenance and audit logs |

---

## 5. Verification & Test Execution

### Backend Test & Quality Suite:
```bash
cd backend
python -m pytest -v          # Run 14 unit and integration tests
ruff check .                 # Lint verification
mypy app                     # Strict static type check
```

### Frontend Test & Quality Suite:
```bash
cd frontend
npm run test                 # Run Vitest component & unit tests
npm run lint                 # ESLint checks
npm run build                # TypeScript compilation and Vite production build
```

---

