import type {
  Lead,
  Rep,
  Contact,
  Outreach,
  CallBrief,
  Assignment,
  PipelineUpdate,
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
    bito_products: ["PRO pallet racking", "Conveyor systems", "Mezzanine"],
    source_url: "https://gulfnews.com/business/aramex-dubai-south",
    status: "new",
    last_contacted_at: null,
    do_not_contact: false,
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
    bito_products: ["Drive-in racking", "Shuttle system", "Cold-spec coatings"],
    source_url: "https://arabnews.com/almarai-coldchain",
    status: "assigned",
    last_contacted_at: null,
    do_not_contact: false,
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
    bito_products: ["Mezzanine", "Pick modules", "Carton flow"],
    source_url: "https://linkedin.com/feed/lulu-rfp",
    status: "contacted",
    last_contacted_at: hoursAgo(6),
    do_not_contact: false,
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
    bito_products: ["Selective racking", "VNA systems"],
    source_url: "https://reuters.com/qatar-logistics-hub-c",
    status: "meeting",
    last_contacted_at: hoursAgo(10),
    do_not_contact: false,
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
    bito_products: ["Conveyor", "Sortation"],
    source_url: "https://noon.com/careers",
    status: "new",
    last_contacted_at: null,
    do_not_contact: false,
    last_article_check: daysAgo(2),
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    rep_name: null,
  },

  // ── Archived (do_not_contact = true) ───────────────────────────────────────
  // Rejected on 2026-06-08: source articles were older than 60 days at re-check.
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
    bito_products: ["Selective racking"],
    source_url: "https://tradearabia.com/gwc-logistics-village",
    status: "new",
    last_contacted_at: null,
    do_not_contact: true,
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
    bito_products: ["Mezzanine"],
    source_url: "https://zawya.com/agility-kuwait-dc",
    status: "new",
    last_contacted_at: null,
    do_not_contact: true,
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

// ─── Helpers ──────────────────────────────────────────────────────────────

export function mockDashboardStats(): DashboardStats {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();

  let totalToday = 0;
  let hot = 0;
  let assigned = 0;
  let awaiting = 0;
  for (const l of MOCK_LEADS) {
    if (l.do_not_contact) continue; // archived leads don't count toward active stats
    if (new Date(l.created_at).getTime() >= startMs) totalToday += 1;
    if (l.score >= 80) hot += 1;
    if (l.status !== "new" && l.status !== "dead") assigned += 1;
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
  const lead = MOCK_LEADS.find((l) => l.id === id);
  if (!lead) return null;
  // Strip the inbox-only field before returning as Lead.
  const { rep_name, ...leadFields } = lead;
  return {
    lead: leadFields as Lead,
    contacts: MOCK_CONTACTS.filter((c) => c.lead_id === id),
    outreach: MOCK_OUTREACH.filter((o) => o.lead_id === id),
    call_briefs: MOCK_BRIEFS.filter((b) => b.lead_id === id),
    assignments: MOCK_ASSIGNMENTS.filter((a) => a.lead_id === id),
    pipeline_updates: MOCK_PIPELINE_UPDATES.filter((p) => p.lead_id === id).sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ),
  };
}
