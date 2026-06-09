# Backend — FastAPI + SQLite + AI assistant

The API for the Corporate Training portal. Same role-based portal API (auth,
students, trainers, courses, attendance, assignments, certificates, reports,
dashboards) **plus** an AI support chat: when a student or trainer sends a
message, the backend asks an LLM and stores the reply automatically.

## Run locally

```bash
cd backend
python -m pip install -r requirements.txt     # first time only
python -m uvicorn main:app --reload --port 8001
```

Open the interactive API docs at **http://127.0.0.1:8001/docs**.

On first run it creates and seeds `training.db` automatically. Delete that file
any time to reset to the starter data.

## Configuration (optional)

Copy `.env.example` to `.env`. With **no** keys the chat uses a built-in mock so
the demo still works. To go live, set one of:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini (free tier) — recommended |
| `ANTHROPIC_API_KEY` | Anthropic Claude (paid) — used only if Gemini is blank |
| `FRONTEND_ORIGINS` | Production CORS — comma-separated deployed frontend URLs |

The provider is chosen automatically: Gemini → Claude → mock (see `llm.py`).

## Layout

```
backend/
├── main.py            # app, CORS, /auth/login, mounts the routers
├── auth.py            # JWT login + role guards (require_role)
├── database.py        # SQLite connection + first-time seeding (10 demo users)
├── models.py          # SQLModel tables
├── llm.py             # the AI brain: Gemini / Claude / mock + system prompt
├── requirements.txt
└── routers/           # one module per resource (students, chat, dashboards, …)
```

## Demo logins

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `superuser` | `superuser123` | Admin (second admin) |
| `suresh` / `anita` / `priya` | `trainer123` | Trainer |
| `ravi` / `meera` / `john` / `aisha` / `david` | `student123` | Student |

> Authorization is enforced on the **server**: a student hitting an admin-only
> endpoint gets `403 Forbidden`, regardless of the UI.

## Deploy (Render)

A `render.yaml` at the repo root deploys this folder as a Web Service. Set
`GEMINI_API_KEY` and `FRONTEND_ORIGINS` in the Render dashboard. Note: SQLite on
Render's free tier is **ephemeral** — attach a persistent disk or use Postgres
if you need data to survive redeploys.
