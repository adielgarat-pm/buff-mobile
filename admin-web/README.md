# admin-web

Vite + React 19 + Tailwind + shadcn admin dashboard for BUFF.

Connected to: buff-production Supabase project (`gfrongfnyigxsexuofrg`).

## Setup

1. Copy the env example file:
   ```
   cp .env.local.example .env.local
   ```
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from buff-production project settings (Settings → API).
3. Run the dev server:
   ```
   npm run dev --workspace=admin-web
   ```
   Or from inside the admin-web/ directory: `npm run dev`

## Auth

Admin access requires a row in the `public.admin_users` table in buff-production.
Sign-in is via Magic Link (no password). Only `adi.elgarat@gmail.com` is currently authorized.

See `docs/sessions/admin-dashboard-port/phase-3-migration.sql` for the migration SQL
that sets up the auth foundation.

## Build

```
npm run build --workspace=admin-web
```
