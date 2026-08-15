-- 0015_enable_rls_deny_anon.sql
--
-- Lock the anon key out of every table. See V2_PLAN.md §6.
--
-- Context: nine tables shipped with RLS disabled while the app connected with
-- the anon key, which is served to the browser. Anyone holding that key could
-- read or write every row, including `reps`, which stores PBKDF2 password
-- hashes.
--
-- Strategy: enable RLS and deliberately create NO policies. With RLS on and no
-- policy present, Postgres denies all access to `anon` and `authenticated`.
-- The service-role key bypasses RLS entirely, so the application keeps working
-- unchanged — every read and write already happens server-side through
-- `src/lib/queries.ts`, `src/app/actions.ts` and the auth route handlers. The
-- browser client at `src/lib/supabase/browser.ts` has no callers (audited).
--
-- ORDER OF OPERATIONS — DO NOT APPLY THIS OUT OF ORDER:
--   1. SUPABASE_SERVICE_ROLE_KEY must be set in every environment that runs the
--      app (local .env.local and the hosting provider) BEFORE this runs.
--   2. Deploy the server client change that reads that variable.
--   3. Only then apply this migration.
--   4. Rotate the anon key afterwards — the old one has been in browsers.
-- Applying this while the app is still using the anon key WILL take it down.

-- ── 1. Enable RLS on the nine unprotected tables ────────────────────────────
alter table public.leads            enable row level security;
alter table public.contacts         enable row level security;
alter table public.reps             enable row level security;
alter table public.assignments      enable row level security;
alter table public.outreach         enable row level security;
alter table public.pipeline_updates enable row level security;
alter table public.call_briefs      enable row level security;
alter table public.lead_notes       enable row level security;
alter table public.lead_reviews     enable row level security;

-- ── 2. Close the open door on feedback ──────────────────────────────────────
-- `feedback` already had RLS enabled, but carried a PERMISSIVE policy granting
-- anon and authenticated ALL commands with USING (true) — which made the RLS
-- purely decorative. Dropping it restores deny-by-default.
drop policy if exists feedback_anon_all on public.feedback;

-- ── 3. Tables that already had RLS on with no policies ──────────────────────
-- assignment_pings, deal_profiles and deal_sales are already deny-by-default.
-- Asserted here so the intent is explicit and re-running is harmless.
alter table public.assignment_pings enable row level security;
alter table public.deal_profiles    enable row level security;
alter table public.deal_sales       enable row level security;

-- ── 4. Pin the trigger function's search_path ───────────────────────────────
-- A mutable search_path on a SECURITY-sensitive function lets a caller shadow
-- referenced objects. This function is trivial, but pinning it clears the
-- advisory and costs nothing.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
