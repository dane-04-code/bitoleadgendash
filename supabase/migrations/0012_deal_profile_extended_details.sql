-- Extra sales fields for the deal-profile editor. Run this after 0011.
ALTER TABLE deal_profiles
  ADD COLUMN IF NOT EXISTS opportunity_reference TEXT,
  ADD COLUMN IF NOT EXISTS project_stage TEXT,
  ADD COLUMN IF NOT EXISTS decision_maker TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact TEXT,
  ADD COLUMN IF NOT EXISTS budget_status TEXT,
  ADD COLUMN IF NOT EXISTS procurement_method TEXT,
  ADD COLUMN IF NOT EXISTS tender_reference TEXT,
  ADD COLUMN IF NOT EXISTS tender_deadline DATE,
  ADD COLUMN IF NOT EXISTS proposal_reference TEXT,
  ADD COLUMN IF NOT EXISTS proposal_sent_date DATE,
  ADD COLUMN IF NOT EXISTS target_installation_date DATE,
  ADD COLUMN IF NOT EXISTS competitors TEXT,
  ADD COLUMN IF NOT EXISTS incumbent_supplier TEXT,
  ADD COLUMN IF NOT EXISTS commercial_terms TEXT,
  ADD COLUMN IF NOT EXISTS risks_and_blockers TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;
