-- Rename the "proposal" lead stage to "quote".
--
-- The team calls this stage a Quote (meeting 2026-07-11), and the UI has shown
-- "Quote" since 2026-08-12 while still storing "proposal". This migration moves
-- the stored value so the data matches the language.
--
-- Note for anyone reading the earlier plan: `leads.status` has NO check
-- constraint and is not an enum — it is a plain `text` column defaulting to
-- 'new'. Verified against the live project on 2026-08-13. There is therefore no
-- constraint to alter here, only stored values to move.
--
-- Every statement is idempotent, so re-running is safe.

update public.leads
set status = 'quote'
where status = 'proposal';

-- The stage-change audit trail stores the same vocabulary on both sides.
update public.pipeline_updates
set old_status = 'quote'
where old_status = 'proposal';

update public.pipeline_updates
set new_status = 'quote'
where new_status = 'proposal';

-- deal_profiles.proposal_reference / proposal_sent_date are deliberately left
-- alone. Those columns are retained but no longer written by the app: the deal
-- profile was reduced to a confirmed-order record on 2026-08-13.
