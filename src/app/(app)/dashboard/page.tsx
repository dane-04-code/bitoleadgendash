import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CornerDownRight } from "lucide-react";
import {
  getDashboardStats,
  getLeadInbox,
  getActiveReps,
  getActiveLeadCount,
  getArchivedLeadCount,
  getKilledLeadCount,
  getRecentLeadCount,
  getAssignedLeadCount,
  getReturnedLeadCount,
  getLeadFilterFacets,
  getLiveQuoteCount,
  getWonLeadCount,
  hasFilters,
} from "@/lib/queries";
import type { InboxView, LeadInboxFilters } from "@/lib/queries";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Button } from "@/components/ui/button";
import { LeadFilters } from "@/components/lead-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  archivedReasonLabel,
  type LeadStatus,
} from "@/lib/supabase/types";
import { cn, formatRelative, daysBetween, firstName } from "@/lib/utils";
import { AssignDialog } from "@/components/assign-dialog";
import { KillLeadButton } from "@/components/kill-lead-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    view?: string;
    q?: string;
    status?: string;
    industry?: string;
    minScore?: string;
  };
}) {
  const VIEW_VALUES: InboxView[] = [
    "active",
    "archived",
    "killed",
    "new",
    "listed",
    "assigned",
    "returned",
  ];
  const view: InboxView = VIEW_VALUES.includes(searchParams?.view as InboxView)
    ? (searchParams?.view as InboxView)
    : "active";
  const archived = view === "archived";
  const killed = view === "killed";

  const statusParam = searchParams?.status as LeadStatus | undefined;
  const filters: LeadInboxFilters = {
    q: searchParams?.q || undefined,
    status: LEAD_STATUSES.includes(statusParam as LeadStatus)
      ? statusParam
      : undefined,
    industry: searchParams?.industry || undefined,
    minScore: searchParams?.minScore ? Number(searchParams.minScore) : undefined,
  };
  const filtersActive = hasFilters(filters);

  const [
    stats,
    leads,
    reps,
    activeCount,
    archivedCount,
    killedCount,
    recentCount,
    assignedCount,
    returnedCount,
    facets,
    liveQuoteCount,
    wonCount,
  ] = await Promise.all([
    getDashboardStats(),
    getLeadInbox(60, view, filters),
    getActiveReps(),
    getActiveLeadCount(),
    getArchivedLeadCount(),
    getKilledLeadCount(),
    getRecentLeadCount(),
    getAssignedLeadCount(),
    getReturnedLeadCount(),
    getLeadFilterFacets(),
    getLiveQuoteCount(),
    getWonLeadCount(),
  ]);

  return (
    <div>
      <h1 className="sr-only">Inbox — today&apos;s signals across the GCC</h1>

      {/* The page numeral and the counter strip read as one line, the way the
          comp sets them: the figure anchors the left edge, the numbers run
          along the baseline beside it. */}
      <header className="flex items-center gap-5 sm:gap-[22px] mb-5">
        <span
          aria-hidden
          className="display-number hidden sm:block shrink-0 text-[62px] leading-[0.85] text-line-strong"
        >
          01
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-8 gap-y-4 lg:gap-x-10">
          <Stat label="New today" value={stats.totalToday} />
          <Stat label="Hot · 80+" value={stats.hot} tone="brand" />
          <Stat label="Assigned" value={stats.assigned} />
          <Stat
            label="Live quotes"
            value={liveQuoteCount}
            hint="Quotes issued and still open"
          />
          <Stat label="Won" value={wonCount} />
          <Stat label="Dead" value={killedCount} tone="quiet" />
        </div>
      </header>

      <div className="h-px bg-line mb-4" />

      <div className="flex items-baseline gap-4 mb-[18px]">
        <nav
          aria-label="Inbox views"
          className="flex flex-1 min-w-0 items-baseline gap-6 overflow-x-auto scrollbar-thin"
        >
          <TabLink view="new" current={view} label="New this week" count={recentCount} />
          <TabLink view="active" current={view} label="Leads" count={activeCount} />
          <TabLink view="assigned" current={view} label="Assigned" count={assignedCount} />
          <TabLink view="returned" current={view} label="Returned" count={returnedCount} />
          <TabLink view="archived" current={view} label="Archived" count={archivedCount} />
          <TabLink view="killed" current={view} label="Killed" count={killedCount} />
        </nav>
        <Link
          href="/pipeline"
          className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-sm text-[12.5px] font-semibold text-brand transition-colors hover:text-brand-deep"
        >
          View pipeline
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <LeadFilters industries={facets.industries} />

      <p className="sr-only" aria-live="polite">
        {VIEW_TITLES[view]} — {leads.length} lead{leads.length === 1 ? "" : "s"}
      </p>

      {archived && (
        <Note tone="warn" title="Archived signals">
          These leads were filtered out of the inbox as noise — stale source
          articles, missing signal dates, and similar. The reason and when each
          was archived are shown per row, so the team can see what was removed
          and why.
        </Note>
      )}

      {killed && (
        <Note tone="bad" title="Killed leads">
          These leads were marked dead by a manager. They stay available here for
          review instead of disappearing from view.
        </Note>
      )}

      <div className="panel">
        {leads.length === 0 ? (
          <EmptyInbox archived={archived} killed={killed} filtered={filtersActive} />
        ) : (
          <>
            {/* Phones get a card list: an eight-column table at 390px is a
                horizontal-scroll trap, and reps work these on their phones. */}
            <ul className="sm:hidden">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="border-t border-line-soft p-[18px] first:border-t-0"
                >
                  <Link
                    href={`/leads/${lead.id}?from=${view}`}
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusChip status={lead.status} repName={lead.rep_name} />
                      {lead.location && (
                        <span className="text-[11px] text-ink-faint">
                          {lead.location}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-ink-faint">
                        {formatRelative(lead.created_at)}
                      </span>
                    </div>
                  </Link>
                  {!archived && !killed && (
                    <div className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-3">
                      <AssignDialog
                        leadId={lead.id}
                        leadName={lead.company_name}
                        reps={reps}
                        currentRepName={lead.rep_name ?? null}
                        triggerSize="sm"
                        triggerVariant="secondary"
                      />
                      <KillLeadButton leadId={lead.id} leadName={lead.company_name} />
                      <Button asChild size="sm" variant="ghost" className="ml-auto">
                        <Link href={`/leads/${lead.id}?from=${view}`}>
                          Open
                          <ArrowUpRight className="h-3 w-3" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  )}
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
                    {archived ? (
                      <>
                        <TableHead className="hidden lg:table-cell w-[200px]">
                          Reason
                        </TableHead>
                        <TableHead className="hidden xl:table-cell w-[120px]">
                          Archived
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="hidden xl:table-cell w-[120px]">
                          Source
                        </TableHead>
                        <TableHead className="hidden lg:table-cell w-[150px]">
                          Location
                        </TableHead>
                        <TableHead className="hidden 2xl:table-cell w-[150px]">
                          Industry
                        </TableHead>
                      </>
                    )}
                    <TableHead className="w-[150px] text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, i) => (
                    <TableRow key={lead.id} className="group relative">
                      <TableCell className="mono text-[11px] text-ink-ghost">
                        {String(i + 1).padStart(2, "0")}
                      </TableCell>

                      {/* w-full + max-w-0 lets this cell absorb the leftover
                          width while still letting its children truncate —
                          without it the meta strip pushes the action column
                          off the right edge below 1600px. */}
                      <TableCell className="w-full max-w-0">
                        <Link
                          href={`/leads/${lead.id}?from=${view}`}
                          className="stretch-link block rounded-sm"
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
                        {/* One nowrap line. Left to wrap, this meta strip
                            doubled every row's height in a narrow column. */}
                        <div className="mt-1.5 flex items-center gap-2 overflow-hidden whitespace-nowrap">
                          <StatusChip status={lead.status} repName={lead.rep_name} />
                          {lead.signal_type && (
                            <span className="mono shrink-0 rounded-sm bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-brand-ink">
                              {String(lead.signal_type).replace(/_/g, " ")}
                            </span>
                          )}
                          <span className="shrink-0 text-[10.5px] font-medium text-ink-faint">
                            {formatRelative(lead.created_at)}
                          </span>
                          {lead.last_article_check && (
                            <span
                              className={cn(
                                "mono hidden shrink-0 items-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.06em] lg:inline-flex",
                                articleCheckClass(lead.last_article_check)
                              )}
                              title={`Source article last re-verified ${formatRelative(
                                lead.last_article_check
                              )}`}
                            >
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                              Article
                            </span>
                          )}
                          {lead.rep_name && (
                            <span className="inline-flex min-w-0 items-center gap-1 text-[10.5px] font-medium text-ink-faint">
                              <CornerDownRight
                                className="h-3 w-3 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span className="truncate">{lead.rep_name}</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <ScoreBadge score={lead.score} size="sm" />
                      </TableCell>

                      {archived ? (
                        <>
                          <TableCell className="hidden lg:table-cell">
                            <span className="mono inline-flex rounded-sm bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-dim">
                              {archivedReasonLabel(lead.archived_reason)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-[12px] text-ink-2">
                            {lead.archived_at ? (
                              formatRelative(lead.archived_at)
                            ) : (
                              <span className="text-ink-ghost">—</span>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="hidden xl:table-cell">
                            <SourceLink source={lead.signal_source} url={lead.source_url} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-[12.5px] text-ink-2">
                            {lead.location || <span className="text-ink-ghost">—</span>}
                          </TableCell>
                          <TableCell className="mono hidden max-w-[150px] truncate text-[11.5px] text-ink-faint 2xl:table-cell">
                            {lead.industry || <span className="text-ink-ghost">—</span>}
                          </TableCell>
                        </>
                      )}

                      {/* Above the stretched row link, so these stay clickable. */}
                      <TableCell className="relative whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {!archived && !killed && (
                            <>
                              <AssignDialog
                                leadId={lead.id}
                                leadName={lead.company_name}
                                reps={reps}
                                currentRepName={lead.rep_name ?? null}
                                triggerSize="sm"
                                triggerVariant="ghost"
                              />
                              <KillLeadButton
                                leadId={lead.id}
                                leadName={lead.company_name}
                              />
                            </>
                          )}
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/leads/${lead.id}?from=${view}`}>
                              Open
                              <ArrowUpRight className="h-3 w-3" aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const VIEW_TITLES: Record<InboxView, string> = {
  active: "The Inbox",
  new: "New this week",
  unassigned: "Unassigned",
  listed: "On the marketplace",
  assigned: "Assigned",
  returned: "Returned",
  archived: "Archived",
  killed: "Killed",
};

/** A counter in the header strip: mono label above a condensed figure. */
function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "brand" | "quiet";
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint",
          hint && "cursor-help"
        )}
        title={hint}
      >
        {label}
      </span>
      <span
        className={cn(
          "display-number text-[34px] leading-none tabular",
          tone === "brand"
            ? "text-brand-ink"
            : tone === "quiet"
              ? "text-ink-faint"
              : "text-ink"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TabLink({
  view,
  current,
  label,
  count,
}: {
  view: InboxView;
  current: InboxView;
  label: string;
  count: number;
}) {
  const active = current === view;
  const href = view === "active" ? "/dashboard" : `/dashboard?view=${view}`;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 text-[13.5px] transition-colors",
        active
          ? "border-brand font-bold text-ink"
          : "border-transparent font-medium text-ink-faint hover:text-ink"
      )}
    >
      {label}
      <span
        className={cn(
          "mono text-[11px] tabular",
          active ? "font-semibold text-brand" : "text-ink-ghost"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function Note({
  tone,
  title,
  children,
}: {
  tone: "warn" | "bad";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-lg px-4 py-3.5",
        tone === "warn" ? "bg-signal-warm/[0.09]" : "bg-signal-hot/[0.08]"
      )}
    >
      <div
        className={cn(
          "mono text-[9.5px] font-semibold uppercase tracking-[0.13em]",
          tone === "warn" ? "text-signal-warm" : "text-signal-hot"
        )}
      >
        {title}
      </div>
      <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-dim">
        {children}
      </p>
    </div>
  );
}

function SourceLink({
  source,
  url,
}: {
  source: string | null;
  url: string | null;
}) {
  if (!source && !url) return <span className="text-ink-ghost">—</span>;
  const label = source || "source";
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open source · ${label}`}
        className="relative inline-flex max-w-[120px] items-center gap-1 rounded-sm text-[12px] font-medium text-brand transition-colors hover:text-brand-deep"
      >
        <span className="truncate">{label}</span>
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
      </a>
    );
  }
  return (
    <span className="block max-w-[120px] truncate text-[12px] font-medium text-ink-2">
      {label}
    </span>
  );
}

/**
 * Stage chip. The teal ramp is one hue, so the stage word always ships — the
 * tint narrows it down, the label states it.
 */
function StatusChip({
  status,
  repName,
}: {
  status: string;
  repName?: string | null;
}) {
  const map: Record<string, string> = {
    new: "bg-brand-bg text-brand-deep",
    listed: "bg-brand text-white",
    assigned: "bg-brand-soft text-white",
    contacted: "bg-brand text-white",
    meeting: "bg-brand-ink text-white",
    quote: "bg-brand-deep text-white",
    won: "bg-signal-good text-white",
    dead: "bg-ink-faint text-white",
    returned: "bg-signal-hot text-white",
  };
  const cls = map[status] || "bg-ink-faint text-white";
  const baseLabel =
    LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status;
  // When a lead is assigned to a rep, name them: "Assigned to Layla".
  const label =
    status === "assigned" && repName
      ? `Assigned to ${firstName(repName)}`
      : baseLabel;
  return (
    <span
      className={cn(
        "mono inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap",
        cls
      )}
    >
      {label}
    </span>
  );
}

function EmptyInbox({
  archived,
  killed,
  filtered,
}: {
  archived?: boolean;
  killed?: boolean;
  filtered?: boolean;
}) {
  const [eyebrow, body] = filtered
    ? [
        "Nothing matches",
        "No leads match the current filters. Clear the search, status, industry or score filter to see the full sweep.",
      ]
    : archived
      ? [
          "Nothing archived",
          "Rejected leads appear here when the pipeline filters them out — for example when a source article fails the freshness check.",
        ]
      : killed
        ? [
            "Nothing killed",
            "Leads killed by a manager appear here for review.",
          ]
        : [
            "Quiet on the wires",
            "New warehouse signals from across the GCC appear here as the intelligence pipeline detects them.",
          ];

  return (
    <div className="px-6 py-[46px] text-center">
      <div className="mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        {eyebrow}
      </div>
      <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-ink-dim">
        {body}
      </p>
    </div>
  );
}

// Article verification freshness: flag when the last re-check is itself getting
// old, so the team knows the freshness signal can't be fully trusted.
function articleCheckClass(checkedAt: string): string {
  const days = daysBetween(checkedAt);
  if (days > 30) return "text-signal-warm";
  return "text-ink-faint";
}
