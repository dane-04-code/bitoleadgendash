-- Feedback / suggestions box.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME. Safe to re-run.
--
-- feedback  an append-only log of suggestions and bug reports submitted by reps
--           and the admin. Each row keeps who submitted it (display name + role),
--           a category (bug / idea / other), the message, and a triage status
--           (new / reviewed / done) the admin moves it through.

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author      TEXT,
  author_role TEXT,
  category    TEXT NOT NULL DEFAULT 'idea',
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The admin list reads newest-first.
CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback (created_at DESC);

-- The dashboard reads/writes Supabase with the anon key.
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback TO anon, authenticated;

-- This app controls access in its own session/middleware layer and talks to
-- Supabase with the anon key, like every other table here. Newer Supabase
-- projects auto-enable RLS on new tables, which would block the anon key with
-- "new row violates row-level security policy" — so disable it to match the
-- rest of the schema.
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
