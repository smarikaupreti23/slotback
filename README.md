# SlotBack — Appointment Waitlist Manager

Full-stack version of the SlotBack MVP (La Trobe University BUS4012). A front-desk coordinator signs in, records a cancelled appointment, sees the ranked waitlist, and sends offers to the top 3 patients. The first to accept gets the slot and the other offers are cancelled automatically.

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React 18 + Vite + React Router | Vercel (project 1) |
| Backend | Python, FastAPI | Vercel (project 2, Python runtime) |
| Database + Auth | Supabase (Postgres, Supabase Auth) | Supabase |

```
Browser (React)  ──HTTPS + Bearer token──▶  FastAPI  ──service-role key──▶  Supabase (Postgres + Auth)
   no secrets                                 holds all secrets (env vars)       RLS on, no public policies
```

## Repository structure

```
slotback-app/
├── frontend/            React app (Vite)
│   └── src/
│       ├── components/  AppButton, FormSectionWrapper, InputField, SlotBackStepper, TopNav
│       ├── pages/       LoginPage, CancelSlotPage, WaitlistPage, ConfirmationPage
│       └── lib/api.js   the only place the frontend talks to the backend
├── backend/             FastAPI app
│   └── app/
│       ├── main.py      app + CORS
│       ├── config.py    reads environment variables
│       ├── db.py        Supabase client
│       ├── auth.py      validates the Supabase access token
│       ├── schemas.py   request validation (Pydantic)
│       └── routes/      auth, waitlist, cancellations
├── supabase/schema.sql  tables, RLS and seed data
└── .gitignore           excludes .env files, node_modules, .venv, dist
```

## Data model (Supabase)

- `practitioners` — the three clinicians
- `waitlist_patients` — name, phone, service, status (`Pending` / `Offer Sent` / `Confirmed`), `added_at` (days waiting is calculated from this)
- `cancellations` — practitioner, date, time slot, cancelling patient, reason, status
- `offers` — one row per patient notified for a cancellation (`Sent` / `Accepted` / `Cancelled`)
- Accounts live in Supabase Auth (`auth.users`)

## Security / credentials

- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` exist **only** as backend environment variables (`backend/.env` locally, Vercel project settings in production). `.env` is git-ignored; `.env.example` files show the names only.
- The frontend contains no Supabase key. It only knows the public backend URL (`VITE_API_URL`).
- All tables have Row Level Security enabled with no policies, so the public anon key cannot read or write them. Only the backend can.
- Every API route except login/register requires a valid Supabase access token.

## Run locally

Prerequisites: Node 20+, Python 3.12+, a Supabase project.

1. **Database:** Supabase dashboard → SQL Editor → paste and run `supabase/schema.sql`.
2. **Backend:**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   copy .env.example .env          # then fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
   uvicorn app.main:app --reload --port 8000
   ```
3. **Frontend** (new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173 (Vite proxies `/api` to port 8000). Click **Create an account** to register a coordinator.

## Deploy (Vercel)

Import the same GitHub repo **twice**:

1. **Backend project** — Root Directory `backend`. Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS` (set after step 2 to the frontend URL). Deploy, then check `https://<backend-url>/api/health`.
2. **Frontend project** — Root Directory `frontend`, framework Vite. Environment variable: `VITE_API_URL` = the backend URL (no trailing slash). Deploy.
3. Go back to the backend project, set `CORS_ORIGINS` to the frontend URL and redeploy.

## Differences from the MVP

Same screens, validation, colours and flow. What is now real: sign-in (Supabase Auth), practitioners and waitlist loaded from the database, cancellations/offers/bookings saved to the database, days-waiting calculated from the date added, and the confirmation screen read back from stored data. Offer SMS and the patient's "YES" reply are still simulated: the top-ranked patient is recorded as the first responder.
