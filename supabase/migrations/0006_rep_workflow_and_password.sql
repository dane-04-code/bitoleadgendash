-- Rep workflow + password-reset support.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME. Safe to re-run.
--
-- 1. reps.availability         a rep self-sets whether they want new leads
--                              routed to them ("looking" / "not_looking").
--                              Informational only — it does not block the admin
--                              from assigning. Defaults to "looking".
--
-- 2. reps.must_change_password set true whenever an admin sets/resets a rep's
--                              password. The rep is forced to choose their own
--                              password on next login; cleared once they do.
--
-- 3. leads.status now also takes the value 'returned' — written when a rep
--    sends a lead back to the admin via "Return lead". `status` is a free-text
--    column, so no enum/constraint change is needed here; this note documents
--    the new value.

ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'looking';

ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
