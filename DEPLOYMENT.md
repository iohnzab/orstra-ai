# Deployment Guide

Deploy Orstra AI for free using Neon (database), Render (backend), and Vercel (frontend).

---

## 1. Database — Neon (free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the **Connection string** (looks like `postgresql://user:pass@host/dbname`)
4. Open the **SQL Editor** and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT;
```

---

## 2. Backend — Render (free Python server)

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New → Web Service** → connect your forked repo
3. Set these settings:
   - **Root directory:** `backend`
   - **Runtime:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Run `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ENCRYPTION_KEY` | Run `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `DATABASE_URL` | Your Neon connection string |
| `ANTHROPIC_MODEL` | `claude-3-7-sonnet-20250219` |
| `API_BASE_URL` | Your Render URL e.g. `https://your-app.onrender.com` |

5. Click **Deploy** — wait ~3 minutes
6. Copy your Render URL (e.g. `https://your-app.onrender.com`)

---

## 3. Frontend — Vercel (free hosting)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** → import your forked repo
3. Set **Root Directory** to `frontend`
4. Add this **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL |

5. Click **Deploy**

---

## 4. Fix page refresh (SPA routing)

Vercel needs a `vercel.json` in the `frontend` folder — it's already included in this repo so this is handled automatically.

---

## 5. First login

Once deployed, go to your Vercel URL:

1. Click **Get started free** → create an account
2. Go to **Settings** → paste your [Anthropic API key](https://console.anthropic.com)
3. Go to **Connectors** → connect Gmail (email + app password)
4. Go to **Agents** → create your first agent

---

## Troubleshooting

**"Authentication failed" on signup**
- Check your `DATABASE_URL` is correct in Render environment variables
- Check Render logs for errors

**Agent runs fail with model error**
- Go to your agent → Edit → Step 1 → update the AI Model field
- Check [Anthropic's model list](https://docs.anthropic.com/en/docs/about-claude/models) for current model names

**Memory limit exceeded (Render free tier)**
- The free tier has 512MB RAM — this app is optimized to stay under that
- If it happens, check Render logs for what's using memory

**Email trigger not firing**
- Make sure your agent status is **Active** (deployed)
- Make sure Gmail is connected in Connectors
- The engine checks every 2 minutes — wait a moment
- Check that Gmail IMAP access is enabled in your Google account settings
