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

| Part | Host (recommended) | How |
|------|--------------------|-----|
| `backend/` | **Azure App Service** | GitHub Actions (`main_corporatetraining.yml`, OIDC). See **[DEPLOY-AZURE.md](./DEPLOY-AZURE.md)** |
| `frontend/` | **Azure Static Web Apps** | GitHub Actions (`azure-static-web-apps-frontend.yml`). See **[DEPLOY-AZURE.md](./DEPLOY-AZURE.md)** |

> ☁️ **Azure is the primary, fully-wired path → [DEPLOY-AZURE.md](./DEPLOY-AZURE.md).**
> Other hosts are still supported: **Render** (`render.yaml`) + **Vercel** for the
> frontend, or **Google Cloud Run** (**[DEPLOY-GCP.md](./DEPLOY-GCP.md)**).

Source repo: <https://github.com/sanjula2003git/corporate_ai_version>

> ⚠️ **Order matters.** The two services reference each other, so deploy the
> **backend first**, then the frontend, then come back and give the backend the
> frontend's URL. Follow the steps in order.

### Step 1 — Deploy the backend (Render)

1. Push to GitHub (already done for the repo above).
2. In the [Render dashboard](https://dashboard.render.com): **New + → Blueprint**,
   then select the `corporate_ai_version` repo. Render auto-detects `render.yaml`
   and creates the `corporate-ai-backend` web service (`rootDir: backend`).
3. Set the secret env vars in the service's **Environment** tab:
   - `GEMINI_API_KEY` — your [Google AI Studio](https://aistudio.google.com/apikey)
     key (free tier). *Optional* — without it the chat falls back to a mock reply.
   - `FRONTEND_ORIGINS` — leave blank for now; you'll fill it in Step 3.
4. Deploy, then **copy the backend URL**, e.g. `https://corporate-ai-backend.onrender.com`.
   Open `<that-url>/docs` to confirm the API is live.

### Step 2 — Deploy the frontend (Vercel)

1. In [Vercel](https://vercel.com/new): **Add New → Project** → import
   `corporate_ai_version`.
2. Set **Root Directory = `frontend`** (the Vite app lives there).
   Build command (`npm run build`) and output dir (`dist`) come from `vercel.json`.
3. Add an environment variable:
   - `VITE_API_URL` = the Render backend URL from Step 1
     (e.g. `https://corporate-ai-backend.onrender.com`). Vite bakes this in at
     build time, so **redeploy** if you change it later.
4. Deploy, then **copy the Vercel URL**, e.g. `https://corporate-ai-version.vercel.app`.

### Step 3 — Connect them (CORS)

1. Back in Render → the backend's **Environment** tab, set:
   - `FRONTEND_ORIGINS` = your Vercel URL (e.g. `https://corporate-ai-version.vercel.app`).
     Comma-separate if you have more than one (e.g. a custom domain).
2. Render redeploys automatically. Open the Vercel URL and log in — the frontend
   now talks to the backend, and `superuser` / `superuser123` works once the DB seeds.

> ⚠️ SQLite on Render's free tier is **ephemeral** — the database resets on each
> redeploy/restart. Attach a persistent disk or use Postgres for durable data.

## How the AI chat works

A student/trainer message hits `POST /api/chat`. The backend stores it, sends the
thread to the LLM (`backend/llm.py`), stores the reply, and returns both. The
provider is auto-selected: **Gemini → Claude → mock**, so it never breaks without
a key. Admins read every conversation via the **AI Chat Logs** page.

---
*Educational material — the full-stack + AI integration stage of the SDLC program.*
