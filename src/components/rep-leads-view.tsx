"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { RepInboxLead } from "@/lib/queries";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/supabase/types";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatRelative } from "@/lib/utils";

type View = "board" | "list";

const COLUMN_DOT: Record<LeadStatus, string> = {
  new: "bg-signal-cold",
  assigned: "bg-signal-warm",
  contacted: "bg-signal-cold",
  meeting: "bg-brand",
  proposal: "bg-brand",
  won: "bg-signal-good",
  dead: "bg-ink-faint",
};

const COLUMN_CODE: Record<LeadStatus, string> = {
  new: "01",
  assigned: "02",
  contacted: "03",
  meeting: "04",
  proposal: "05",
  won: "06",
  dead: "07",
};

export function RepLeadsView({ leads }: { leads: RepInboxLead[] }) {
  const [view, setView] = React.useState<View>("board");

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

        {leads.length > 0 && (
          <div
            role="tablist"
            aria-label="Lead view"
            className="inline-flex border border-line bg-surface-2 p-0.5 rounded-sm self-center"
          >
            <ViewTab active={view === "board"} onClick={() => setView("board")}>
              Board
            </ViewTab>
            <ViewTab active={view === "list"} onClick={() => setView("list")}>
              List
            </ViewTab>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="border border-line bg-surface">
          <Empty />
        </div>
      ) : view === "board" ? (
        <Board leads={leads} />
      ) : (
        <ListView leads={leads} />
      )}
    </section>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-sm transition-colors",
        active ? "bg-ink text-bg" : "text-ink-dim hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

// ───────────────────────── Board view ─────────────────────────

function Board({ leads }: { leads: RepInboxLead[] }) {
  const buckets = React.useMemo(() => {
    const map: Record<LeadStatus, RepInboxLead[]> = {
      new: [],
      assigned: [],
      contacted: [],
      meeting: [],
      proposal: [],
      won: [],
      dead: [],
    };
    for (const lead of leads) {
      const status = (lead.status as LeadStatus) in map ? (lead.status as LeadStatus) : "new";
      map[status].push(lead);
    }
    return map;
  }, [leads]);

  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-8 lg:-mx-10 px-5 sm:px-8 lg:px-10 scrollbar-thin pb-3">
      <div className="flex gap-3 min-w-max">
        {LEAD_STATUSES.map((status) => (
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

// ───────────────────────── List view ─────────────────────────

function ListView({ leads }: { leads: RepInboxLead[] }) {
  return (
    <div className="border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Company / Signal</TableHead>
            <TableHead className="w-[120px]">Score</TableHead>
            <TableHead className="hidden lg:table-cell w-[160px]">Location</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="hidden md:table-cell w-[120px]">Routed</TableHead>
            <TableHead className="text-right w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, i) => (
            <Row key={lead.id} lead={lead} index={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Row({ lead, index }: { lead: RepInboxLead; index: number }) {
  const dim = lead.status === "won" || lead.status === "dead";
  return (
    <TableRow className={`group ${dim ? "opacity-60" : ""}`}>
      <TableCell className="text-center mono text-[11px] text-ink-faint">
        {String(index + 1).padStart(2, "0")}
      </TableCell>
      <TableCell>
        <Link
          href={`/leads/${lead.id}`}
          className="block hover:text-brand-ink transition-colors max-w-md"
        >
          <div className="text-[14px] font-medium text-ink truncate">
            {lead.company_name}
          </div>
          {lead.signal_summary && (
            <div className="text-[12px] text-ink-dim mt-0.5 line-clamp-1 leading-snug">
              {lead.signal_summary}
            </div>
          )}
          {lead.assignment_notes && (
            <div className="mt-1.5 mono text-[10px] uppercase tracking-wider text-brand-ink/80 line-clamp-1">
              ◆ {lead.assignment_notes}
            </div>
          )}
        </Link>
      </TableCell>
      <TableCell>
        <ScoreBadge score={lead.score} size="sm" />
      </TableCell>
      <TableCell className="hidden lg:table-cell mono text-[12px] text-ink-2 truncate">
        {lead.location || <span className="text-ink-faint">—</span>}
      </TableCell>
      <TableCell>
        <StatusPill status={lead.status} />
      </TableCell>
      <TableCell className="hidden md:table-cell mono text-[11px] uppercase tracking-wider text-ink-faint">
        {formatRelative(lead.assigned_at)}
      </TableCell>
      <TableCell className="text-right">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/leads/${lead.id}`}>
            Open
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "border-signal-cold/40 text-signal-cold bg-signal-cold/[0.06]",
    assigned: "border-signal-warm/40 text-signal-warm bg-signal-warm/[0.06]",
    contacted: "border-signal-cold/40 text-signal-cold bg-signal-cold/[0.06]",
    meeting: "border-brand/45 text-brand-ink bg-brand/[0.06]",
    proposal: "border-brand/45 text-brand-ink bg-brand/[0.06]",
    won: "border-signal-good/40 text-signal-good bg-signal-good/[0.06]",
    dead: "border-line text-ink-faint",
  };
  const cls = map[status] || "border-line text-ink-dim";
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    </span>
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
        When the admin assigns a warehouse-expansion signal to you, it will
        appear here. Hold tight.
      </p>
    </div>
  );
}
