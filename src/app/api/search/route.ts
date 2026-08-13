import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPipelineLeads, getAllReps, getLeadsForRep } from "@/lib/queries";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export type SearchLead = {
  id: string;
  company: string;
  status: LeadStatus;
  statusLabel: string;
  score: number | null;
  location: string | null;
  rep: string | null;
};

export type SearchRep = {
  id: string;
  name: string;
  territory: string | null;
};

/**
 * Compact index behind the ⌘K palette. Fetched once on first open and filtered
 * client-side — the dataset is small enough that a round trip per keystroke
 * would only add latency to the thing meant to feel instant.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ leads: [], reps: [] }, { status: 401 });
  }

  if (session.role === "rep") {
    const own = await getLeadsForRep(session.subject);
    return NextResponse.json({
      leads: own.map((l) => ({
        id: l.id,
        company: l.company_name,
        status: l.status,
        statusLabel: LEAD_STATUS_LABELS[l.status],
        score: l.score,
        location: l.location,
        rep: null,
      })),
      reps: [],
    });
  }

  const [buckets, reps] = await Promise.all([getPipelineLeads(), getAllReps()]);

  const leads: SearchLead[] = Object.values(buckets)
    .flat()
    .map((l) => ({
      id: l.id,
      company: l.company_name,
      status: l.status,
      statusLabel: LEAD_STATUS_LABELS[l.status],
      score: l.score,
      location: l.location,
      rep: l.rep_name,
    }));

  return NextResponse.json({
    leads,
    reps: reps.map((r) => ({
      id: r.id,
      name: r.full_name,
      territory: r.territory,
    })),
  });
}
