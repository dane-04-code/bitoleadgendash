-- Beta Lead Gen V2: sales-owned deal management data.
--
-- This migration deliberately leaves the `leads` table and the lead-sourcing
-- pipeline untouched. The sourcing agent continues to create/enrich leads;
-- sales users own the records below once a lead is being worked.
-- Safe to run once in the Supabase SQL editor or through the Supabase CLI.

-- One optional commercial profile per lead. All fields are optional so a rep
-- can save useful information without completing a long form.
CREATE TABLE IF NOT EXISTS deal_profiles (
  lead_id UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  deal_name TEXT,
  project_type TEXT,
  country TEXT,
  city TEXT,
  site_address TEXT,
  facility_type TEXT,
  project_summary TEXT,
  requirements TEXT,
  products_of_interest TEXT[] NOT NULL DEFAULT '{}',
  estimated_value NUMERIC(14, 2) CHECK (estimated_value IS NULL OR estimated_value >= 0),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  win_probability SMALLINT CHECK (win_probability IS NULL OR win_probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  next_action TEXT,
  next_action_due_date DATE,
  death_reason TEXT,
  death_notes TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_profiles_next_action_due_idx
  ON deal_profiles (next_action_due_date)
  WHERE next_action_due_date IS NOT NULL;

-- Enrich the existing append-only notes feed. Existing notes remain valid and
-- appear as general updates; new notes can be labelled as meetings, calls,
-- emails, stage updates, or general comments.
ALTER TABLE lead_notes
  ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'note',
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_notes_activity_type_check'
  ) THEN
    ALTER TABLE lead_notes
      ADD CONSTRAINT lead_notes_activity_type_check
      CHECK (activity_type IN ('note', 'meeting', 'call', 'email', 'stage_update'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lead_notes_lead_id_occurred_idx
  ON lead_notes (lead_id, occurred_at DESC);

-- A sale exists only when a deal is won. One sale per lead for Beta V2; this
-- can be expanded to multiple orders later without changing deal profiles.
CREATE TABLE IF NOT EXISTS deal_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  sale_value NUMERIC(14, 2) NOT NULL CHECK (sale_value >= 0),
  currency TEXT NOT NULL DEFAULT 'AED' CHECK (currency ~ '^[A-Z]{3}$'),
  gross_profit NUMERIC(14, 2) CHECK (gross_profit IS NULL OR gross_profit >= 0),
  profit_margin_percent NUMERIC(5, 2) CHECK (
    profit_margin_percent IS NULL OR profit_margin_percent BETWEEN 0 AND 100
  ),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_sales_sale_date_idx ON deal_sales (sale_date DESC);

-- Grants match the project’s current Supabase access model. Application-level
-- role checks must ensure reps edit only leads assigned to them.
GRANT SELECT, INSERT, UPDATE, DELETE ON deal_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deal_sales TO anon, authenticated;

-- Ready-made data source for the forthcoming Sales tab. It is intentionally a
-- view, not a second copy of data, so every saved sale appears immediately.
CREATE OR REPLACE VIEW sales_register
  WITH (security_invoker = true)
AS
SELECT
  s.id AS sale_id,
  s.lead_id,
  l.company_name,
  l.status,
  dp.deal_name,
  dp.country,
  dp.city,
  s.sale_date,
  s.sale_value,
  s.currency,
  s.gross_profit,
  s.profit_margin_percent,
  s.notes,
  s.recorded_by,
  s.created_at,
  s.updated_at
FROM deal_sales s
JOIN leads l ON l.id = s.lead_id
LEFT JOIN deal_profiles dp ON dp.lead_id = s.lead_id;

GRANT SELECT ON sales_register TO anon, authenticated;
