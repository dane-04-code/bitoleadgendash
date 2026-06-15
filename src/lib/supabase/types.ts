export type LeadStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "meeting"
  | "proposal"
  | "won"
  | "dead";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "assigned",
  "contacted",
  "meeting",
  "proposal",
  "won",
  "dead",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  meeting: "Meeting",
  proposal: "Proposal",
  won: "Won",
  dead: "Dead",
};

export type SignalType =
  | "expansion"
  | "funding"
  | "hiring"
  | "new_facility"
  | "rfp"
  | "press"
  | "linkedin_post"
  | "other";

export type Lead = {
  id: string;
  company_name: string;
  signal_type: SignalType | string | null;
  signal_source: string | null;
  signal_summary: string | null;
  location: string | null;
  industry: string | null;
  warehouse_size: string | null;
  score: number;
  score_reason: string | null;
  bito_products: string[] | null;
  source_url: string | null;
  status: LeadStatus;
  /** Set when a rep records an outreach; null until first contact. */
  last_contacted_at: string | null;
  /** Legacy reject flag. Superseded by `archived`; kept for backwards compatibility. */
  do_not_contact: boolean;
  /** When true the lead is archived and hidden from the default inbox. */
  archived: boolean;
  /** When the lead was archived; null if never archived. */
  archived_at: string | null;
  /** Why the lead was archived, e.g. "stale_>60d", "no_signal_date". */
  archived_reason: string | null;
  /** When the source article was last re-verified for freshness; null if never. */
  last_article_check: string | null;
  created_at: string;
  updated_at: string;
};

/** Maps raw `archived_reason` codes to human-readable labels for the sales team. */
export const ARCHIVED_REASON_LABELS: Record<string, string> = {
  "stale_>60d": "Stale · article older than 60 days",
  no_signal_date: "No signal date",
};

/** Human-readable version of an `archived_reason` code; falls back to a tidied code. */
export function archivedReasonLabel(reason: string | null): string {
  if (!reason) return "Archived";
  return ARCHIVED_REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}

export type RoleFit = "strong" | "borderline" | "junior" | "senior";

export type Contact = {
  id: string;
  lead_id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  /** True when the email came verified from Apollo, false when pattern-guessed. */
  email_verified: boolean;
  /** Hermes role-fit audit result; null until audited. */
  role_fit: RoleFit | null;
  created_at: string;
};

export type Rep = {
  id: string;
  full_name: string;
  email: string;
  telegram_username: string | null;
  telegram_chat_id: string | null;
  speciality: string | null;
  territory: string | null;
  is_active: boolean;
  created_at: string;
  /** PBKDF2 hash, null if no password set yet. Never returned to client unhashed. */
  password?: string | null;
};

export type Assignment = {
  id: string;
  lead_id: string;
  rep_id: string;
  assigned_by: string | null;
  assigned_at: string;
  notes: string | null;
};

export type OutreachChannel = "linkedin" | "email" | "whatsapp" | "phone";

export type Outreach = {
  id: string;
  lead_id: string;
  channel: OutreachChannel | string;
  subject: string | null;
  body: string;
  generated_by: string | null;
  used: boolean;
  created_at: string;
};

export type PipelineUpdate = {
  id: string;
  lead_id: string;
  rep_id: string | null;
  old_status: LeadStatus | null;
  new_status: LeadStatus;
  note: string | null;
  updated_at: string;
};

export type CallBrief = {
  id: string;
  lead_id: string;
  brief_content: string;
  generated_at: string;
};

export type LeadWithRelations = Lead & {
  contacts?: Contact[];
  assignments?: (Assignment & { rep?: Rep | null })[];
  outreach?: Outreach[];
  call_briefs?: CallBrief[];
  pipeline_updates?: PipelineUpdate[];
};

/**
 * One row of the `leads_with_contacts` view: a lead flattened together with its
 * single best contact (primary, else strongest role_fit, else oldest) and its
 * latest outreach draft. Contact/outreach fields are null when none exist.
 */
export type LeadWithContacts = Lead & {
  contact_id: string | null;
  contact_name: string | null;
  contact_job_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin_url: string | null;
  contact_is_primary: boolean | null;
  contact_email_verified: boolean | null;
  contact_role_fit: RoleFit | null;
  outreach_id: string | null;
  outreach_channel: OutreachChannel | string | null;
  outreach_subject: string | null;
  outreach_body: string | null;
  outreach_used: boolean | null;
  outreach_created_at: string | null;
};
