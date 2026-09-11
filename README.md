# CCF Welcome Center — Guest Information System (GIS)

Guest check-in and discipleship journey tracker for the Welcome Center, covering all 5 phases:
Welcome & Intake -> Engagement & Prayer -> Self-Selection -> Materials Delivery -> DGroup Registration.

**Stack:** Next.js (App Router) on Vercel, Supabase (Postgres + Auth)

## How it works

- **PCs** (staff) sign in at `/pc/login` and work from `/pc/dashboard` and `/pc/session/[id]`.
- **Guests** never sign in. Each check-in session gets an unguessable `qr_token`; guests access
  their own intake/prayer/selection/DGroup forms via `/g/[token]`, scanned from the QR code shown
  on the PC's screen. This is enforced by using the Supabase **service role** key server-side
  (see `src/lib/supabase/admin.ts`) — guest pages never get a Supabase Auth session.

## First-time setup

1. **Create the database.** In your Supabase project, open the SQL Editor and run
   `supabase/migrations/0001_init.sql`. (Or use the Supabase CLI: `supabase db push`.)

2. **Create a PC account.**
   - Supabase Dashboard -> Authentication -> Add user (set email + password).
   - Then in SQL Editor:
     ```sql
     insert into staff (auth_user_id, full_name, email, role)
     values ('<the auth user''s UUID>', 'Jane Doe', 'jane@example.com', 'pc');
     ```

3. **Environment variables.** Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase -> Settings -> API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, **service_role** secret (never expose to the client)
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally, your Vercel URL in production

4. **Run locally:**
   ```bash
   npm install
   npm run dev
   ```

## Deploying

1. Push this repo to GitHub.
2. Import the repo in Vercel -> it auto-detects Next.js.
3. Add the same env vars from `.env.local` in Vercel -> Project -> Settings -> Environment Variables.
4. Set `NEXT_PUBLIC_APP_URL` to your real Vercel URL (redeploy after the first deploy gives you the URL).

## Decisions still to make (currently placeholders)

- **Unique # scheme** (`src/app/actions.ts` -> `startCheckin`): currently a timestamp-based
  placeholder (`G-XXXXXX`). Replace with the real badge/ID scheme once decided.
- **Print integration** (`triggerMaterialsDelivery`): currently just flips a status flag.
  Wire up to your actual print queue / printer API.
- **Email integration** (`triggerMaterialsDelivery`): currently simulated as sent. Wire up to
  an email provider (e.g. Resend, Postmark) and hook up real bounce webhooks instead of the
  manual "Mark email as bounced" button.
- **DGroup leaders**: seed the `dgroup_leaders` table with real leaders/groups so Phase 5 routing
  has options to route to.

## Project structure

```
src/app/pc/          PC-facing pages (auth-protected via middleware.ts)
src/app/g/[token]/   Guest-facing pages (token-scoped, no auth)
src/app/actions.ts   All server actions - one per phase transition
src/lib/supabase/    client.ts (browser), server.ts (PC auth), admin.ts (guest/service-role)
supabase/migrations/ Database schema
```
