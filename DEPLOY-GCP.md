# Deploy to Google Cloud (Cloud Run) — Teaching Walkthrough

A live, hands-on guide to deploying the **Corporate Training Portal — AI Version**
to **Google Cloud Run**. Written for a mixed corporate audience (beginner → CEO):
mostly **console (web) clicks**, with a few copy-paste commands run in **Cloud
Shell** — Google's browser terminal, so **nobody installs anything** on their laptop.

```
┌──────────────────────────┐      HTTPS       ┌──────────────────────────┐
│ frontend  (Cloud Run)    │ ───────────────▶ │ backend   (Cloud Run)    │
│ React build served by    │ ◀─────────────── │ FastAPI + SQLite + AI     │
│ nginx on :8080           │      JSON        │ uvicorn on :8080          │
└──────────────────────────┘                  └──────────────────────────┘
```

## Why Cloud Run?

- **It runs containers.** This repo already has a `Dockerfile` in `backend/` and
  `frontend/`, so the "recipe" for each box is done — Cloud Run just runs them.
- **Scales to zero = budget-friendly.** You pay only while a request is being
  served; idle services cost ~nothing. Generous always-free tier.
- **A real, name-brand cloud skill** — the same flow used by actual companies.

> 🎓 **Teaching note — the mental model.** A *Dockerfile* is a recipe. *Building*
> it produces an *image* (a sealed box with the app inside). *Cloud Run* runs
> *containers* (running copies of that box) and gives each a public HTTPS URL.
> Backend and frontend are **two separate programs → two separate boxes → two
> Cloud Run services.**

---

## ⚠️ Order matters

The two services point at each other, so deploy in this order:

1. **Backend first** → get its URL.
2. **Frontend second**, told where the backend lives (`VITE_API_URL`).
3. **Go back to the backend** and tell it the frontend's URL (`FRONTEND_ORIGINS`,
   for CORS).

Do it out of order and the browser blocks the calls (CORS) or the frontend points
at nothing. Follow the steps top to bottom.

---

## Step 0 — One-time project setup (console + Cloud Shell)

**In the browser ([console.cloud.google.com](https://console.cloud.google.com)):**

1. **Create a project.** Top bar → project dropdown → **New Project** →
   name it e.g. `corporate-ai-training` → **Create**. Select it.
2. **Enable billing.** Billing → link a billing account. Cloud Run has a free
   tier; you still need billing enabled. (New accounts get free credits.)
3. **Open Cloud Shell.** Click the **`>_`** terminal icon, top-right. A browser
   terminal opens with `gcloud` and `docker` already installed — **no local
   install needed**. (You can also clone the repo into Cloud Shell with
   `git clone https://github.com/sanjula2003git/corporate_ai_version`.)

**In Cloud Shell**, set your project and turn on the services we'll use:

```bash
# Tell gcloud which project to work in (use YOUR project id):
gcloud config set project corporate-ai-training

# Enable the APIs: Cloud Run, Cloud Build (builds images), Artifact Registry (stores them)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Pick a region once and reuse it (Mumbai shown; any region is fine)
gcloud config set run/region asia-south1
```

> 🎓 The first time you run a deploy, gcloud may ask to create a default
> Artifact Registry repo or grant a permission — answer **Y**.

---

## Step 1 — Deploy the BACKEND (Cloud Run, from source)

The backend has **no build-time secrets**, so Cloud Run can build *and* deploy it
in one command straight from the source folder.

**In Cloud Shell**, from inside the repo:

```bash
cd corporate_ai_version/backend

gcloud run deploy corporate-ai-backend \
  --source . \
  --allow-unauthenticated \
  --port 8080
```

- `--source .` → Cloud Build reads `backend/Dockerfile`, bakes the image, stores
  it in Artifact Registry, and Cloud Run runs it. (First run takes a few minutes.)
- `--allow-unauthenticated` → the API is publicly reachable (it's behind its own
  JWT login).
- When it finishes it prints a **Service URL** like
  `https://corporate-ai-backend-xxxxxxxx-el.a.run.app`.

**Verify:** open `<that-URL>/docs` in your browser — the FastAPI Swagger page
means the backend is live. **Copy the backend URL; you need it in Step 2.**

> 🎓 The AI chat works immediately using a built-in **mock** reply. For real
> answers, add a free [Google AI Studio](https://aistudio.google.com/apikey) key
> — see Step 3 (we set env vars there).

---

## Step 2 — Deploy the FRONTEND (build with the backend URL, then deploy)

The frontend is different: Vite **bakes `VITE_API_URL` into the JavaScript at
build time** (`import.meta.env.VITE_API_URL`). A plain `--source` deploy can't
pass a build argument, so we use the included **`frontend/cloudbuild.yaml`** to
build the image with the URL, then deploy that image.

**In Cloud Shell:**

```bash
cd ../frontend     # now in corporate_ai_version/frontend

# Fill in: your region, your PROJECT id, and the BACKEND URL from Step 1.
# (No trailing slash on the backend URL — a slash makes requests hit //api/... → 404.)

gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_VITE_API_URL=https://corporate-ai-backend-xxxxxxxx-el.a.run.app,_IMAGE=asia-south1-docker.pkg.dev/corporate-ai-training/cloud-run-source-deploy/frontend

gcloud run deploy corporate-ai-frontend \
  --image asia-south1-docker.pkg.dev/corporate-ai-training/cloud-run-source-deploy/frontend \
  --allow-unauthenticated \
  --port 8080
```

- `_VITE_API_URL` → the backend URL, **no trailing slash**.
- `_IMAGE` → where to store the built image:
  `REGION-docker.pkg.dev/PROJECT/REPO/frontend`. The `cloud-run-source-deploy`
  repo is the one Cloud Run auto-creates in Step 1; reuse it (or any Artifact
  Registry repo you've made).
- nginx inside the image serves the built site on **:8080** (Cloud Run's default).

When it finishes, **copy the frontend Service URL**, e.g.
`https://corporate-ai-frontend-xxxxxxxx-el.a.run.app`.

> 🎓 **Why a build arg, not an env var?** The browser downloads pre-built
> JavaScript — there's no server to read an env var at page-load. So the API URL
> must be *frozen into the JS when we build*. Change the backend URL later → you
> must **rebuild** the frontend, not just restart it.

---

## Step 3 — Connect them + add the AI key (env vars on the backend)

Now tell the backend who's allowed to call it (CORS) and, optionally, give it the
AI key. **Console path (GUI-friendly):**

1. **Cloud Run** → **corporate-ai-backend** → **Edit & deploy new revision** →
   **Variables & Secrets**.
2. Add:
   - **`FRONTEND_ORIGINS`** = your frontend URL from Step 2
     (e.g. `https://corporate-ai-frontend-xxxxxxxx-el.a.run.app`). **No trailing
     slash.** Comma-separate if you add a custom domain later.
     *(Note the **S** — the variable is `FRONTEND_ORIGINS`, plural.)*
   - **`GEMINI_API_KEY`** = your Google AI Studio key *(optional — omit it and
     the chat uses the mock reply)*.
3. **Deploy** the new revision.

**Or, equivalently, in Cloud Shell:**

```bash
gcloud run services update corporate-ai-backend \
  --update-env-vars FRONTEND_ORIGINS=https://corporate-ai-frontend-xxxxxxxx-el.a.run.app
# add ,GEMINI_API_KEY=your_key  to enable real AI answers
```

**Final test:** open the **frontend URL** and log in with `admin` / `admin123`.
The portal now talks to the backend on Cloud Run. 🎉

---

## Demo logins

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `superuser` | `superuser123` | Admin (second admin) |
| `suresh` / `anita` / `priya` | `trainer123` | Trainer |
| `ravi` / `meera` / `john` / `aisha` / `david` | `student123` | Student |

---

## ⚠️ Known limitation — the database resets

The backend uses **SQLite** (`training.db`) baked into the container. A container
filesystem is **ephemeral**: every new revision or scale-from-zero restart gives a
fresh copy, so **anything created at runtime is lost** and the DB re-seeds. The
demo logins above always work because they're seeded on startup.

For durable data, the next lesson is to swap SQLite for **Cloud SQL (Postgres)** —
a managed database that lives outside the container. (Good follow-on module.)

---

## Cheat sheet

| Part | Command (in Cloud Shell) |
|------|--------------------------|
| Backend | `gcloud run deploy corporate-ai-backend --source . --allow-unauthenticated --port 8080` |
| Frontend build | `gcloud builds submit --config cloudbuild.yaml --substitutions=_VITE_API_URL=<backend-url>,_IMAGE=<region>-docker.pkg.dev/<project>/cloud-run-source-deploy/frontend` |
| Frontend deploy | `gcloud run deploy corporate-ai-frontend --image <same _IMAGE> --allow-unauthenticated --port 8080` |
| Wire CORS | `gcloud run services update corporate-ai-backend --update-env-vars FRONTEND_ORIGINS=<frontend-url>` |
| See URLs | `gcloud run services list` |
| Tear down (stop billing) | `gcloud run services delete corporate-ai-backend corporate-ai-frontend` |

### Common gotchas

- **Trailing slash** on `VITE_API_URL` or `FRONTEND_ORIGINS` → `//api/...` 404s
  and CORS failures. Never end these URLs with `/`.
- **CORS error in the browser console** → `FRONTEND_ORIGINS` on the backend
  doesn't exactly match the frontend URL (scheme + host, no slash). Fix and
  redeploy the backend revision.
- **Changed the backend URL?** You must **rebuild** the frontend (Step 2) — the
  old URL is frozen into its JavaScript.
- **`--port 8080`** matters: both containers listen on 8080 (uvicorn flag /
  nginx.conf). Cloud Run routes to that port.

---
*Educational material — cloud-deployment module of the SDLC program. Companion to
the local-run instructions in [README.md](./README.md).*
