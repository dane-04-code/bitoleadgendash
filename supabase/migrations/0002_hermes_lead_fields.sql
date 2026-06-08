-- Hermes lead-intake fields + review join view.
-- Run in the Supabase SQL editor (or via the CLI) ONE TIME.
--
-- Adds the columns the Hermes research bot needs to hand a lead over with
-- full fidelity (verified vs. guessed emails, role-fit judgement, and a
-- "last contacted" stamp the reps write back), plus a single read the
-- dashboard uses to show lead + best contact + latest outreach draft together.

-- ── contacts: Apollo email confidence ───────────────────────────────────────
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- ── contacts: role-fit audit result ─────────────────────────────────────────
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS role_fit TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_role_fit_check'
  ) THEN
    ALTER TABLE contacts
      ADD CONSTRAINT contacts_role_fit_check
      CHECK (role_fit IS NULL OR role_fit IN ('strong', 'borderline', 'junior', 'senior'));
  END IF;
END $$;

-- ── leads: when did a rep last reach out ────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- ── leads_with_contacts: one row per lead for the review screen ──────────────
-- Each lead is joined to its single best contact and its latest outreach draft.
-- "Best contact" = the primary contact if one is flagged, otherwise the
-- strongest role_fit, otherwise the oldest contact. security_invoker = true
-- (Postgres 15+) makes the view respect the caller's RLS on the base tables
-- rather than running with the view owner's privileges.
DROP VIEW IF EXISTS leads_with_contacts;

CREATE VIEW leads_with_contacts
  WITH (security_invoker = true)
AS
SELECT
  l.*,
  c.id             AS contact_id,
  c.full_name      AS contact_name,
  c.job_title      AS contact_job_title,
  c.email          AS contact_email,
  c.phone          AS contact_phone,
  c.linkedin_url   AS contact_linkedin_url,
  c.is_primary     AS contact_is_primary,
  c.email_verified AS contact_email_verified,
  c.role_fit       AS contact_role_fit,
  o.id             AS outreach_id,
  o.channel        AS outreach_channel,
  o.subject        AS outreach_subject,
  o.body           AS outreach_body,
  o.used           AS outreach_used,
  o.created_at     AS outreach_created_at
FROM leads l
LEFT JOIN LATERAL (
  SELECT *
  FROM contacts
  WHERE contacts.lead_id = l.id
  ORDER BY
    is_primary DESC,
    CASE role_fit
      WHEN 'strong'     THEN 0
      WHEN 'borderline' THEN 1
      WHEN 'senior'     THEN 2
      WHEN 'junior'     THEN 3
      ELSE 4
    END,
    created_at ASC
  LIMIT 1
) c ON true
LEFT JOIN LATERAL (
  SELECT *
  FROM outreach
  WHERE outreach.lead_id = l.id
  ORDER BY created_at DESC
  LIMIT 1
) o ON true;

-- The dashboard reads Supabase with the anon key, matching the base tables.
GRANT SELECT ON leads_with_contacts TO anon, authenticated;
