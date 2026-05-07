-- Adds per-rep login support.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME.
--
-- After running, admins can set a rep's password from the /reps page
-- and the rep can sign in at /login using their email + password.

ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Make sure email lookups are fast (used on every rep login attempt).
CREATE UNIQUE INDEX IF NOT EXISTS reps_email_lower_unique
  ON reps (lower(email));
