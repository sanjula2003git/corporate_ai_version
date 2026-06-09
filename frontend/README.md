# Frontend — React (Vite) advanced portal

The React single-page app for the Corporate Training portal. One login screen,
then a **role-aware** experience: students, trainers and admins each get a
different sidebar, dashboard and permissions. Includes the 🤖 AI assistant
widget (students/trainers) and a read-only **AI Chat Logs** monitor (admins).

## Run locally

```bash
cd frontend
npm install        # first time only
npm run dev        # → http://localhost:5273
```

The backend must be running (default `http://127.0.0.1:8001`). See the root
README to start both together.

## Configuration

The backend URL is read from `VITE_API_URL` (see `.env.example`):

- **Local dev:** leave it unset — it defaults to `http://127.0.0.1:8001`.
- **Production:** set `VITE_API_URL` to your deployed backend, e.g.
  `https://your-api.onrender.com`. Vite bakes it in at build time.

## Structure

```
frontend/src/
├── App.jsx                  # routes + role guards (RequireAuth / RequireRole)
├── pages/                   # one screen per route (Dashboard, Students, …)
│   └── Dashboard.jsx        # role dispatcher → Student / Trainer / Admin view
├── components/
│   ├── StudentDashboard.jsx # the three role dashboards
│   ├── TrainerDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── ChatWidget.jsx       # 🤖 AI assistant (students & trainers)
│   └── …                    # shared tables, cards, layout
├── services/api.js          # the data layer — every backend call lives here
└── utils/richText.jsx       # renders **bold** in AI replies
```

## Deploy (Vercel)

`vercel.json` is included (build → `dist`, SPA rewrites). Set **Root Directory**
to `frontend` and add the `VITE_API_URL` environment variable pointing at your
deployed backend.
