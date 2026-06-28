# Deploy to Microsoft Azure

This repo deploys as **two services** on Azure:

| Part | Azure service | Deployed by |
|------|---------------|-------------|
| `backend/` (FastAPI) | **App Service** (Linux, Python 3.11) | `.github/workflows/main_corporatetraining.yml` |
| `frontend/` (React/Vite) | **Static Web Apps** | `.github/workflows/azure-static-web-apps-frontend.yml` |

> ⚠️ **Order matters.** Deploy the **backend first**, get its URL, then build the
> frontend pointing at it, then allow the frontend's URL in the backend's CORS.

---

## 1 — Backend → Azure App Service

The workflow already exists and authenticates with **OIDC** (no passwords). It is
wired to an App Service named **`Corporatetraining`** via three GitHub secrets that
Azure created for you (`AZUREAPPSERVICE_CLIENTID_…`, `…TENANTID_…`, `…SUBSCRIPTIONID_…`).

**It pushes on every commit to `main`.** What this repo fixed so it actually works:

- ✅ Added `backend/requirements.txt` (the workflow & Oryx both need it here).
- ✅ Set the **startup command** to `bash startup.sh` (FastAPI needs uvicorn, not gunicorn).
- ✅ `startup.sh` now binds to Azure's `$PORT`.

### App settings to configure (Portal → App Service → *Settings → Environment variables*)

| Name | Value | Why |
|------|-------|-----|
| `FRONTEND_ORIGINS` | your Static Web App URL, e.g. `https://nice-bay-123.azurestaticapps.net` | CORS allow-list |
| `GEMINI_API_KEY` | *(optional)* your [Google AI Studio](https://aistudio.google.com/apikey) key | enables real AI chat (else mock) |
| `DB_PATH` | `/home/data/training.db` | **persistent** SQLite (survives restarts; `/home` is durable) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | lets Azure install `requirements.txt` |

Health check: open `https://corporatetraining.azurewebsites.net/` → JSON message,
or `/docs` for the API explorer.

---

## 2 — Frontend → Azure Static Web Apps

1. Portal → **Create a resource → Static Web App** (Free tier). For "Deployment
   details" pick **Other** (this repo's workflow handles the build).
2. Copy its **deployment token** (Static Web App → *Manage deployment token*) and
   add it as a GitHub repo **secret**: `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. Add a GitHub repo **variable** (Settings → Secrets and variables → Actions →
   *Variables*): `VITE_API_URL = https://corporatetraining.azurewebsites.net`
   (your backend URL, **no trailing slash**). Vite bakes it in at build time.
4. Push to `main` (or run the workflow manually) → the frontend builds and deploys.

---

## 3 — Connect them

1. Copy the Static Web App URL.
2. Backend App Service → set `FRONTEND_ORIGINS` to that URL → the app restarts.
3. Open the Static Web App URL and log in (see demo logins in the main README).

---

## Doing it from the CLI instead (optional)

You authenticate; the rest is scriptable:

```bash
az login                       # interactive — your browser, no password shared
RG=corporate-ai-rg
az group create -n $RG -l eastus

# Backend (App Service)
az appservice plan create -g $RG -n corp-plan --is-linux --sku B1
az webapp create -g $RG -p corp-plan -n Corporatetraining --runtime "PYTHON:3.11"
az webapp config set -g $RG -n Corporatetraining --startup-file "bash startup.sh"
az webapp config appsettings set -g $RG -n Corporatetraining --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true DB_PATH=/home/data/training.db
# then connect the GitHub repo for CI/CD, or `az webapp up` from backend/.
```

> SQLite is fine for a demo. For real multi-instance use, switch `DATABASE_URL`
> to **Azure Database for PostgreSQL** and add `psycopg[binary]` to requirements.
