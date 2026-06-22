-- Add a free-text comment to the temporary manual review scorecard.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME. Safe to re-run.
--
-- The sales team can now leave a note alongside the four 1-5 scores on a lead's
-- manual review. `lead_reviews` is an existing table (migration 0005) so RLS is
-- already off here — no policy change needed.

ALTER TABLE lead_reviews
  ADD COLUMN IF NOT EXISTS comment TEXT;
