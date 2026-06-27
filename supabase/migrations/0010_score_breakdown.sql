-- Add a structured scoring breakdown for new leads. Old leads keep their
-- existing score + score_reason text; the breakdown section renders empty
-- when this column is NULL. Safe to apply on a live table — additive,
-- nullable, no default, no existing rows touched.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB;

COMMENT ON COLUMN leads.score_breakdown IS
  'Array of {key, label, passed, note} for the 8 scoring criteria. Populated by Hermes for new leads only. NULL for legacy leads.';
