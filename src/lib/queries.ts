import { getSupabaseServerClient } from "./supabase/server";
import {
  isMockMode,
  MOCK_LEADS,
  MOCK_REPS,
  mockDashboardStats,
  mockLeadById,
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
} from "./supabase/types";

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

  const [todayResp, hotResp, assignedResp, awaitingResp] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("score", 80),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .neq("status", "new")
      .neq("status", "dead"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
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

export async function getLeadInbox(limit = 100): Promise<LeadInboxRow[]> {
  if (isMockMode()) {
    return [...MOCK_LEADS]
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit);
  }
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      assignments:assignments(
        rep:reps(full_name)
      )
    `
    )
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

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
    .select("id, full_name, email, telegram_username, telegram_chat_id, speciality, territory, is_active, created_at")
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
    assigned: [],
    contacted: [],
    meeting: [],
    proposal: [],
    won: [],
    dead: [],
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
