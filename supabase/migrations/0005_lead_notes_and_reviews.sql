-- Free-text notes per lead + a TEMPORARY manual review scorecard.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME. Safe to re-run.
--
-- lead_notes    an append-only log of notes the team writes against a lead.
--               Each note keeps who wrote it and when. Deleting a lead removes
--               its notes (ON DELETE CASCADE).
--
-- lead_reviews  a one-row-per-lead manual scorecard (1-5) the team fills in by
--               hand while we calibrate the automated score. This is meant to
--               be TEMPORARY — when we're done calibrating, drop this table and
--               the matching code (lead-review component + queries/actions).
--
--   contact_accuracy  how correct the captured contacts are        (1-5)
--   relevancy         how relevant the lead actually is            (1-5)
--   score_accuracy    how well the automated score matches reality (1-5)
--   gut_feel          overall gut feel on the lead                 (1-5)

-- ── lead_notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author     TEXT,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes are read newest-first per lead.
CREATE INDEX IF NOT EXISTS lead_notes_lead_id_created_idx
  ON lead_notes (lead_id, created_at DESC);

-- ── lead_reviews (TEMPORARY) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_reviews (
  lead_id          UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  contact_accuracy SMALLINT CHECK (contact_accuracy BETWEEN 1 AND 5),
  relevancy        SMALLINT CHECK (relevancy        BETWEEN 1 AND 5),
  score_accuracy   SMALLINT CHECK (score_accuracy   BETWEEN 1 AND 5),
  gut_feel         SMALLINT CHECK (gut_feel          BETWEEN 1 AND 5),
  reviewed_by      TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The dashboard reads/writes Supabase with the anon key.
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_notes   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_reviews TO anon, authenticated;
