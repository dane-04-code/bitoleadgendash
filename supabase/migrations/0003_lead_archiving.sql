-- Lead archiving + article-freshness tracking.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME.
--
-- do_not_contact lets the manager (or the Hermes pipeline) archive leads that
-- should not be worked — e.g. when the source article is stale. The dashboard
-- hides archived leads by default and offers a "Show archived" toggle so the
-- sales team can still see what was rejected and why.
--
-- last_article_check records when the lead's source article was last
-- re-verified, so the team can judge how fresh each signal is.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_article_check TIMESTAMPTZ;

-- The default inbox only ever reads active leads, ordered by score then recency.
-- A partial index keeps that hot path fast as the archive grows.
CREATE INDEX IF NOT EXISTS leads_active_score_idx
  ON leads (score DESC, created_at DESC)
  WHERE do_not_contact = false;
