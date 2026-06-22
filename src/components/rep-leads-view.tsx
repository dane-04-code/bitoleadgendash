"use client";

import * as React from "react";
import Link from "next/link";
import type { RepInboxLead } from "@/lib/queries";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/supabase/types";
import { ScoreBadge } from "@/components/ui/score-badge";
import { cn, formatRelative } from "@/lib/utils";

const COLUMN_DOT: Record<LeadStatus, string> = {
  new: "bg-signal-cold",
  listed: "bg-brand",
  assigned: "bg-signal-warm",
  contacted: "bg-signal-cold",
  meeting: "bg-brand",
  proposal: "bg-brand",
  won: "bg-signal-good",
  dead: "bg-ink-faint",
  returned: "bg-signal-hot",
};

const COLUMN_CODE: Record<LeadStatus, string> = {
  new: "01",
  listed: "02",
  assigned: "03",
  contacted: "04",
  meeting: "05",
  proposal: "06",
  won: "07",
  dead: "08",
  returned: "09",
};

// A rep only ever holds owned leads, so drop the columns for unowned states
// (new / listed / returned) — they'd always be empty on the rep board.
const REP_BOARD_COLUMNS: LeadStatus[] = LEAD_STATUSES.filter(
  (s) => s !== "returned" && s !== "listed" && s !== "new"
);

export function RepLeadsView({ leads }: { leads: RepInboxLead[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h2 className="display-serif text-2xl text-ink leading-none">
            Your leads
          </h2>
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            {leads.length} routed to you
          </span>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="border border-line bg-surface">
          <Empty />
        </div>
      ) : (
        <Board leads={leads} />
      )}
    </section>
  );
}

// ───────────────────────── Board view ─────────────────────────

function Board({ leads }: { leads: RepInboxLead[] }) {
  const buckets = React.useMemo(() => {
    const map: Record<LeadStatus, RepInboxLead[]> = {
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
    for (const lead of leads) {
      const status =
        (lead.status as LeadStatus) in map ? (lead.status as LeadStatus) : "assigned";
      map[status].push(lead);
    }
    return map;
  }, [leads]);

  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-8 lg:-mx-10 px-5 sm:px-8 lg:px-10 scrollbar-thin pb-3">
      <div className="flex gap-3 min-w-max">
        {REP_BOARD_COLUMNS.map((status) => (
          <Column key={status} status={status} leads={buckets[status]} />
        ))}
      </div>
    </div>
  );
}

function Column({ status, leads }: { status: LeadStatus; leads: RepInboxLead[] }) {
  return (
    <div className="w-[290px] shrink-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border border-b-0 border-line bg-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("dot", COLUMN_DOT[status])} />
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            {COLUMN_CODE[status]}
          </span>
          <h3 className="text-[12px] font-medium tracking-tight text-ink truncate">
            {LEAD_STATUS_LABELS[status]}
          </h3>
        </div>
        <span className="mono text-[11px] tabular text-ink-2">
          {String(leads.length).padStart(2, "0")}
        </span>
      </div>

      <div className="flex-1 border border-line bg-surface/50 p-2 space-y-2 min-h-[420px] max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin">
        {leads.length === 0 ? (
          <div className="flex items-center justify-center h-32 mono text-[10px] uppercase tracking-wider text-ink-faint italic">
            empty
          </div>
        ) : (
          leads.map((lead) => <BoardCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function BoardCard({ lead }: { lead: RepInboxLead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block border border-line bg-surface p-3 hover:border-line-strong hover:bg-surface-2 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-medium leading-tight text-ink group-hover:text-brand-ink transition-colors line-clamp-2">
          {lead.company_name}
        </h4>
        <ScoreBadge score={lead.score} size="sm" showLabel={false} />
      </div>

      {lead.signal_summary && (
        <p className="text-[11px] text-ink-dim line-clamp-2 mb-3 leading-snug">
          {lead.signal_summary}
        </p>
      )}

      {lead.assignment_notes && (
        <p className="mono text-[10px] uppercase tracking-wider text-brand-ink/80 line-clamp-1 mb-2">
          ◆ {lead.assignment_notes}
        </p>
      )}

      <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-ink-faint border-t border-line pt-2">
        <span className="truncate">
          {lead.location || <span className="italic">—</span>}
        </span>
        <span className="tabular shrink-0">{formatRelative(lead.assigned_at)}</span>
      </div>
    </Link>
  );
}

function Empty() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="display-serif text-6xl text-ink-faint/30 mb-3">∅</div>
      <h3 className="display-serif text-2xl text-ink mb-2">
        No leads routed to you yet.
      </h3>
      <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
        When a lead is assigned to you — or you claim one from the marketplace —
        it&apos;ll appear here. Hold tight.
      </p>
    </div>
  );
}
