-- Granular lead archiving (supersedes the older do_not_contact flag).
-- These columns are already live in the project DB; this migration records the
-- schema and is safe to re-run (IF NOT EXISTS).
--
-- archived         hides the lead from the default inbox; the dashboard "Archive"
--                  tab lists archived leads instead of the old do_not_contact set.
-- archived_at      when the lead was archived (drives the "2 days ago" timestamp).
-- archived_reason  why it was archived, e.g. "stale_>60d", "no_signal_date".

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- The default inbox now reads active leads via archived = false, ordered by
-- score then recency. A partial index keeps that hot path fast.
CREATE INDEX IF NOT EXISTS leads_active_archived_score_idx
  ON leads (score DESC, created_at DESC)
  WHERE archived = false;

-- The Archive tab orders by archived_at DESC NULLS LAST over archived rows.
CREATE INDEX IF NOT EXISTS leads_archived_at_idx
  ON leads (archived_at DESC)
  WHERE archived = true;
