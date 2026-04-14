# Orstra AI

> No-code AI agent platform — build agents that automatically reply to emails, run on a schedule, or trigger via webhook. Powered by Anthropic Claude.

**Live demo:** [orstra-ai.vercel.app](https://orstra-ai.vercel.app)

![Orstra AI](https://img.shields.io/badge/built%20with-FastAPI%20%2B%20React-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What is it?

Orstra AI lets non-technical users build AI agents through a UI — no Python, no LangChain, no prompt engineering required.

Each agent:
- Gets triggered by **email, webhook, or schedule**
- Uses **Claude AI** to classify intent, decide what to do, and generate a response
- Can call **tools** (search docs, send email, search the web, Slack, Shopify, etc.)
- Has **guardrails** — escalation rules, confidence thresholds, cost limits
- Logs every run with intent, cost, tools used, and full output

The platform watches your Gmail inbox directly — no Zapier or Make.com needed.

---

## Screenshots

**Agent builder** — 5-step wizard to configure name, trigger, tools, rules, and deploy

**Run log** — every AI run is logged with intent, confidence, tools called, cost, and output

**Connectors** — connect Gmail, Slack, Shopify with credentials stored encrypted

---

## Stack

| Layer | Tech |
|---|---|
| **Backend** | Python 3.11 · FastAPI · SQLAlchemy 2.0 |
| **Database** | PostgreSQL + pgvector (Neon) |
| **AI** | Anthropic Claude (user provides their own API key) |
| **Scheduler** | APScheduler (in-process, no Redis needed) |
| **Frontend** | React 18 · TypeScript · Vite · TailwindCSS |
| **Auth** | JWT (local, no Supabase) |
| **Deployment** | Render (backend) · Vercel (frontend) · Neon (DB) |

---

## Features

- ✅ **5-step agent builder** — name, trigger, tools, guardrails, review & deploy
- ✅ **Email trigger** — polls Gmail IMAP every 2 min, fires agent on new emails
- ✅ **Schedule trigger** — cron-based (hourly, daily, weekly, custom)
- ✅ **Webhook trigger** — any external tool can POST to a unique URL
- ✅ **Knowledge base** — upload PDFs/TXT/DOCX, searched with PostgreSQL FTS
- ✅ **Tools** — search docs, send email (Gmail SMTP), search web, Slack, Shopify
- ✅ **Guardrails** — keyword escalation, confidence threshold, cost limit, custom instructions
- ✅ **Run analytics** — every run logged with intent, tools, cost, AI response
- ✅ **Version history** — every agent edit saves a snapshot, restore any version
- ✅ **Per-user API key** — users bring their own Anthropic key (stored encrypted)
- ✅ **Per-agent model** — each agent can use a different Claude model

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/iohnzab/orstra-ai.git
cd orstra-ai

# 2. Create env file
cp .env.example .env
# Edit .env — set SECRET_KEY and ENCRYPTION_KEY (see below)

# 3. Start everything
docker compose up -d

# 4. Open the app
open http://localhost:3000
```

Generate required keys:
```bash
# SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# ENCRYPTION_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Quick Start (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env  # fill in values
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local  # set VITE_API_URL=http://localhost:8000
npm run dev
```

You need PostgreSQL with the pgvector extension running locally.

---

## Environment Variables

```env
# Required
SECRET_KEY=          # JWT signing secret (any random string)
ENCRYPTION_KEY=      # Fernet key for encrypting connector credentials
DATABASE_URL=        # PostgreSQL connection string

# Optional (users add their Anthropic key via the Settings UI)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-7-sonnet-20250219

# API base URL (used for webhook URLs shown in the UI)
API_BASE_URL=http://localhost:8000
```

---

## Deploy for free

| Service | What it runs | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | PostgreSQL database | ✅ Free |
| [Render](https://render.com) | FastAPI backend | ✅ Free (512MB) |
| [Vercel](https://vercel.com) | React frontend | ✅ Free |

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

---

## Architecture

```
Trigger (email / schedule / webhook)
    ↓
Orchestrator
    ├── Planner (Claude call 1) — classify intent, plan tools
    ├── Guardrails check (no LLM — keyword/confidence/cost rules)
    ├── Tool execution (max 5 calls)
    │   ├── search_docs    — PostgreSQL full-text search over uploaded docs
    │   ├── send_email     — Gmail SMTP
    │   ├── search_web     — HTTP search
    │   ├── slack_notify   — Slack bot token
    │   └── shopify_*      — Shopify Admin API
    ├── Output generation (Claude call 2) — compose final response
    ├── Guardrails check again
    └── Execute action + save TaskRun to DB
```

---

## Contributing

PRs welcome! Some ideas:

- [ ] More connectors (HubSpot, Notion, WhatsApp, Airtable)
- [ ] Visual flow builder (drag & drop)
- [ ] Multi-step agent chains
- [ ] Stripe billing integration
- [ ] Support for OpenAI / Gemini / local models
- [ ] Agent templates marketplace

---

## License

MIT — free to use, fork, and build on.
