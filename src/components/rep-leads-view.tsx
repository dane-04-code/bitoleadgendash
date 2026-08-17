"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Columns3, Rows3 } from "lucide-react";
import type { RepInboxLead } from "@/lib/queries";
import {
  LEAD_STATUSES,
  REP_SETTABLE_STATUSES,
  type LeadStatus,
} from "@/lib/supabase/types";
import { KanbanBoard, type KanbanLead } from "@/components/kanban-board";
import { StatusSelector } from "@/components/status-selector";
import { ScoreBadge } from "@/components/ui/score-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, daysBetween, formatRelative, regionOf } from "@/lib/utils";

/** The two ways a rep can work their book. Board is the default. */
export type RepView = "board" | "inbox";

// A rep only ever holds owned leads, so drop the columns for unowned states
// (new / listed / returned) — they'd always be empty on the rep board.
const REP_BOARD_COLUMNS: LeadStatus[] = LEAD_STATUSES.filter(
  (s) => s !== "returned" && s !== "listed" && s !== "new"
);

export function RepLeadsView({
  leads,
  view,
}: {
  leads: RepInboxLead[];
  view: RepView;
}) {
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
        <SectionHeading view={view} count={0} />
        <div className="panel px-6 py-[46px] text-center">
          <div className="mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">
            No leads yet
          </div>
          <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-ink-dim">
            Nothing has been routed to you. Check the marketplace for leads you
            can claim, or set yourself as looking for work in your account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <SectionHeading view={view} count={leads.length} />
      {view === "inbox" ? (
        <RepInbox leads={leads} />
      ) : (
        <KanbanBoard
          columns={REP_BOARD_COLUMNS}
          buckets={buckets}
          droppable={REP_SETTABLE_STATUSES}
          showRep={false}
          emptyHint="No leads"
          filters
          regions={regions}
        />
      )}
    </section>
  );
}

function SectionHeading({ view, count }: { view: RepView; count: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-3">
      <h2 className="text-[15px] font-bold tracking-tight text-ink">
        {view === "inbox" ? "Your inbox" : "Your board"}
      </h2>
      <span className="text-[12px] text-ink-dim">
        {count === 0
          ? "nothing routed to you yet"
          : view === "inbox"
            ? `${count} lead${count === 1 ? "" : "s"} · hottest first`
            : `${count} lead${count === 1 ? "" : "s"} · drag to move a stage`}
      </span>
      <ViewToggle view={view} />
    </div>
  );
}

/**
 * Board / Inbox lives in the URL rather than component state: a rep opens a
 * lead and comes back, and the surface they chose is still the one they get.
 */
function ViewToggle({ view }: { view: RepView }) {
  return (
    <nav
      aria-label="Lead view"
      className="ml-auto flex shrink-0 items-center gap-0.5 self-center rounded-lg bg-surface p-0.5"
    >
      <ViewTab href="/my" label="Board" icon={Columns3} active={view === "board"} />
      <ViewTab
        href="/my?view=inbox"
        label="Inbox"
        icon={Rows3}
        active={view === "inbox"}
      />
    </nav>
  );
}

function ViewTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Columns3;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12.5px] transition-colors",
        active
          ? "bg-surface-3 font-semibold text-brand-deep"
          : "font-medium text-ink-faint hover:text-ink"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  );
}

// ───────────────────────── Inbox view ─────────────────────────

/**
 * The dense list the reps worked before the board replaced it. Same rows as the
 * manager's inbox, minus the columns a rep can't act on, plus the stage
 * dropdown — without it the list would be strictly worse than the board for the
 * one thing a rep does all day.
 */
function RepInbox({ leads }: { leads: RepInboxLead[] }) {
  return (
    <div className="panel">
      {/* Phones get a card list: a seven-column table at 390px is a
          horizontal-scroll trap, and reps work these on their phones. */}
      <ul className="sm:hidden">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="border-t border-line-soft p-[18px] first:border-t-0"
          >
            <Link
              href={`/leads/${lead.id}?from=inbox`}
              className="group block rounded-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[14.5px] font-bold leading-tight text-ink transition-colors group-hover:text-brand">
                  {lead.company_name}
                </span>
                <ScoreBadge score={lead.score} size="sm" showLabel={false} />
              </div>
              {lead.signal_summary && (
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-dim">
                  {lead.signal_summary}
                </p>
              )}
              {lead.assignment_notes && (
                <p className="mono mt-1.5 line-clamp-1 text-[10px] uppercase tracking-[0.08em] text-brand">
                  {lead.assignment_notes}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusChip status={lead.status} />
                {lead.location && (
                  <span className="text-[11px] text-ink-faint">
                    {lead.location}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-ink-faint">
                  {formatRelative(lead.assigned_at)}
                </span>
              </div>
            </Link>
            <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
              <StatusSelector
                leadId={lead.id}
                currentStatus={lead.status}
                role="rep"
                className="h-8 w-[136px] text-[12px]"
              />
              <Button asChild size="sm" variant="ghost" className="ml-auto">
                <Link href={`/leads/${lead.id}?from=inbox`}>
                  Open
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[34px]">
                <span className="sr-only">Row</span>
              </TableHead>
              <TableHead className="w-full">Company / Signal</TableHead>
              <TableHead className="w-[110px]">Score</TableHead>
              <TableHead className="w-[172px]">Stage</TableHead>
              <TableHead className="hidden lg:table-cell w-[150px]">
                Location
              </TableHead>
              <TableHead className="hidden xl:table-cell w-[110px]">
                Routed
              </TableHead>
              <TableHead className="w-[96px] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead, i) => {
              const closed = lead.status === "won" || lead.status === "dead";
              return (
                <TableRow key={lead.id} className={cn("group", closed && "opacity-70")}>
                  <TableCell className="mono text-[11px] text-ink-ghost">
                    {String(i + 1).padStart(2, "0")}
                  </TableCell>

                  {/* w-full + max-w-0 lets this cell absorb the leftover width
                      while still letting its children truncate. */}
                  <TableCell className="w-full max-w-0">
                    <Link
                      href={`/leads/${lead.id}?from=inbox`}
                      className="block rounded-sm"
                    >
                      <span className="block text-[14.5px] font-bold leading-tight text-ink transition-colors group-hover:text-brand">
                        {lead.company_name}
                      </span>
                      {lead.signal_summary && (
                        <span className="mt-[3px] block truncate text-[12.5px] leading-snug text-ink-dim">
                          {lead.signal_summary}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2 overflow-hidden whitespace-nowrap">
                      {lead.signal_type && (
                        <span className="mono shrink-0 rounded-sm bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-brand-ink">
                          {String(lead.signal_type).replace(/_/g, " ")}
                        </span>
                      )}
                      <span className="shrink-0 text-[10.5px] font-medium text-ink-faint">
                        {daysBetween(lead.updated_at || lead.assigned_at)}d in stage
                      </span>
                      {lead.assignment_notes && (
                        <span className="mono min-w-0 truncate text-[9.5px] uppercase tracking-[0.08em] text-brand">
                          {lead.assignment_notes}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ScoreBadge score={lead.score} size="sm" />
                  </TableCell>

                  <TableCell>
                    <StatusSelector
                      leadId={lead.id}
                      currentStatus={lead.status}
                      role="rep"
                      className="h-8 w-[148px] text-[12px]"
                    />
                  </TableCell>

                  <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-[12.5px] text-ink-2">
                    {lead.location || <span className="text-ink-ghost">—</span>}
                  </TableCell>

                  <TableCell className="hidden xl:table-cell whitespace-nowrap text-[12px] text-ink-2">
                    {formatRelative(lead.assigned_at)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/leads/${lead.id}?from=inbox`}>
                        Open
                        <ArrowUpRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
