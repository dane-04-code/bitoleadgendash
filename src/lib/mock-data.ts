import type {
  Lead,
  Rep,
  Contact,
  Outreach,
  CallBrief,
  Assignment,
  PipelineUpdate,
  LeadNote,
  LeadReview,
  Feedback,
  FeedbackStatus,
  LeadStatus,
} from "./supabase/types";
import type { LeadInboxRow, DashboardStats } from "./queries";

export function isMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    !url ||
    !key ||
    url.includes("placeholder") ||
    key.includes("placeholder")
  );
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export const MOCK_REPS: Rep[] = [
  {
    id: "rep-1",
    full_name: "Layla Haddad",
    email: "layla@bito.ae",
    telegram_username: "laylah",
    telegram_chat_id: null,
    speciality: "Pallet racking · UAE",
    territory: "UAE",
    is_active: true,
    availability: "looking",
    created_at: daysAgo(60),
  },
  {
    id: "rep-2",
    full_name: "Omar Khalifa",
    email: "omar@bito.ae",
    telegram_username: "omark",
    telegram_chat_id: null,
    speciality: "Automation · KSA",
    territory: "KSA",
    is_active: true,
    availability: "not_looking",
    created_at: daysAgo(90),
  },
  {
    id: "rep-3",
    full_name: "Priya Suresh",
    email: "priya@bito.ae",
    telegram_username: "priyas",
    telegram_chat_id: null,
    speciality: "Cold chain · QAT",
    territory: "Qatar",
    is_active: true,
    availability: "looking",
    created_at: daysAgo(30),
  },
];

// ─── Leads ──────────────────────────────────────────────────────────────────

export const MOCK_LEADS: LeadInboxRow[] = [
  {
    id: "lead-1",
    company_name: "Aramex Logistics",
    signal_type: "new_facility",
    signal_source: "Gulf News",
    signal_summary:
      "Aramex announced a 45,000 sqm sortation hub in Dubai South, operational Q3. Tender for racking and conveyor systems opens in three weeks.",
    location: "Dubai, UAE",
    industry: "Logistics & Distribution",
    warehouse_size: "45,000 sqm",
    score: 94,
    score_reason:
      "Confirmed build, public tender timeline, BITO product fit on pallet racking, mezzanine and conveyor lines.",
    score_breakdown: null,
    bito_products: ["PRO pallet racking", "Conveyor systems", "Mezzanine"],
    source_url: "https://gulfnews.com/business/aramex-dubai-south",
    status: "new",
    last_contacted_at: null,
    do_not_contact: false,
    archived: false,
    archived_at: null,
    archived_reason: null,
    last_article_check: hoursAgo(2),
    created_at: hoursAgo(2),
    updated_at: hoursAgo(2),
    rep_name: null,
  },
  {
    id: "lead-2",
    company_name: "Almarai",
    signal_type: "expansion",
    signal_source: "Arab News",
    signal_summary:
      "Almarai is expanding cold storage capacity by 30% across Riyadh and Jeddah. RFP issued for refrigerated racking and shuttle systems with submissions due in 14 days.",
    location: "Riyadh, KSA",
    industry: "Food & Beverage · Cold Chain",
    warehouse_size: "60,000 sqm",
    score: 88,
    score_reason:
      "Active RFP with 14-day window, cold chain spec matches BITO shuttle and drive-in racking.",
    score_breakdown: null,
    bito_products: ["Drive-in racking", "Shuttle system", "Cold-spec coatings"],
    source_url: "https://arabnews.com/almarai-coldchain",
    status: "assigned",
    last_contacted_at: null,
    do_not_contact: false,
    archived: false,
    archived_at: null,
    archived_reason: null,
    last_article_check: hoursAgo(7),
    created_at: hoursAgo(8),
    updated_at: hoursAgo(4),
    rep_name: "Omar Khalifa",
  },
  {
    id: "lead-3",
    company_name: "Lulu Group International",
    signal_type: "rfp",
    signal_source: "LinkedIn",
    signal_summary:
      "Lulu posted a tender for a regional distribution centre upgrade — 25,000 sqm, multi-temperature, mezzanine pick modules included.",
    location: "Abu Dhabi, UAE",
    industry: "Retail · Hypermarket",
    warehouse_size: "25,000 sqm",
    score: 81,
    score_reason:
      "Tender language explicitly mentions mezzanine and pick-to-light — strong BITO fit.",
    score_breakdown: null,
    bito_products: ["Mezzanine", "Pick modules", "Carton flow"],
    source_url: "https://linkedin.com/feed/lulu-rfp",
    status: "contacted",
    last_contacted_at: hoursAgo(6),
    do_not_contact: false,
    archived: false,
    archived_at: null,
    archived_reason: null,
    last_article_check: hoursAgo(18),
    created_at: hoursAgo(20),
    updated_at: hoursAgo(6),
    rep_name: "Layla Haddad",
  },
  {
    id: "lead-4",
    company_name: "Qatar Logistics Hub",
    signal_type: "funding",
    signal_source: "Reuters",
    signal_summary:
      "Qatar Logistics Hub raised $80M Series C earmarked for two new facilities near Hamad Port. Capex on warehouse fit-out begins next quarter.",
    location: "Doha, Qatar",
    industry: "3PL · Port Logistics",
    warehouse_size: "Two sites · ~30,000 sqm",
    score: 72,
    score_reason:
      "Funded with explicit warehouse capex earmark. Spec not yet public — engagement now positions BITO ahead of formal RFP.",
    score_breakdown: null,
    bito_products: ["Selective racking", "VNA systems"],
    source_url: "https://reuters.com/qatar-logistics-hub-c",
    status: "meeting",
    last_contacted_at: hoursAgo(10),
    do_not_contact: false,
    archived: false,
    archived_at: null,
    archived_reason: null,
    last_article_check: hoursAgo(34),
    created_at: hoursAgo(36),
    updated_at: hoursAgo(10),
    rep_name: "Priya Suresh",
  },
  {
    id: "lead-5",
    company_name: "Noon Fulfilment",
    signal_type: "hiring",
    signal_source: "Company careers page",
    signal_summary:
      "Noon listed 12 warehouse-engineering roles in Riyadh — operations director plus mechanical and conveyor specialists. Build phase signal.",
    location: "Riyadh, KSA",
    industry: "E-commerce · Marketplace",
    warehouse_size: "Unknown",
    score: 64,
    score_reason:
      "Hiring pattern consistent with new build but no public announcement yet.",
    score_breakdown: null,
    bito_products: ["Conveyor", "Sortation"],
    source_url: "https://noon.com/careers",
    status: "listed",
    last_contacted_at: null,
    do_not_contact: false,
    archived: false,
    archived_at: null,
    archived_reason: null,
    last_article_check: daysAgo(2),
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    rep_name: null,
  },

  // ── Archived (archived = true) ──────────────────────────────────────────────
  // Filtered out of the inbox as noise — stale articles / missing signal dates.
  {
    id: "lead-6",
    company_name: "Gulf Warehousing Company",
    signal_type: "expansion",
    signal_source: "Trade Arabia",
    signal_summary:
      "GWC flagged a possible Logistics Village expansion, but the source article is now over two months old with no tender or build confirmation since.",
    location: "Doha, Qatar",
    industry: "3PL · Logistics",
    warehouse_size: "Unknown",
    score: 58,
    score_reason:
      "Signal never firmed up; source article predates the 60-day freshness window.",
    score_breakdown: null,
    bito_products: ["Selective racking"],
    source_url: "https://tradearabia.com/gwc-logistics-village",
    status: "new",
    last_contacted_at: null,
    do_not_contact: true,
    archived: true,
    archived_at: daysAgo(7),
    archived_reason: "stale_>60d",
    last_article_check: hoursAgo(6),
    created_at: daysAgo(74),
    updated_at: hoursAgo(6),
    rep_name: null,
  },
  {
    id: "lead-7",
    company_name: "Agility Logistics",
    signal_type: "press",
    signal_source: "Zawya",
    signal_summary:
      "Older press mention of a Kuwait DC refurbishment. Freshness re-check found the article well past 60 days with no follow-up activity.",
    location: "Kuwait City, Kuwait",
    industry: "Logistics & Distribution",
    warehouse_size: "~18,000 sqm",
    score: 49,
    score_reason: "Stale press signal; archived on freshness re-check.",
    score_breakdown: null,
    bito_products: ["Mezzanine"],
    source_url: "https://zawya.com/agility-kuwait-dc",
    status: "new",
    last_contacted_at: null,
    do_not_contact: true,
    archived: true,
    archived_at: daysAgo(3),
    archived_reason: "no_signal_date",
    last_article_check: hoursAgo(6),
    created_at: daysAgo(88),
    updated_at: hoursAgo(6),
    rep_name: null,
  },
];

// ─── Contacts ──────────────────────────────────────────────────────────────

export const MOCK_CONTACTS: Contact[] = [
  // Aramex
  {
    id: "contact-1-1",
    lead_id: "lead-1",
    full_name: "Faisal Al-Marri",
    job_title: "VP, Network Engineering",
    email: "faisal.almarri@aramex.com",
    phone: "+971 4 286 5000",
    linkedin_url: "https://www.linkedin.com/in/faisal-almarri",
    is_primary: true,
    email_verified: true,
    role_fit: "strong",
    created_at: hoursAgo(2),
  },
  {
    id: "contact-1-2",
    lead_id: "lead-1",
    full_name: "Reem Hassan",
    job_title: "Director of Procurement",
    email: "reem.hassan@aramex.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/reem-hassan-procurement",
    is_primary: false,
    email_verified: true,
    role_fit: "borderline",
    created_at: hoursAgo(2),
  },
  {
    id: "contact-1-3",
    lead_id: "lead-1",
    full_name: "Karim Idrissi",
    job_title: "Senior Manager, Warehouse Automation",
    email: "karim.idrissi@aramex.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/karim-idrissi",
    is_primary: false,
    email_verified: false,
    role_fit: "strong",
    created_at: hoursAgo(2),
  },

  // Almarai
  {
    id: "contact-2-1",
    lead_id: "lead-2",
    full_name: "Abdullah Al-Otaibi",
    job_title: "Head of Supply Chain",
    email: "a.alotaibi@almarai.com",
    phone: "+966 11 470 0234",
    linkedin_url: "https://www.linkedin.com/in/abdullah-alotaibi-sc",
    is_primary: true,
    email_verified: true,
    role_fit: "strong",
    created_at: hoursAgo(8),
  },
  {
    id: "contact-2-2",
    lead_id: "lead-2",
    full_name: "Tarek Bensalem",
    job_title: "Procurement Manager · Cold Chain",
    email: "t.bensalem@almarai.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/tarek-bensalem",
    is_primary: false,
    email_verified: false,
    role_fit: "borderline",
    created_at: hoursAgo(8),
  },

  // Lulu
  {
    id: "contact-3-1",
    lead_id: "lead-3",
    full_name: "Saeed Variyath",
    job_title: "Director, Distribution & Logistics",
    email: "saeed.variyath@luluhypermarket.com",
    phone: "+971 2 4181 818",
    linkedin_url: "https://www.linkedin.com/in/saeed-variyath",
    is_primary: true,
    email_verified: true,
    role_fit: "strong",
    created_at: hoursAgo(20),
  },
  {
    id: "contact-3-2",
    lead_id: "lead-3",
    full_name: "Anjali Krishnan",
    job_title: "Senior Buyer · Capex",
    email: "anjali.k@luluhypermarket.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/anjali-krishnan-procurement",
    is_primary: false,
    email_verified: false,
    role_fit: "borderline",
    created_at: hoursAgo(20),
  },

  // Qatar Logistics Hub
  {
    id: "contact-4-1",
    lead_id: "lead-4",
    full_name: "Yousef Al-Naimi",
    job_title: "Chief Operating Officer",
    email: "y.alnaimi@qatarlogisticshub.qa",
    phone: "+974 4499 8800",
    linkedin_url: "https://www.linkedin.com/in/yousef-alnaimi-qlh",
    is_primary: true,
    email_verified: true,
    role_fit: "senior",
    created_at: hoursAgo(36),
  },
  {
    id: "contact-4-2",
    lead_id: "lead-4",
    full_name: "Marta Vasilescu",
    job_title: "VP, Engineering",
    email: "m.vasilescu@qatarlogisticshub.qa",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/marta-vasilescu-eng",
    is_primary: false,
    email_verified: true,
    role_fit: "strong",
    created_at: hoursAgo(36),
  },

  // Noon
  {
    id: "contact-5-1",
    lead_id: "lead-5",
    full_name: "Hala Mansour",
    job_title: "Director, Warehouse Operations · KSA",
    email: "hala.mansour@noon.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/hala-mansour-noon",
    is_primary: true,
    email_verified: false,
    role_fit: "strong",
    created_at: daysAgo(2),
  },
  {
    id: "contact-5-2",
    lead_id: "lead-5",
    full_name: "Bilal Qureshi",
    job_title: "Engineering Lead, Conveyor & Sortation",
    email: "bilal.qureshi@noon.com",
    phone: null,
    linkedin_url: "https://www.linkedin.com/in/bilal-qureshi",
    is_primary: false,
    email_verified: false,
    role_fit: "borderline",
    created_at: daysAgo(2),
  },
];

// ─── Outreach ──────────────────────────────────────────────────────────────

export const MOCK_OUTREACH: Outreach[] = [
  {
    id: "out-1-li",
    lead_id: "lead-1",
    channel: "linkedin",
    subject: null,
    body: `Hi Faisal — congrats on the Dubai South sortation hub. We've helped a similar 40k-sqm Aramex sister-network site cut pick travel by 31% with PRO racking and a roller-deck mezzanine. Open to a 15-min walkthrough before the tender opens?`,
    generated_by: "ai",
    used: false,
    created_at: hoursAgo(2),
  },
  {
    id: "out-1-em",
    lead_id: "lead-1",
    channel: "email",
    subject: "Dubai South tender — fit-out reference packs",
    body: `Faisal,

Saw the Gulf News piece on the new sortation hub. We've put together a fit-out reference pack from three GCC sites of similar profile (~45k sqm, multi-shuttle). Happy to send across before the tender opens — would Tuesday work for a 20-minute call?

— Layla, BITO UAE`,
    generated_by: "ai",
    used: false,
    created_at: hoursAgo(2),
  },
  {
    id: "out-2-em",
    lead_id: "lead-2",
    channel: "email",
    subject: "RE: Cold-chain RFP — drive-in vs shuttle reference data",
    body: `Abdullah,

Following the RFP — sharing throughput data from two GCC dairy operators that ran the drive-in vs shuttle decision. Net: shuttle paid back in 2.4 yrs at >25k pallet positions. Worth a 30 min walk-through?

— Omar, BITO KSA`,
    generated_by: "ai",
    used: true,
    created_at: hoursAgo(4),
  },
];

// ─── Call briefs ──────────────────────────────────────────────────────────

export const MOCK_BRIEFS: CallBrief[] = [
  {
    id: "brief-1",
    lead_id: "lead-1",
    brief_content: `Aramex — Dubai South Sortation Hub
Score: 94 · Status: New · Owner: unassigned

CONTEXT
• 45,000 sqm hub announced 2 days ago.
• Tender opens in ~3 weeks; multi-shuttle and conveyor explicitly named.

WHO TO TALK TO
• Faisal Al-Marri (VP Network Eng.) — primary, decision lead.
• Reem Hassan (Procurement Director) — gates the tender.
• Karim Idrissi (Senior Manager, Automation) — technical evaluator.

OPENING
"Congrats on Dubai South — we've helped sister-network sites cut pick-travel ~30% with PRO racking + roller-deck mezz."

DON'T LEAD WITH
Pricing. They're in spec mode, not procurement mode.

NEXT STEP
Pre-tender 20-min call with Faisal + Karim. Ask: throughput target, integration constraints, automation depth.`,
    generated_at: hoursAgo(2),
  },
  {
    id: "brief-3",
    lead_id: "lead-3",
    brief_content: `Lulu Group — Abu Dhabi Distribution Centre Upgrade
Score: 81 · Status: Contacted · Owner: Layla Haddad

CONTEXT
• 25,000 sqm RFP, multi-temperature, mezz pick modules.
• Saeed Variyath confirmed receipt of LinkedIn DM.

NEXT STEP
Schedule technical workshop with Saeed + Anjali to walk pick-module options.`,
    generated_at: hoursAgo(6),
  },
];

// ─── Assignments ──────────────────────────────────────────────────────────

export const MOCK_ASSIGNMENTS: (Assignment & { rep: Rep | null })[] = [
  {
    id: "assn-2",
    lead_id: "lead-2",
    rep_id: "rep-2",
    assigned_by: "admin",
    assigned_at: hoursAgo(4),
    notes: "Cold-chain spec — Omar to lead given KSA + automation background.",
    rep: MOCK_REPS[1],
  },
  {
    id: "assn-3",
    lead_id: "lead-3",
    rep_id: "rep-1",
    assigned_by: "admin",
    assigned_at: hoursAgo(8),
    notes: "UAE retail — Layla owns Lulu account historically.",
    rep: MOCK_REPS[0],
  },
  {
    id: "assn-4",
    lead_id: "lead-4",
    rep_id: "rep-3",
    assigned_by: "admin",
    assigned_at: hoursAgo(10),
    notes: "Qatar account — Priya, leverage Hamad Port relationships.",
    rep: MOCK_REPS[2],
  },
];

// ─── Pipeline updates ─────────────────────────────────────────────────────

export const MOCK_PIPELINE_UPDATES: PipelineUpdate[] = [
  {
    id: "pu-2-1",
    lead_id: "lead-2",
    rep_id: "rep-2",
    old_status: "new",
    new_status: "assigned",
    note: "Assigned to Omar.",
    updated_at: hoursAgo(4),
  },
  {
    id: "pu-3-1",
    lead_id: "lead-3",
    rep_id: "rep-1",
    old_status: "new",
    new_status: "assigned",
    note: "Assigned to Layla.",
    updated_at: hoursAgo(8),
  },
  {
    id: "pu-3-2",
    lead_id: "lead-3",
    rep_id: "rep-1",
    old_status: "assigned",
    new_status: "contacted",
    note: "LinkedIn DM sent.",
    updated_at: hoursAgo(6),
  },
  {
    id: "pu-4-1",
    lead_id: "lead-4",
    rep_id: "rep-3",
    old_status: "new",
    new_status: "assigned",
    note: "Assigned to Priya.",
    updated_at: hoursAgo(36),
  },
  {
    id: "pu-4-2",
    lead_id: "lead-4",
    rep_id: "rep-3",
    old_status: "assigned",
    new_status: "contacted",
    note: "Intro email + phone call.",
    updated_at: hoursAgo(20),
  },
  {
    id: "pu-4-3",
    lead_id: "lead-4",
    rep_id: "rep-3",
    old_status: "contacted",
    new_status: "meeting",
    note: "30-min discovery booked for Thursday.",
    updated_at: hoursAgo(10),
  },
];

// ─── Lead notes + manual review (mock, mutable) ─────────────────────────────
// These arrays are mutated in-place by the mock action helpers so notes/reviews
// persist for the life of the dev server process — enough to demo the feature
// locally without a database. Real data lives in Supabase on Vercel.

export const MOCK_LEAD_NOTES: LeadNote[] = [
  {
    id: "note-1-1",
    lead_id: "lead-1",
    author: "Admin",
    body: "Tender opens in ~3 weeks — Faisal is the decision lead. Worth a pre-tender call before procurement gates it.",
    created_at: hoursAgo(1),
  },
  {
    id: "note-2-1",
    lead_id: "lead-2",
    author: "Omar Khalifa",
    body: "Left voicemail with supply-chain desk. Cold-chain spec confirmed against the RFP.",
    created_at: hoursAgo(3),
  },
];

export const MOCK_LEAD_REVIEWS: LeadReview[] = [
  {
    lead_id: "lead-1",
    contact_accuracy: 5,
    relevancy: 5,
    score_accuracy: 4,
    gut_feel: 5,
    comment: "Strong fit — pre-tender timing is ideal. Flagged Faisal as lead.",
    reviewed_by: "Admin",
    updated_at: hoursAgo(1),
  },
];

export function mockLeadNotes(leadId: string): LeadNote[] {
  return MOCK_LEAD_NOTES.filter((n) => n.lead_id === leadId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function mockAddLeadNote(
  leadId: string,
  body: string,
  author: string | null
): LeadNote {
  const note: LeadNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    lead_id: leadId,
    author,
    body,
    created_at: new Date().toISOString(),
  };
  MOCK_LEAD_NOTES.push(note);
  return note;
}

export function mockDeleteLeadNote(noteId: string): void {
  const idx = MOCK_LEAD_NOTES.findIndex((n) => n.id === noteId);
  if (idx >= 0) MOCK_LEAD_NOTES.splice(idx, 1);
}

export function mockLeadReview(leadId: string): LeadReview | null {
  return MOCK_LEAD_REVIEWS.find((r) => r.lead_id === leadId) ?? null;
}

export function mockSaveLeadReview(
  review: Omit<LeadReview, "updated_at">
): LeadReview {
  const existing = MOCK_LEAD_REVIEWS.find((r) => r.lead_id === review.lead_id);
  const saved: LeadReview = { ...review, updated_at: new Date().toISOString() };
  if (existing) Object.assign(existing, saved);
  else MOCK_LEAD_REVIEWS.push(saved);
  return saved;
}

// ─── Feedback (mock, mutable) ───────────────────────────────────────────────

export const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "fb-1",
    author: "Layla Haddad",
    author_role: "rep",
    category: "idea",
    body: "Would love a way to bulk-export my assigned leads to CSV for offline calls.",
    status: "new",
    created_at: hoursAgo(5),
  },
  {
    id: "fb-2",
    author: "Omar Khalifa",
    author_role: "rep",
    category: "bug",
    body: "The score badge colour looks off in dark mode on the pipeline cards.",
    status: "reviewed",
    created_at: daysAgo(2),
  },
];

export function mockAllFeedback(): Feedback[] {
  return [...MOCK_FEEDBACK].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function mockAddFeedback(
  entry: Omit<Feedback, "id" | "created_at">
): Feedback {
  const fb: Feedback = {
    ...entry,
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };
  MOCK_FEEDBACK.push(fb);
  return fb;
}

export function mockUpdateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): void {
  const fb = MOCK_FEEDBACK.find((f) => f.id === id);
  if (fb) fb.status = status;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export function mockDashboardStats(): DashboardStats {
  const MOCK_LEADS = mockLeads();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();

  let totalToday = 0;
  let hot = 0;
  let assigned = 0;
  let awaiting = 0;
  for (const l of MOCK_LEADS) {
    if (l.archived) continue; // archived leads don't count toward active stats
    if (new Date(l.created_at).getTime() >= startMs) totalToday += 1;
    if (l.score >= 80) hot += 1;
    if (
      l.status !== "new" &&
      l.status !== "listed" &&
      l.status !== "dead" &&
      l.status !== "returned"
    )
      assigned += 1;
    if (l.status === "new") awaiting += 1;
  }
  return { totalToday, hot, assigned, awaiting };
}

export function mockLeadById(id: string): {
  lead: Lead | null;
  contacts: Contact[];
  outreach: Outreach[];
  call_briefs: CallBrief[];
  assignments: (Assignment & { rep: Rep | null })[];
  pipeline_updates: PipelineUpdate[];
} | null {
  const lead = mockLeads().find((l) => l.id === id);
  if (!lead) return null;
  // Strip the inbox-only field before returning as Lead.
  const { rep_name, ...leadFields } = lead;
  return {
    lead: leadFields as Lead,
    contacts: MOCK_CONTACTS.filter((c) => c.lead_id === id),
    outreach: MOCK_OUTREACH.filter((o) => o.lead_id === id),
    call_briefs: MOCK_BRIEFS.filter((b) => b.lead_id === id),
    assignments: MOCK_ASSIGNMENTS.filter((a) => a.lead_id === id),
    pipeline_updates: mockPipelineUpdates().filter((p) => p.lead_id === id).sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ),
  };
}

/**
 * Demo-mode mutations, held on globalThis.
 *
 * Next.js does not guarantee that a server action and a server component share
 * one module instance, so a plain module-level array mutated by an action is
 * invisible to the next render. Keying the store off globalThis gives every
 * instance in the process the same object. It resets on server restart, which
 * is exactly what a demo wants.
 */
type MockStore = {
  status: Map<string, { status: LeadStatus; updated_at: string }>;
  updates: PipelineUpdate[];
};

function store(): MockStore {
  const g = globalThis as unknown as { __bitoMockStore?: MockStore };
  if (!g.__bitoMockStore) {
    g.__bitoMockStore = { status: new Map(), updates: [] };
  }
  return g.__bitoMockStore;
}

/** MOCK_LEADS with any demo-mode stage changes applied. */
export function mockLeads(): LeadInboxRow[] {
  const { status } = store();
  if (status.size === 0) return MOCK_LEADS;
  return MOCK_LEADS.map((lead) => {
    const override = status.get(lead.id);
    return override
      ? { ...lead, status: override.status, updated_at: override.updated_at }
      : lead;
  });
}

/** MOCK_PIPELINE_UPDATES plus anything recorded this session. */
export function mockPipelineUpdates(): PipelineUpdate[] {
  return [...MOCK_PIPELINE_UPDATES, ...store().updates];
}

/**
 * Move a lead to a new stage in demo mode and log the transition, so the
 * draggable kanban behaves exactly as it does against a real database.
 */
export function mockUpdateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  note: string | null = null
): boolean {
  const current = mockLeads().find((l) => l.id === leadId);
  if (!current) return false;

  const oldStatus = current.status;
  if (oldStatus === newStatus) return true;

  const now = new Date().toISOString();
  const s = store();
  s.status.set(leadId, { status: newStatus, updated_at: now });
  s.updates.push({
    id: `pu-mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    lead_id: leadId,
    rep_id: null,
    old_status: oldStatus,
    new_status: newStatus,
    note,
    updated_at: now,
  });

  return true;
}

// ─── Extended demo set ─────────────────────────────────────────────────────
//
// SYNTHETIC DATA. These companies are fictional GCC warehouse operators
// invented for the demo, deliberately not real businesses: the five original
// mock leads above name real firms, and inventing tender activity for more of
// them would put fabricated commercial claims on screen. Replace this whole
// block with real Supabase data before anyone treats it as a pipeline.

type SeedLead = {
  id: string;
  company: string;
  signal: Lead["signal_type"];
  source: string;
  summary: string;
  location: string;
  industry: string;
  size: string;
  score: number;
  reason: string;
  products: string[];
  status: LeadStatus;
  ageHours: number;
  stageHours: number;
  rep?: string;
  archivedReason?: string;
};

const SEED: SeedLead[] = [
  { id: "lead-11", company: "Khaleej Cold Stores", signal: "expansion", source: "Trade Arabia",
    summary: "Third cold-storage facility announced for Kizad, 18,000 sqm at -25°C. Racking package not yet awarded.",
    location: "Abu Dhabi, UAE", industry: "Food & Beverage · Cold Chain", size: "18,000 sqm", score: 91,
    reason: "Confirmed build with unawarded racking scope; deep-freeze spec matches BITO cold-rated systems.",
    products: ["Drive-in racking", "Cold-spec coatings"], status: "new", ageHours: 5, stageHours: 5 },

  { id: "lead-12", company: "Northgate Freight Services", signal: "new_facility", source: "Logistics Middle East",
    summary: "New 32,000 sqm consolidation centre breaking ground in Jebel Ali Free Zone. Fit-out tender expected within the quarter.",
    location: "Dubai, UAE", industry: "Logistics & Distribution", size: "32,000 sqm", score: 86,
    reason: "Early but confirmed; free-zone builds historically convert well and the fit-out window is open.",
    products: ["PRO pallet racking", "Mezzanine"], status: "new", ageHours: 9, stageHours: 9 },

  { id: "lead-13", company: "Sahara Building Materials", signal: "expansion", source: "Zawya",
    summary: "Doubling distribution footprint in Dammam with a long-goods storage requirement for steel and profiles.",
    location: "Dammam, KSA", industry: "Construction Supply", size: "22,000 sqm", score: 78,
    reason: "Long-goods spec is a direct cantilever racking fit; timeline unconfirmed.",
    products: ["Cantilever racking"], status: "new", ageHours: 20, stageHours: 20 },

  { id: "lead-14", company: "Marina Pharma Distribution", signal: "rfp", source: "Tender Board",
    summary: "Tender issued for a GDP-compliant pharmaceutical warehouse, 9,000 sqm, temperature-mapped zones and narrow-aisle storage.",
    location: "Doha, Qatar", industry: "Pharmaceutical", size: "9,000 sqm", score: 84,
    reason: "Live tender with explicit narrow-aisle and validation requirements; short list not yet drawn.",
    products: ["Narrow-aisle racking", "Shelving"], status: "new", ageHours: 26, stageHours: 26 },

  { id: "lead-15", company: "Emirates Auto Parts Group", signal: "expansion", source: "Gulf Business",
    summary: "Consolidating four depots into a single 15,000 sqm parts hub. Small-parts picking is the stated bottleneck.",
    location: "Sharjah, UAE", industry: "Automotive Aftermarket", size: "15,000 sqm", score: 73,
    reason: "Clear small-parts pain point matching BITO shelving and flow racks; budget unconfirmed.",
    products: ["Shelving", "Carton flow", "Pick modules"], status: "new", ageHours: 40, stageHours: 40 },

  { id: "lead-16", company: "Bayan Agri Foods", signal: "new_facility", source: "Arabian Industry",
    summary: "Grain and dry-goods facility planned outside Riyadh. Bulk storage plus a modest pallet operation.",
    location: "Riyadh, KSA", industry: "Agriculture", size: "27,000 sqm", score: 61,
    reason: "Mostly bulk silo storage — only part of the scope is addressable.",
    products: ["PRO pallet racking"], status: "new", ageHours: 52, stageHours: 52 },

  { id: "lead-17", company: "Cordoba Home Retail", signal: "expansion", source: "LinkedIn",
    summary: "Furniture retailer opening a regional DC with a bulky-goods and click-and-collect staging requirement.",
    location: "Kuwait City, Kuwait", industry: "Retail · Furniture", size: "19,000 sqm", score: 69,
    reason: "Bulky-goods handling suits wide-span shelving; retailer has no incumbent supplier in region.",
    products: ["Wide-span shelving", "Mezzanine"], status: "listed", ageHours: 72, stageHours: 30 },

  { id: "lead-18", company: "Falcon Industrial Spares", signal: "new_facility", source: "Gulf News",
    summary: "MRO distributor fitting out a 7,500 sqm facility with a heavy small-parts catalogue.",
    location: "Dubai, UAE", industry: "Industrial Distribution", size: "7,500 sqm", score: 66,
    reason: "Good shelving fit, modest deal size. Suits a rep building territory coverage.",
    products: ["Shelving", "Carton flow"], status: "listed", ageHours: 96, stageHours: 44 },

  { id: "lead-19", company: "Gulf Marine Supplies", signal: "expansion", source: "Trade Arabia",
    summary: "Ship-chandler expanding quayside storage. Mixed long-goods and palletised inventory.",
    location: "Fujairah, UAE", industry: "Marine Supply", size: "6,000 sqm", score: 58,
    reason: "Smaller scope with a mixed spec; worth a call but unlikely to be a flagship deal.",
    products: ["Cantilever racking", "PRO pallet racking"], status: "listed", ageHours: 120, stageHours: 60 },

  { id: "lead-20", company: "Tawazun Distribution", signal: "rfp", source: "Tender Board",
    summary: "RFP for a 40,000 sqm multi-temperature DC. Shortlist stage; technical submission due in ten days.",
    location: "Abu Dhabi, UAE", industry: "Logistics & Distribution", size: "40,000 sqm", score: 93,
    reason: "Shortlisted with a live submission deadline and full multi-temp scope — highest-value open deal.",
    products: ["PRO pallet racking", "Shuttle system", "Mezzanine"], status: "assigned", ageHours: 100, stageHours: 12, rep: "rep-1" },

  { id: "lead-21", company: "Rawabi Logistics Park", signal: "new_facility", source: "Zawya",
    summary: "Developer building speculative warehousing with racking offered as a tenant fit-out option.",
    location: "Jeddah, KSA", industry: "Industrial Real Estate", size: "55,000 sqm", score: 80,
    reason: "Developer relationship could produce repeat fit-out work across multiple units.",
    products: ["PRO pallet racking", "Wide-span shelving"], status: "assigned", ageHours: 140, stageHours: 20, rep: "rep-2" },

  { id: "lead-22", company: "Delta Chemicals Storage", signal: "expansion", source: "Arabian Industry",
    summary: "Hazardous-goods store expansion with bunded pallet storage and strict segregation requirements.",
    location: "Dammam, KSA", industry: "Chemicals", size: "11,000 sqm", score: 75,
    reason: "Compliance-heavy spec; BITO has referenceable hazardous-goods installations.",
    products: ["Pallet racking", "Containment"], status: "assigned", ageHours: 160, stageHours: 34, rep: "rep-2" },

  { id: "lead-23", company: "Nadeen Fashion Group", signal: "expansion", source: "LinkedIn",
    summary: "Apparel retailer moving to a garment-on-hanger and flat-pack hybrid operation.",
    location: "Dubai, UAE", industry: "Retail · Apparel", size: "13,000 sqm", score: 71,
    reason: "GOH plus shelving mix is deliverable; competitor incumbent likely.",
    products: ["Shelving", "Mezzanine", "GOH systems"], status: "contacted", ageHours: 180, stageHours: 6, rep: "rep-1" },

  { id: "lead-24", company: "Al Waha Beverage Co", signal: "new_facility", source: "Gulf Business",
    summary: "Bottling plant adding an adjacent finished-goods warehouse. High-density pallet storage required.",
    location: "Muscat, Oman", industry: "Food & Beverage", size: "21,000 sqm", score: 82,
    reason: "High-throughput palletised FMCG — textbook drive-in and shuttle territory.",
    products: ["Drive-in racking", "Shuttle system"], status: "contacted", ageHours: 200, stageHours: 18, rep: "rep-3" },

  { id: "lead-25", company: "Qasr Electronics Trading", signal: "expansion", source: "Trade Arabia",
    summary: "Consumer-electronics importer outgrowing current storage; wants a mezzanine to add capacity without relocating.",
    location: "Sharjah, UAE", industry: "Electronics Distribution", size: "8,500 sqm", score: 68,
    reason: "Mezzanine-led deal inside an existing building — fast to quote, quick to install.",
    products: ["Mezzanine", "Shelving"], status: "contacted", ageHours: 220, stageHours: 40, rep: "rep-1" },

  { id: "lead-26", company: "Sinaan Medical Supplies", signal: "rfp", source: "Tender Board",
    summary: "Public-sector medical stores upgrade. Two site visits completed, technical clarification ongoing.",
    location: "Doha, Qatar", industry: "Healthcare", size: "12,000 sqm", score: 87,
    reason: "Deep in the process with site visits done; procurement timeline is public.",
    products: ["Shelving", "Narrow-aisle racking"], status: "meeting", ageHours: 260, stageHours: 9, rep: "rep-3" },

  { id: "lead-27", company: "Arcadia Cold Logistics", signal: "expansion", source: "Logistics Middle East",
    summary: "3PL adding a frozen bay. Technical workshop held with their engineering team last week.",
    location: "Dubai, UAE", industry: "Third-Party Logistics", size: "16,000 sqm", score: 85,
    reason: "Engaged engineering team and a defined frozen scope; commercial discussion is next.",
    products: ["Drive-in racking", "Cold-spec coatings", "Shuttle system"], status: "meeting", ageHours: 300, stageHours: 14, rep: "rep-1" },

  { id: "lead-28", company: "Meridian Print & Packaging", signal: "new_facility", source: "Zawya",
    summary: "Packaging converter relocating. Reel storage and finished-goods racking both in scope.",
    location: "Riyadh, KSA", industry: "Packaging", size: "14,000 sqm", score: 74,
    reason: "Reel-handling requirement narrows the field of capable suppliers.",
    products: ["Cantilever racking", "PRO pallet racking"], status: "meeting", ageHours: 340, stageHours: 22, rep: "rep-2" },

  { id: "lead-29", company: "Zenith Warehousing Solutions", signal: "rfp", source: "Tender Board",
    summary: "Quote issued for a 28,000 sqm racking package. Client comparing against two other suppliers.",
    location: "Abu Dhabi, UAE", industry: "Third-Party Logistics", size: "28,000 sqm", score: 89,
    reason: "Quote in with a known competitive set; decision expected inside the month.",
    products: ["PRO pallet racking", "Mezzanine", "Pick modules"], status: "quote", ageHours: 400, stageHours: 11, rep: "rep-1" },

  { id: "lead-30", company: "Harbourline Freight", signal: "expansion", source: "Gulf News",
    summary: "Quote issued for a cross-dock racking retrofit. Client has requested a revised phasing plan.",
    location: "Jeddah, KSA", industry: "Freight Forwarding", size: "17,000 sqm", score: 79,
    reason: "Active quote with a live revision request — engaged buyer.",
    products: ["PRO pallet racking", "Carton flow"], status: "quote", ageHours: 430, stageHours: 19, rep: "rep-2" },

  { id: "lead-31", company: "Oasis Retail Distribution", signal: "expansion", source: "Arabian Industry",
    summary: "Quote issued for shelving and mezzanine across two sites. Awaiting budget sign-off from group finance.",
    location: "Kuwait City, Kuwait", industry: "Retail · Grocery", size: "10,000 sqm", score: 76,
    reason: "Technically agreed and priced; blocked only on internal budget approval.",
    products: ["Shelving", "Mezzanine"], status: "quote", ageHours: 460, stageHours: 33, rep: "rep-3" },

  { id: "lead-32", company: "Continental Spare Parts", signal: "expansion", source: "Trade Arabia",
    summary: "Quote issued for a small-parts pick module. Quiet since the last follow-up.",
    location: "Dubai, UAE", industry: "Automotive Aftermarket", size: "5,500 sqm", score: 64,
    reason: "Priced and sent but the buyer has gone quiet — needs a chase before it goes cold.",
    products: ["Carton flow", "Shelving"], status: "quote", ageHours: 520, stageHours: 47, rep: "rep-1" },

  { id: "lead-33", company: "Vantage Distribution Centre", signal: "new_facility", source: "Logistics Middle East",
    summary: "Won — 35,000 sqm pallet racking and mezzanine package, installation scheduled next quarter.",
    location: "Dubai, UAE", industry: "Logistics & Distribution", size: "35,000 sqm", score: 92,
    reason: "Closed won against two competitors on lead time and local support.",
    products: ["PRO pallet racking", "Mezzanine"], status: "won", ageHours: 600, stageHours: 15, rep: "rep-1" },

  { id: "lead-34", company: "Silk Route Trading", signal: "expansion", source: "Zawya",
    summary: "Won — cantilever and wide-span package for a building-materials depot.",
    location: "Riyadh, KSA", industry: "Construction Supply", size: "13,500 sqm", score: 83,
    reason: "Closed won; client already discussing a second phase.",
    products: ["Cantilever racking", "Wide-span shelving"], status: "won", ageHours: 700, stageHours: 40, rep: "rep-2" },

  { id: "lead-35", company: "Peninsula Foods", signal: "expansion", source: "Gulf Business",
    summary: "Won — chilled racking retrofit delivered ahead of schedule.",
    location: "Muscat, Oman", industry: "Food & Beverage · Cold Chain", size: "9,500 sqm", score: 81,
    reason: "Closed won and referenceable — the client has agreed to a site-visit reference.",
    products: ["Drive-in racking", "Cold-spec coatings"], status: "won", ageHours: 900, stageHours: 90, rep: "rep-3" },

  { id: "lead-36", company: "Crescent Textiles", signal: "expansion", source: "LinkedIn",
    summary: "Dead — project shelved after the parent group paused regional capital spending.",
    location: "Sharjah, UAE", industry: "Textiles", size: "12,000 sqm", score: 55,
    reason: "Capital freeze confirmed by the buyer; no timeline to revisit.",
    products: ["Shelving"], status: "dead", ageHours: 800, stageHours: 120, rep: "rep-1" },

  { id: "lead-37", company: "Anchor Bay Logistics", signal: "new_facility", source: "Trade Arabia",
    summary: "Dead — awarded to an incumbent supplier already installed at their sister site.",
    location: "Dammam, KSA", industry: "Third-Party Logistics", size: "20,000 sqm", score: 70,
    reason: "Lost on incumbency rather than price or spec.",
    products: ["PRO pallet racking"], status: "dead", ageHours: 850, stageHours: 100, rep: "rep-2" },

  { id: "lead-38", company: "Jumeirah Facilities Group", signal: "expansion", source: "Gulf News",
    summary: "Returned — rep could not reach a decision-maker after six attempts across two months.",
    location: "Dubai, UAE", industry: "Facilities Management", size: "8,000 sqm", score: 62,
    reason: "No contactable decision-maker; needs a different route in or a fresh contact record.",
    products: ["Shelving", "Mezzanine"], status: "returned", ageHours: 640, stageHours: 26 },

  { id: "lead-39", company: "Al Rayan Wholesale", signal: "expansion", source: "Zawya",
    summary: "Returned — the requirement turned out to be shelving for a retail floor, not a warehouse.",
    location: "Doha, Qatar", industry: "Wholesale", size: "4,000 sqm", score: 44,
    reason: "Misqualified at source: retail display, not storage. Worth re-scoring the signal rule.",
    products: [], status: "returned", ageHours: 500, stageHours: 38 },

  { id: "lead-40", company: "Horizon Steel Traders", signal: "expansion", source: "Arabian Industry",
    summary: "Article referenced a 2019 expansion that has already completed.",
    location: "Abu Dhabi, UAE", industry: "Metals", size: "unknown", score: 31,
    reason: "Stale source article — the described project finished years ago.",
    products: [], status: "new", ageHours: 300, stageHours: 300, archivedReason: "stale_article" },

  { id: "lead-41", company: "Coastal Logistics Partners", signal: "expansion", source: "LinkedIn",
    summary: "Signal had no date and could not be corroborated against any second source.",
    location: "Kuwait City, Kuwait", industry: "Logistics & Distribution", size: "unknown", score: 28,
    reason: "Undated, uncorroborated signal.",
    products: [], status: "new", ageHours: 420, stageHours: 420, archivedReason: "no_signal_date" },
];

for (const s of SEED) {
  MOCK_LEADS.push({
    id: s.id,
    company_name: s.company,
    signal_type: s.signal,
    signal_source: s.source,
    signal_summary: s.summary,
    location: s.location,
    industry: s.industry,
    warehouse_size: s.size,
    score: s.score,
    score_reason: s.reason,
    score_breakdown: null,
    bito_products: s.products,
    source_url: null,
    status: s.status,
    last_contacted_at: ["contacted", "meeting", "quote", "won", "dead"].includes(s.status)
      ? hoursAgo(s.stageHours)
      : null,
    do_not_contact: false,
    archived: Boolean(s.archivedReason),
    archived_at: s.archivedReason ? hoursAgo(s.stageHours) : null,
    archived_reason: (s.archivedReason ?? null) as LeadInboxRow["archived_reason"],
    last_article_check: hoursAgo(Math.min(s.ageHours, 48)),
    created_at: hoursAgo(s.ageHours),
    updated_at: hoursAgo(s.stageHours),
    rep_name: s.rep ? MOCK_REPS.find((r) => r.id === s.rep)?.full_name ?? null : null,
  });

  if (s.rep) {
    MOCK_ASSIGNMENTS.push({
      id: `assn-${s.id}`,
      lead_id: s.id,
      rep_id: s.rep,
      assigned_by: "admin",
      assigned_at: hoursAgo(s.ageHours - 2),
      notes: null,
      rep: MOCK_REPS.find((r) => r.id === s.rep) ?? null,
    });

    MOCK_PIPELINE_UPDATES.push({
      id: `pu-${s.id}-a`,
      lead_id: s.id,
      rep_id: s.rep,
      old_status: "new",
      new_status: "assigned",
      note: "Routed by the manager.",
      updated_at: hoursAgo(s.ageHours - 2),
    });

    if (s.status !== "assigned") {
      MOCK_PIPELINE_UPDATES.push({
        id: `pu-${s.id}-b`,
        lead_id: s.id,
        rep_id: s.rep,
        old_status: "assigned",
        new_status: s.status,
        note: null,
        updated_at: hoursAgo(s.stageHours),
      });
    }
  }
}
