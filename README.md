# Orstra AI — No-Code AI Agent Platform

Build and deploy AI agents that automate your business workflows — no code required.

## Quick Start

```bash
# 1. Copy env file and fill in your keys
cp .env.example .env

# 2. Start everything
docker compose up -d

# 3. Seed demo data (optional)
docker compose exec backend python seed.py

# 4. Open the app
open http://localhost:3000
```

**Demo login:** `demo@orstra.ai` / `demo123`

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · SQLAlchemy |
| Database | PostgreSQL 15 + pgvector |
| AI | OpenAI GPT-4o · LangChain |
| Queue | Redis · RQ |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS |
| Auth | JWT (local) — swap for Supabase Auth in production |

---

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | GPT-4o + embeddings |
| `SECRET_KEY` | JWT signing key |
| `ENCRYPTION_KEY` | Fernet key for encrypting connector credentials |

Generate a Fernet key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Architecture

```
Trigger (email / cron / webhook)
    ↓
Orchestrator
    ├── Planner (LLM call 1) — intent + tool plan
    ├── Guardrails check (synchronous, no LLM)
    ├── Tool execution loop (max 5 calls)
    │   └── SearchDocs · SendEmail · ShopifyOrders · SlackNotify · ...
    ├── Output generation (LLM call 2)
    ├── Guardrails check again
    └── Execute action + save TaskRun
```

---

## Development (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Worker
cd backend
python workers/task_worker.py

# Frontend
cd frontend
npm install
npm run dev
```

You'll need PostgreSQL with the pgvector extension and Redis running locally.
