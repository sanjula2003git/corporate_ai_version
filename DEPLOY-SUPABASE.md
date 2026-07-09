# Deploy the Database Separately on Supabase (Postgres)

Right now the database is a **SQLite file (`training.db`) bundled inside the backend**.
On Render's free tier that file is *ephemeral* — it is wiped and re-seeded on every
redeploy/restart, so anything students create is lost.

This guide moves the data into a **standalone, always-on Postgres database on Supabase**.
The backend keeps running on Render; only the *storage* moves out to its own service
that has its own dashboard link you can share with students.

> **Why this is easy:** the code was already written to read a `DATABASE_URL`
> environment variable. If that variable is set, it uses Postgres; if not, it falls
> back to the local SQLite file. So there is **nothing to install or change locally** —
> you only set one environment variable on Render.

---

## Part A — Create the Supabase database (in the browser, ~5 min)

1. Go to **https://supabase.com** → **Sign in** with GitHub (free, no card).
2. Click **New project**.
   - **Name:** `corporate-training-db`
   - **Database Password:** click *Generate a password* and **COPY IT somewhere safe** —
     you need it in Part B. (You can reset it later under *Project Settings → Database*.)
   - **Region:** pick the one closest to your Render region (e.g. *EU/US East*).
   - **Plan:** Free.
3. Click **Create new project** and wait ~2 minutes while it provisions.

## Part B — Copy the connection string

1. In your Supabase project, click **Connect** (top bar) — or **Project Settings → Database**.
2. Choose the **Session pooler** tab (recommended for Render).
   It looks like this:
   ```
   postgresql://postgres.abcdefghijklmno:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` with the database password you saved in Part A.
   That final string is your **`DATABASE_URL`**.

> **Which connection do I pick?** Use the **Session pooler** (port `5432`, host
> `...pooler.supabase.com`). The "Direct connection" is IPv6-only and Render can't
> reach it. The Session pooler works everywhere and suits SQLAlchemy's connection pool.

## Part C — Point Render at Supabase

1. Open your backend on Render → **corporate-ai-backend** → **Environment**.
2. Add a new environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** the full connection string from Part B (with the real password, **no**
     surrounding quotes, **no** trailing slash).
3. Click **Save changes**. Render redeploys automatically.
4. On first boot the app runs `init_db()`, which **creates all the tables in Supabase
   and seeds them once** (same demo logins as before). Watch the Render **Logs** — you
   should see it start cleanly with no `sqlite` errors.

That's it — the backend is now reading and writing to Supabase. Data survives every
redeploy from now on.

## Part D — Verify it worked

- **From the app:** log in as `superuser` / `superuser123`, create a student or an
  assignment, then **redeploy the backend on Render**. The new record is still there
  (with SQLite it would have vanished). ✅
- **From Supabase:** open **Table Editor** in the Supabase dashboard — you'll see
  `userdb`, `studentdb`, `assignmentdb`, etc. filled with rows. This is the link you
  can show students to *see the live database* behind the app.

---

## Sharing a link with students

The Supabase **Table Editor / dashboard** is the natural "here is our database" link,
but it lives under *your* Supabase login. Two clean options:

1. **Best for teaching:** invite students to the project as read-only members —
   *Project Settings → Team → Invite* (or *Organization → Members*). They log into
   Supabase and browse the real tables live.
2. **Quick demo:** share your screen / the app's `/docs` (FastAPI Swagger at
   `https://corporate-ai-backend.onrender.com/docs`) — every query there now hits
   Supabase.

> Do **not** paste the raw `DATABASE_URL` (it contains the DB password) into any
> student-facing chat or slide. Treat it like a key.

---

## What changed in the code (already done for you)

| File | Change |
|------|--------|
| `backend/database.py` | Normalises `postgres://` → `postgresql://`; only applies the SQLite-only `check_same_thread` flag on SQLite; adds `pool_pre_ping=True` so dropped pooler connections reconnect quietly. Removed hard-coded assignment ids so Postgres's auto-increment sequence stays correct. |
| `backend/requirements.txt`, `requirements.txt` | Added `psycopg2-binary` (the Postgres driver SQLAlchemy needs). |

Nothing changes for local development: with no `DATABASE_URL` set, the app still uses
the local `training.db` SQLite file exactly as before.

---

## Troubleshooting

- **`could not translate host name` / connection timeout** → you used the *Direct*
  connection. Switch to the **Session pooler** string (Part B).
- **`password authentication failed`** → the `[YOUR-PASSWORD]` placeholder is still in
  the string, or the password has a special character. Reset it in *Project Settings →
  Database* and use the new one.
- **`No module named 'psycopg2'`** → Render built from an old commit. Push the updated
  `requirements.txt` and redeploy (clear build cache if needed).
- **Tables are empty** → seeding only runs when the `userdb` table has no rows. If you
  created tables manually first, drop them in the Supabase SQL editor and let the app
  re-seed on the next restart.
