"use client";

import * as React from "react";
import type { RepInboxLead } from "@/lib/queries";
import {
  LEAD_STATUSES,
  REP_SETTABLE_STATUSES,
  type LeadStatus,
} from "@/lib/supabase/types";
import { KanbanBoard, type KanbanLead } from "@/components/kanban-board";
import { daysBetween, regionOf } from "@/lib/utils";

// A rep only ever holds owned leads, so drop the columns for unowned states
// (new / listed / returned) — they'd always be empty on the rep board.
const REP_BOARD_COLUMNS: LeadStatus[] = LEAD_STATUSES.filter(
  (s) => s !== "returned" && s !== "listed" && s !== "new"
);

export function RepLeadsView({ leads }: { leads: RepInboxLead[] }) {
  const buckets = React.useMemo(() => {
    const map: Record<string, KanbanLead[]> = {};
    for (const status of REP_BOARD_COLUMNS) map[status] = [];

    for (const lead of leads) {
      const status: LeadStatus = REP_BOARD_COLUMNS.includes(lead.status)
        ? lead.status
        : "assigned";
      map[status].push({
        id: lead.id,
        company_name: lead.company_name,
        score: lead.score,
        signal_summary: lead.signal_summary,
        location: lead.location,
        rep_name: null,
        days_in_stage: daysBetween(lead.updated_at || lead.assigned_at),
        days_since_created: daysBetween(lead.created_at),
      });
    }
    return map;
  }, [leads]);

  // Only the countries the rep actually holds. A picker offering regions with
  // nothing behind them would be a list of dead ends.
  const regions = React.useMemo(
    () =>
      Array.from(
        new Set(
          leads.map((l) => regionOf(l.location)).filter((r): r is string => Boolean(r))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [leads]
  );

  if (leads.length === 0) {
    return (
      <section>
        <SectionHeading count={0} />
        <div className="border border-line bg-surface px-6 py-12 text-center">
          <p className="text-[14px] font-semibold text-ink">No leads yet</p>
          <p className="text-[12.5px] text-ink-dim mt-1.5 max-w-sm mx-auto leading-relaxed">
            Nothing has been routed to you. Check the marketplace for leads you
            can claim, or set yourself as looking for work in your account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading count={leads.length} />
      <KanbanBoard
        columns={REP_BOARD_COLUMNS}
        buckets={buckets}
        droppable={REP_SETTABLE_STATUSES}
        showRep={false}
        emptyHint="No leads"
        filters
        regions={regions}
      />
    </section>
  );
}

function SectionHeading({ count }: { count: number }) {
  return (
    <div className="flex items-baseline gap-2.5 mb-3">
      <h2 className="text-[15px] font-bold tracking-tight text-ink">Your board</h2>
      <span className="text-[12px] text-ink-dim">
        {count === 0
          ? "nothing routed to you yet"
          : `${count} lead${count === 1 ? "" : "s"} · drag to move a stage`}
      </span>
    </div>
  );
}
