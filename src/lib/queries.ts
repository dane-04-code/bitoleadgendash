import { getSupabaseServerClient } from "./supabase/server";
import {
  isMockMode,
  MOCK_LEADS,
  MOCK_REPS,
  mockDashboardStats,
  mockLeadById,
  mockLeadNotes,
  mockLeadReview,
  mockAllFeedback,
} from "./mock-data";
import type {
  Lead,
  Contact,
  Rep,
  Assignment,
  Outreach,
  CallBrief,
  PipelineUpdate,
  LeadStatus,
  LeadNote,
  LeadReview,
  Feedback,
} from "./supabase/types";
import { UNOWNED_STATUSES } from "./supabase/types";

export type DashboardStats = {
  totalToday: number;
  hot: number;
  assigned: number;
  awaiting: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isMockMode()) return mockDashboardStats();
  const supabase = getSupabaseServerClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Top-line stats reflect active leads only — archived leads are rejected noise
  // and should not inflate "hot", "awaiting", etc.
  const [todayResp, hotResp, assignedResp, awaitingResp] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("archived", false)
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("archived", false)
      .gte("score", 80),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("archived", false)
      .neq("status", "new")
      .neq("status", "listed")
      .neq("status", "dead")
      .neq("status", "returned"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("archived", false)
      .eq("status", "new"),
  ]);

  return {
    totalToday: todayResp.count ?? 0,
    hot: hotResp.count ?? 0,
    assigned: assignedResp.count ?? 0,
    awaiting: awaitingResp.count ?? 0,
  };
}

export type LeadInboxRow = Lead & {
  rep_name?: string | null;
};

/** Which slice of the inbox to show. */
export type InboxView =
  | "active"
  | "archived"
  | "killed"
  | "new"
  | "unassigned"
  | "listed"
  | "assigned"
  | "returned";

/**
 * Statuses that mean a lead is currently owned and being worked by a rep —
 * the "Assigned" slice of the inbox.
 */
const ASSIGNED_STATUSES: LeadStatus[] = [
  "assigned",
  "contacted",
  "meeting",
  "proposal",
];

/** Optional filters applied to the inbox list view. */
export type LeadInboxFilters = {
  /** Free-text match against company name + signal summary. */
  q?: string;
  /** A specific lead status, or undefined for any. */
  status?: LeadStatus;
  /** Exact industry match (sourced from the facet list). */
  industry?: string;
  /** Minimum automated score (inclusive). */
  minScore?: number;
};

/** True when any filter is actually set. */
export function hasFilters(f: LeadInboxFilters): boolean {
  return Boolean(f.q || f.status || f.industry || (f.minScore && f.minScore > 0));
}

function matchesFilters(lead: Lead, f: LeadInboxFilters): boolean {
  if (f.status && lead.status !== f.status) return false;
  if (f.industry && lead.industry !== f.industry) return false;
  if (f.minScore && lead.score < f.minScore) return false;
  if (f.q) {
    const hay = `${lead.company_name} ${lead.signal_summary ?? ""}`.toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  return true;
}

/** Whether a lead belongs in the given inbox view (assignment/recency slice). */
function matchesView(lead: Lead, view: InboxView, cutoff: string): boolean {
  switch (view) {
    case "new":
      return lead.created_at >= cutoff;
    case "unassigned":
      return lead.status === "new";
    case "listed":
      return lead.status === "listed";
    case "assigned":
      return ASSIGNED_STATUSES.includes(lead.status);
    case "returned":
      return lead.status === "returned";
    case "killed":
      return lead.status === "dead";
    case "active":
      // The manager's main list: only unowned leads (no rep clutter).
      return UNOWNED_STATUSES.includes(lead.status);
    default:
      return true; // "archived" — slice handled by the archived flag
  }
}

/** Leads created on or after this point count as "new this week". */
const RECENT_WINDOW_DAYS = 7;

function recentCutoffISO(days = RECENT_WINDOW_DAYS): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getLeadInbox(
  limit = 100,
  view: InboxView = "active",
  filters: LeadInboxFilters = {}
): Promise<LeadInboxRow[]> {
  const showArchived = view === "archived";
  const cutoff = recentCutoffISO();

  if (isMockMode()) {
    return [...MOCK_LEADS]
      .filter((l) => Boolean(l.archived) === showArchived)
      .filter((l) => matchesView(l, view, cutoff))
      .filter((l) => matchesFilters(l, filters))
      .sort((a, b) => {
        // Archive is ordered by when it was archived (most recent first);
        // "new this week" is recency-first; everything else is score-first so
        // the strongest signals stay at the top.
        if (view === "archived") {
          const at = a.archived_at ? new Date(a.archived_at).getTime() : -Infinity;
          const bt = b.archived_at ? new Date(b.archived_at).getTime() : -Infinity;
          return bt - at; // NULLS LAST
        }
        if (view === "new") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (
          b.score - a.score ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
      .slice(0, limit);
  }
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("leads")
    .select(
      `
      *,
      assignments:assignments(
        rep:reps(full_name)
      )
    `
    )
    .eq("archived", showArchived);

  // Inbox filters (search / status / industry / min score).
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.industry) query = query.eq("industry", filters.industry);
  if (filters.minScore && filters.minScore > 0) {
    query = query.gte("score", filters.minScore);
  }
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `company_name.ilike.%${term}%,signal_summary.ilike.%${term}%`
      );
    }
  }

  if (view === "archived") {
    query = query.order("archived_at", { ascending: false, nullsFirst: false });
  } else if (view === "new") {
    query = query
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });
  } else {
    // Assignment slices filter by status, then fall through to score ordering.
    if (view === "active") query = query.in("status", UNOWNED_STATUSES);
    else if (view === "unassigned") query = query.eq("status", "new");
    else if (view === "listed") query = query.eq("status", "listed");
    else if (view === "assigned") query = query.in("status", ASSIGNED_STATUSES);
    else if (view === "returned") query = query.eq("status", "returned");
    else if (view === "killed") query = query.eq("status", "dead");

    query = query
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("getLeadInbox error", error);
    return [];
  }

  return (data || []).map((row: any) => {
    const latestAssignment = Array.isArray(row.assignments) && row.assignments.length > 0
      ? row.assignments[row.assignments.length - 1]
      : null;
    return {
      ...row,
      rep_name: latestAssignment?.rep?.full_name ?? null,
    } as LeadInboxRow;
  });
}

/** Distinct industries across leads — populates the inbox industry filter. */
export async function getLeadFilterFacets(): Promise<{ industries: string[] }> {
  if (isMockMode()) {
    const industries = Array.from(
      new Set(MOCK_LEADS.map((l) => l.industry).filter((v): v is string => Boolean(v)))
    ).sort();
    return { industries };
  }
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("industry")
    .eq("archived", false)
    .not("industry", "is", null);
  if (error) {
    console.error("getLeadFilterFacets error", error);
    return { industries: [] };
  }
  const industries = Array.from(
    new Set((data || []).map((r: any) => r.industry).filter(Boolean) as string[])
  ).sort();
  return { industries };
}

/**
 * Count of unowned active leads — drives the main "Leads" tab badge. Owned
 * leads are excluded so the badge matches the decluttered list.
 */
export async function getActiveLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter(
      (l) => !l.archived && UNOWNED_STATUSES.includes(l.status)
    ).length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .in("status", UNOWNED_STATUSES);
  if (error) {
    console.error("getActiveLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of leads currently on the marketplace (status = listed). */
export async function getListedLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter((l) => !l.archived && l.status === "listed").length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .eq("status", "listed");
  if (error) {
    console.error("getListedLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of archived (archived = true) leads — drives the "Archive" tab badge. */
export async function getArchivedLeadCount(): Promise<number> {
  if (isMockMode()) return MOCK_LEADS.filter((l) => l.archived).length;
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", true);
  if (error) {
    console.error("getArchivedLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of active-but-dead leads killed by a manager. */
export async function getKilledLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter((l) => !l.archived && l.status === "dead").length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .eq("status", "dead");
  if (error) {
    console.error("getKilledLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of active leads that arrived within the recency window — drives the "New this week" badge. */
export async function getRecentLeadCount(days = RECENT_WINDOW_DAYS): Promise<number> {
  const cutoff = recentCutoffISO(days);
  if (isMockMode()) {
    return MOCK_LEADS.filter(
      (l) => !l.archived && l.created_at >= cutoff
    ).length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .gte("created_at", cutoff);
  if (error) {
    console.error("getRecentLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of active leads still awaiting assignment (status = new). */
export async function getUnassignedLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter((l) => !l.archived && l.status === "new").length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .eq("status", "new");
  if (error) {
    console.error("getUnassignedLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of active leads currently owned and being worked by a rep. */
export async function getAssignedLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter(
      (l) => !l.archived && ASSIGNED_STATUSES.includes(l.status)
    ).length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .in("status", ASSIGNED_STATUSES);
  if (error) {
    console.error("getAssignedLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

/** Count of active leads a rep has returned to the admin. */
export async function getReturnedLeadCount(): Promise<number> {
  if (isMockMode()) {
    return MOCK_LEADS.filter((l) => !l.archived && l.status === "returned")
      .length;
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .eq("status", "returned");
  if (error) {
    console.error("getReturnedLeadCount error", error);
    return 0;
  }
  return count ?? 0;
}

export async function getNextInboxLeadId(
  currentId: string,
  view: InboxView = "active"
): Promise<string | null> {
  const leads = await getLeadInbox(500, view);
  if (leads.length === 0) return null;

  const currentIndex = leads.findIndex((lead) => lead.id === currentId);
  if (currentIndex === -1) return leads[0]?.id ?? null;

  return leads[currentIndex + 1]?.id ?? null;
}

export async function getLeadById(id: string): Promise<{
  lead: Lead | null;
  contacts: Contact[];
  outreach: Outreach[];
  call_briefs: CallBrief[];
  assignments: (Assignment & { rep: Rep | null })[];
  pipeline_updates: PipelineUpdate[];
} | null> {
  if (isMockMode()) return mockLeadById(id);
  const supabase = getSupabaseServerClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getLeadById error", error);
    return null;
  }
  if (!lead) return null;

  const [contactsResp, outreachResp, briefsResp, assignmentsResp, updatesResp] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("lead_id", id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("outreach")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("call_briefs")
        .select("*")
        .eq("lead_id", id)
        .order("generated_at", { ascending: false }),
      supabase
        .from("assignments")
        .select("*, rep:reps(*)")
        .eq("lead_id", id)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("pipeline_updates")
        .select("*")
        .eq("lead_id", id)
        .order("updated_at", { ascending: false }),
    ]);

  return {
    lead: lead as Lead,
    contacts: (contactsResp.data || []) as Contact[],
    outreach: (outreachResp.data || []) as Outreach[],
    call_briefs: (briefsResp.data || []) as CallBrief[],
    assignments: (assignmentsResp.data || []) as (Assignment & { rep: Rep | null })[],
    pipeline_updates: (updatesResp.data || []) as PipelineUpdate[],
  };
}

/** All notes for a lead, newest first. */
export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  if (isMockMode()) return mockLeadNotes(leadId);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getLeadNotes error", error);
    return [];
  }
  return (data || []) as LeadNote[];
}

/** The manual review scorecard for a lead, or null if none saved yet. */
export async function getLeadReview(leadId: string): Promise<LeadReview | null> {
  if (isMockMode()) return mockLeadReview(leadId);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_reviews")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (error) {
    console.error("getLeadReview error", error);
    return null;
  }
  return (data as LeadReview) ?? null;
}

/** All feedback submissions, newest first — drives the admin Feedback page. */
export async function getAllFeedback(): Promise<Feedback[]> {
  if (isMockMode()) return mockAllFeedback();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllFeedback error", error);
    return [];
  }
  return (data || []) as Feedback[];
}

export async function getRepById(id: string): Promise<Rep | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getRepById error", error);
    return null;
  }
  return data as Rep | null;
}

export type RepInboxLead = Lead & {
  assigned_at: string;
  assignment_notes: string | null;
};

export async function getLeadsForRep(repId: string): Promise<RepInboxLead[]> {
  const supabase = getSupabaseServerClient();
  // Pull every assignment for this rep, then expand the lead. A lead may have
  // multiple assignments over time (re-assignments) — dedupe by lead id and
  // keep the latest.
  const { data, error } = await supabase
    .from("assignments")
    .select(
      `
      assigned_at,
      notes,
      lead:leads(*)
    `
    )
    .eq("rep_id", repId)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("getLeadsForRep error", error);
    return [];
  }

  const seen = new Set<string>();
  const result: RepInboxLead[] = [];
  for (const row of (data || []) as any[]) {
    if (!row?.lead?.id) continue;
    if (seen.has(row.lead.id)) continue;
    seen.add(row.lead.id);
    result.push({
      ...(row.lead as Lead),
      assigned_at: row.assigned_at,
      assignment_notes: row.notes ?? null,
    });
  }

  // Sort: live deals first (not won/dead), then by score desc, then by assigned_at desc.
  result.sort((a, b) => {
    const aDone = a.status === "won" || a.status === "dead";
    const bDone = b.status === "won" || b.status === "dead";
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
  });

  return result;
}

export type RepStats = {
  total: number;
  hot: number;
  open: number;
  won: number;
  dead: number;
};

export async function getRepStats(repId: string): Promise<RepStats> {
  const leads = await getLeadsForRep(repId);
  const stats: RepStats = { total: 0, hot: 0, open: 0, won: 0, dead: 0 };
  for (const l of leads) {
    stats.total += 1;
    if (l.score >= 80) stats.hot += 1;
    if (l.status === "won") stats.won += 1;
    else if (l.status === "dead") stats.dead += 1;
    else stats.open += 1;
  }
  return stats;
}

export async function isLeadOwnedByRep(leadId: string, repId: string): Promise<boolean> {
  if (isMockMode()) {
    const { MOCK_ASSIGNMENTS } = await import("./mock-data");
    return MOCK_ASSIGNMENTS.some(
      (a) => a.lead_id === leadId && a.rep_id === repId
    );
  }
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("rep_id", repId);
  if (error) {
    console.error("isLeadOwnedByRep error", error);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function getActiveReps(): Promise<Rep[]> {
  if (isMockMode()) return MOCK_REPS.filter((r) => r.is_active);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reps")
    .select("id, full_name, email, telegram_username, telegram_chat_id, speciality, territory, is_active, availability, created_at")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) {
    console.error("getActiveReps error", error);
    return [];
  }
  return (data || []) as Rep[];
}

export type RepWithStatus = Omit<Rep, "password"> & { has_password: boolean };

export async function getAllReps(): Promise<RepWithStatus[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reps")
    .select("*")
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });
  if (error) {
    console.error("getAllReps error", error);
    return [];
  }
  return (data || []).map((r: any) => {
    const { password, ...rest } = r;
    return { ...rest, has_password: Boolean(password) } as RepWithStatus;
  });
}

export async function getRepLeadCounts(): Promise<Record<string, number>> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("rep_id");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { rep_id: string }[]) {
    counts[row.rep_id] = (counts[row.rep_id] || 0) + 1;
  }
  return counts;
}

export type PipelineLead = Lead & {
  rep_name: string | null;
  days_in_stage: number;
  last_status_change: string;
};

export async function getPipelineLeads(): Promise<Record<LeadStatus, PipelineLead[]>> {
  const supabase = getSupabaseServerClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      assignments:assignments(
        assigned_at,
        rep:reps(full_name)
      ),
      pipeline_updates:pipeline_updates(
        new_status,
        updated_at
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getPipelineLeads error", error);
  }

  const buckets: Record<LeadStatus, PipelineLead[]> = {
    new: [],
    listed: [],
    assigned: [],
    contacted: [],
    meeting: [],
    proposal: [],
    won: [],
    dead: [],
    returned: [],
  };

  for (const row of (leads || []) as any[]) {
    const latestUpdate = Array.isArray(row.pipeline_updates) && row.pipeline_updates.length > 0
      ? row.pipeline_updates
          .filter((u: any) => u.new_status === row.status)
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
      : null;
    const lastChange = latestUpdate?.updated_at || row.updated_at || row.created_at;
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24))
    );
    const latestAssignment = Array.isArray(row.assignments) && row.assignments.length > 0
      ? row.assignments.sort(
          (a: any, b: any) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
        )[0]
      : null;
    const status = (row.status as LeadStatus) || "new";
    if (!buckets[status]) continue;
    buckets[status].push({
      ...row,
      rep_name: latestAssignment?.rep?.full_name ?? null,
      days_in_stage: days,
      last_status_change: lastChange,
    });
  }

  return buckets;
}
