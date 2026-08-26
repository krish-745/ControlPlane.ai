# ControlPlane.ai

> Real-time AI runtime policy engine — Accenture Innovation Challenge 2026, Round 2

## What it does

ControlPlane.ai sits between your application and any LLM, enforcing configurable policies in real time across three stages:

| Stage | When | Target Latency | Examples |
|---|---|---|---|
| **Stage 1 (inline)** | Before the LLM is called | < 50ms | Block API keys, prompt injection |
| **Stage 2 (async)** | After response, while streaming | < 400ms | Catch hallucinations, runaway agents |
| **Stage 3 (offline)** | Batch on telemetry | — | Threshold tuning, precision/recall |

All decisions go through a **Policy Aggregator** — a single if/elif router that reads per-org, per-use-case rules from Postgres. Checks never decide their own action.

---

## Project Structure

```
ControlPlane.ai/
├── frontend/          # React 19 + TanStack Start + Tailwind v4 (replaces Streamlit)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts               # Typed client for the FastAPI backend
│   │   │   ├── controlplane-data.ts # Mock/fallback data
│   │   │   └── utils.ts
│   │   ├── routes/
│   │   │   ├── index.tsx   # Live monitor — polls /v1/flags
│   │   │   ├── audit.tsx   # Audit log — fetches /v1/interactions
│   │   │   ├── policy.tsx  # Policy editor — reads/writes /policy/config
│   │   │   └── trust.tsx   # Trust & metrics dashboard
│   │   └── components/
│   │       └── top-nav.tsx # Live backend health indicator
│   ├── vite.config.ts      # Dev proxy: /api -> http://localhost:8000
│   └── .env.example
├── proxy/             # FastAPI backend (port 8000)
├── policy/            # Policy aggregator + manager
├── checks/            # Stage 1 & 2 check modules
├── db/                # SQLAlchemy models
├── alembic/           # Database migrations
├── dashboard/         # Streamlit dashboard (legacy, kept for reference)
└── tests/
```

---

## Quick Start

### Backend (FastAPI)
```bash
# 1. Configure environment
cp .env.example .env         # LLM_BACKEND=mock is the default (safe for demo)

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Start the proxy backend
uvicorn proxy.main:app --reload --port 8000
```

### Frontend (React)
```bash
# In a second terminal, inside the frontend directory:
cd frontend

# Install dependencies
npm install

# Start the dev server (auto-proxies /api -> localhost:8000)
npm run dev
# → Opens at http://localhost:3000
```

### Demo scenarios
```bash
# Run all 5 demo scenarios (from the project root)
python demo_runner.py

# Run a single scenario
python demo_runner.py --scenario 3

# Run the golden test set (target: ≥ 90%)
python tests/run_golden_standalone.py
```

> **Note:** The frontend works in offline mode when the backend is not running — it falls back to curated demo data and shows a "Backend offline" banner.

---

## Demo Scenarios

| # | Name | Pillar | What to watch |
|---|---|---|---|
| 1 | The Confident Hallucination | Performance | Retraction banner in Monitor after stream |
| 2 | The Runaway Agent | Cost | 4th call returns 429; cost counter increments |
| 3 | The Subtle Leak | Responsibility | Instant 403 before any LLM call |
| 4 | The Overlap Case | Performance + Responsibility | One flag, two category tags |
| 5 | The Policy Swap | Governance | Same input: block under `customer_support_bot`, escalate under `internal_knowledge_assistant` |

---

## Architecture

```
Client → [Stage 1: PII + Injection] → POLICY AGGREGATOR → LLM
                                              │
                                           BLOCK (403)
                                              │
                                           ALLOW → stream response
                                              │
                               [Stage 2: Grounding + Loop + Toxicity]
                                              │
                                    POLICY AGGREGATOR
                                    │              │
                                ESCALATE        LOG_OK
                               (UI banner)    (Postgres)
```

Policy configs are stored in **Postgres** and cached in **Redis** (30s TTL). No proxy restart needed to change thresholds.

---

## API

### Chat proxy
```
POST /v1/chat
Headers: X-Org-Id, X-Use-Case, X-Agent-Id (optional)
Body: { "prompt": "...", "rag_context": "...", "scenario_key": "...", "tool_name": "...", "tool_args": {} }
```

### Policy management
```
POST /policy/config                     # create/update
GET  /policy/config/{org_id}/{use_case} # fetch active
```

### Audit
```
GET /v1/interactions?org_id=demo
GET /v1/flags?org_id=demo
GET /health
```

---

## Switching to Live LLM Mode

```bash
# In .env:
LLM_BACKEND=live
OPENAI_API_KEY=sk-...
```

The same proxy, same checks, same frontend — just real model responses instead of fixtures.

---

## Stack

| Component | Choice |
|---|---|
| **Frontend** | React 19 + TanStack Start + Tailwind v4 (Vite, npm) |
| Proxy | FastAPI + asyncpg |
| Model router | LiteLLM (mock or live) |
| Cache | Redis |
| Storage | Postgres |
| Embeddings | all-MiniLM-L6-v2 |
| Legacy dashboard | Streamlit (kept for reference) |


---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env         # LLM_BACKEND=mock is the default (safe for demo)

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Start proxy backend (in one terminal)
uvicorn proxy.main:app --reload --port 8000

# 4. Start dashboard (in another terminal)
streamlit run dashboard/app.py

# 5. Run all 5 demo scenarios
python demo_runner.py

# 6. Run the golden test set (target: ≥ 90%)
python tests/run_golden_standalone.py
```

---

## Demo Scenarios

| # | Name | Pillar | What to watch |
|---|---|---|---|
| 1 | The Confident Hallucination | Performance | Retraction banner in dashboard after stream |
| 2 | The Runaway Agent | Cost | 4th call returns 429; cost counter increments |
| 3 | The Subtle Leak | Responsibility | Instant 403 before any LLM call |
| 4 | The Overlap Case | Performance + Responsibility | One flag, two category tags |
| 5 | The Policy Swap | Governance | Same input: block under `customer_support_bot`, escalate under `internal_knowledge_assistant` |

Run a single scenario:
```bash
python demo_runner.py --scenario 3
```

---

## Architecture

```
Client → [Stage 1: PII + Injection] → POLICY AGGREGATOR → LLM
                                              │
                                           BLOCK (403)
                                              │
                                           ALLOW → stream response
                                              │
                               [Stage 2: Grounding + Loop + Toxicity]
                                              │
                                    POLICY AGGREGATOR
                                    │              │
                                ESCALATE        LOG_OK
                               (UI banner)    (Postgres)
```

Policy configs are stored in **Postgres** and cached in **Redis** (30s TTL). No proxy restart needed to change thresholds.

---

## API

### Chat proxy
```
POST /v1/chat
Headers: X-Org-Id, X-Use-Case, X-Agent-Id (optional)
Body: { "prompt": "...", "rag_context": "...", "scenario_key": "...", "tool_name": "...", "tool_args": {} }
```

### Policy management
```
POST /policy/config                     # create/update
GET  /policy/config/{org_id}/{use_case} # fetch active
```

### Audit
```
GET /v1/interactions?org_id=demo
GET /v1/flags?org_id=demo
```

---

## Switching to Live LLM Mode

```bash
# In .env:
LLM_BACKEND=live
OPENAI_API_KEY=sk-...
```

The same proxy, same checks, same dashboard — just real model responses instead of fixtures.

---

## Stack

| Component | Choice |
|---|---|
| Proxy | FastAPI + asyncpg |
| Model router | LiteLLM (mock or live) |
| Cache | Redis |
| Storage | Postgres |
| Embeddings | all-MiniLM-L6-v2 |
| Dashboard | Streamlit |
