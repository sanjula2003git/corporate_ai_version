# Corporate Training Portal — AI Version

A full-stack, role-based training-management portal for **ABC Learning
Solutions**, with an **AI support assistant**. One login screen serves three
roles — **student**, **trainer**, **admin** — each with its own sidebar,
dashboard and permissions. Students and trainers chat with an AI assistant that
replies automatically; admins monitor those conversations read-only.

```
┌─────────────────────────┐        HTTP + JWT        ┌──────────────────────────┐
│  frontend/ (React/Vite) │ ───────────────────────▶ │  backend/ (FastAPI)      │
│  role-aware UI + 🤖 chat │ ◀─────────────────────── │  auth · DB · LLM (llm.py)│
└─────────────────────────┘         JSON             └───────────┬──────────────┘
                                                                  │
                                                            training.db (SQLite)
```

## Repository layout

```
corporate_ai_version/
├── frontend/        # React (Vite) single-page app — the portal UI
├── backend/         # FastAPI + SQLite API + the AI assistant (llm.py)
├── render.yaml      # one-click backend deploy (Render)
├── .gitignore
└── README.md        # you are here
```

Each subfolder has its own README with details.

## The three roles

| | Student | Trainer | Admin (and `superuser`) |
|--|---------|---------|--------------------------|
| Dashboard | own attendance %, assignments, marks | their students' progress + pending reviews | whole-org totals, every student & trainer |
| Materials | view | add / delete | add / delete |
| Assignments | submit work | create + grade | create + grade |
| Classes | join (Google Meet) | schedule | schedule |
| Attendance | view own | mark per-student | mark + audit everyone |
| People & courses | — | — | add / update / delete |
| AI chat | 🤖 ask the assistant | 🤖 ask the assistant | monitor logs (read-only) |

Permissions are enforced on the **server**, not just hidden in the UI.

## Run locally (two terminals)

**Terminal 1 — backend** (FastAPI on :8001)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**Terminal 2 — frontend** (Vite on :5273)
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5273
```

Open **http://localhost:5273** and log in.

> The AI chat works out of the box using a built-in **mock** reply. To use a
> real model, set `GEMINI_API_KEY` (free tier) in `backend/.env` — see
> `backend/.env.example`.

## Demo logins

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `superuser` | `superuser123` | Admin (second admin) |
| `suresh` / `anita` / `priya` | `trainer123` | Trainer |
| `ravi` / `meera` / `john` / `aisha` / `david` | `student123` | Student |

## Deploy

Frontend and backend are **two separate programs** → two separate services:

| Part | Host | How |
|------|------|-----|
| `backend/` | **Render** | `render.yaml` (Blueprint). Set `GEMINI_API_KEY` + `FRONTEND_ORIGINS` |
| `frontend/` | **Vercel** | Root Directory = `frontend`. Set `VITE_API_URL` to the Render URL |

Wire-up checklist:
1. Deploy the backend first; note its URL (e.g. `https://your-api.onrender.com`).
2. On Vercel set `VITE_API_URL` to that URL and deploy the frontend.
3. On Render set `FRONTEND_ORIGINS` to the Vercel URL (e.g. `https://your-app.vercel.app`) so CORS allows it.

> ⚠️ SQLite on Render's free tier is **ephemeral** — the database resets on each
> redeploy/restart. Attach a persistent disk or use Postgres for durable data.

## How the AI chat works

A student/trainer message hits `POST /api/chat`. The backend stores it, sends the
thread to the LLM (`backend/llm.py`), stores the reply, and returns both. The
provider is auto-selected: **Gemini → Claude → mock**, so it never breaks without
a key. Admins read every conversation via the **AI Chat Logs** page.

---
*Educational material — the full-stack + AI integration stage of the SDLC program.*
