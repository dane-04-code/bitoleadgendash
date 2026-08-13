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
import { PageHeader, MetaItem } from "@/components/page-header";

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
  const view: InboxView = VIEW_VALUES.includes(
    searchParams?.view as InboxView
  )
    ? (searchParams?.view as InboxView)
    : "active";
  const archived = view === "archived";
  const killed = view === "killed";
  const isNew = view === "new";

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

  // The "top signal" hero only makes sense for the full, unfiltered active inbox.
  const top = view === "active" && !filtersActive ? leads[0] : undefined;

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="01"
        eyebrow="Lead Intelligence Terminal / Inbox"
        title={
          <>
            Today&apos;s <span className="text-brand-ink">signals</span> across the GCC.
          </>
        }
        subtitle="Live warehouse-expansion intelligence, ranked. Triage the top of the stack first."
        meta={
          <>
            {/* Six, not seven: a 3-column mobile grid leaves an orphan at 7,
                and "Awaiting" largely restates "New today" + "Assigned". */}
            <MetaItem label="New today" value={stats.totalToday} accent />
            <MetaItem label="Hot · 80+" value={stats.hot} tone="warn" />
            <MetaItem label="Assigned" value={stats.assigned} />
            <MetaItem
              label="Live quotes"
              value={liveQuoteCount}
              hint="Quotes issued and still open"
            />
            <MetaItem label="Won" value={wonCount} tone="good" />
            <MetaItem label="Dead" value={killedCount} tone="bad" />
          </>
        }
      />

      {top && (
        <section
          aria-label="Highest scoring lead"
          className="mb-5 flex flex-col sm:flex-row sm:items-center gap-4 border border-line bg-surface lift-1 px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/leads/${top.id}?from=active`}
                className="text-[17px] font-bold leading-tight tracking-tight text-ink hover:text-brand transition-colors"
              >
                {top.company_name}
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-wider text-signal-warm border border-signal-warm/40 bg-signal-warm/[0.07] px-1.5 py-0.5">
                Top signal
              </span>
            </div>
            {top.signal_summary && (
              <p className="text-[12.5px] text-ink-dim mt-1 leading-snug line-clamp-2 max-w-3xl">
                {top.signal_summary}
              </p>
            )}
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1.5 text-[11px] text-ink-faint">
              {top.location && <span>{top.location}</span>}
              {top.industry && <span>· {top.industry}</span>}
              {top.signal_source &&
                (top.source_url ? (
                  <a
                    href={top.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                  >
                    via {top.signal_source}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : (
                  <span>via {top.signal_source}</span>
                ))}
              <span>· {formatRelative(top.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ScoreBadge score={top.score} size="default" />
            <AssignDialog
              leadId={top.id}
              leadName={top.company_name}
              reps={reps}
              currentRepName={top.rep_name ?? null}
              triggerVariant="default"
              triggerSize="sm"
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/leads/${top.id}?from=active`}>
                Open
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-3 gap-3 flex-wrap border-b border-line">
          <nav
            aria-label="Inbox views"
            className="flex items-end overflow-x-auto scrollbar-thin -mb-px"
          >
            <TabLink view="new" current={view} label="New this week" count={recentCount} />
            <TabLink view="active" current={view} label="Leads" count={activeCount} />
            <TabLink view="assigned" current={view} label="Assigned" count={assignedCount} />
            <TabLink view="returned" current={view} label="Returned" count={returnedCount} />
            <TabLink view="archived" current={view} label="Archived" count={archivedCount} />
            <TabLink view="killed" current={view} label="Killed" count={killedCount} />
          </nav>
          <Button asChild variant="ghost" size="sm" className="mb-1.5">
            <Link href="/pipeline">
              View pipeline
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <p className="sr-only" aria-live="polite">
          {VIEW_TITLES[view]} — {leads.length} lead{leads.length === 1 ? "" : "s"}
        </p>

        <LeadFilters industries={facets.industries} />

        {archived && (
          <div className="mb-4 border border-signal-warm/30 bg-signal-warm/[0.05] px-4 py-3">
            <div className="mono text-[10px] uppercase tracking-wider text-signal-warm">
              Archived signals
            </div>
            <p className="text-[12px] text-ink-dim mt-1 leading-relaxed max-w-2xl">
              These leads were filtered out of the inbox as noise — stale source
              articles, missing signal dates, and similar. The reason and when
              each was archived are shown per row, so the team can see what was
              removed and why.
            </p>
          </div>
        )}

        {killed && (
          <div className="mb-4 border border-signal-hot/30 bg-signal-hot/[0.05] px-4 py-3">
            <div className="mono text-[10px] uppercase tracking-wider text-signal-hot">
              Killed leads
            </div>
            <p className="text-[12px] text-ink-dim mt-1 leading-relaxed max-w-2xl">
              These leads were marked dead by a manager. They stay available here
              for review instead of disappearing from view.
            </p>
          </div>
        )}

        <div className="border border-line bg-surface lift-1">
          {leads.length === 0 ? (
            <EmptyInbox archived={archived} killed={killed} filtered={filtersActive} />
          ) : (
          <>
            {/* Phones get a card list: an eight-column table at 390px is a
                horizontal-scroll trap, and reps work these on their phones. */}
            <ul className="sm:hidden divide-y divide-line">
              {leads.map((lead) => (
                <li key={lead.id} className="p-3">
                  <Link
                    href={`/leads/${lead.id}?from=${view}`}
                    className="block group"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <span className="text-[14px] font-semibold text-ink leading-snug group-hover:text-brand transition-colors">
                        {lead.company_name}
                      </span>
                      <ScoreBadge score={lead.score} size="sm" showLabel={false} />
                    </div>
                    {lead.signal_summary && (
                      <p className="text-[12px] text-ink-dim mt-1 line-clamp-2 leading-snug">
                        {lead.signal_summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <StatusPill status={lead.status} repName={lead.rep_name} />
                      {lead.location && (
                        <span className="text-[11px] text-ink-faint">
                          {lead.location}
                        </span>
                      )}
                      <span className="text-[11px] text-ink-faint ml-auto">
                        {formatRelative(lead.created_at)}
                      </span>
                    </div>
                  </Link>
                  {!archived && !killed && (
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-line">
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
                          <ArrowUpRight className="h-3 w-3" />
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
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-[280px]">Company / Signal</TableHead>
                  <TableHead className="w-[96px]">Score</TableHead>
                  {archived ? (
                    <>
                      <TableHead className="hidden sm:table-cell w-[220px]">Reason</TableHead>
                      <TableHead className="hidden lg:table-cell w-[130px]">Archived</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="hidden xl:table-cell w-[120px]">Source</TableHead>
                      <TableHead className="hidden lg:table-cell w-[130px]">Location</TableHead>
                      <TableHead className="hidden 2xl:table-cell w-[150px]">Industry</TableHead>
                    </>
                  )}
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="text-right w-[170px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, i) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="text-center mono text-[11px] text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/leads/${lead.id}?from=${view}`}
                        className="block hover:text-brand transition-colors max-w-md"
                      >
                        <div className="text-[13.5px] font-semibold text-ink truncate">
                          {lead.company_name}
                        </div>
                        {lead.signal_summary && (
                          <div className="text-[12px] text-ink-dim mt-0.5 line-clamp-1 leading-snug">
                            {lead.signal_summary}
                          </div>
                        )}
                        {/* One nowrap line. Left to wrap, this meta strip
                            doubled every row's height in a narrow column. */}
                        <div className="flex items-center gap-2 mt-1 mono text-[10px] uppercase tracking-wider text-ink-faint whitespace-nowrap overflow-hidden">
                          {lead.signal_type && (
                            <span className="text-brand shrink-0">
                              {String(lead.signal_type).replace(/_/g, " ")}
                            </span>
                          )}
                          <span className="shrink-0">
                            {formatRelative(lead.created_at)}
                          </span>
                          {lead.last_article_check && (
                            <span
                              className={cn(
                                "shrink-0 hidden lg:inline-flex items-center gap-1",
                                articleCheckClass(lead.last_article_check)
                              )}
                              title={`Source article last re-verified ${formatRelative(
                                lead.last_article_check
                              )}`}
                            >
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                              article
                            </span>
                          )}
                          {lead.rep_name && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <CornerDownRight
                                className="h-3 w-3 shrink-0"
                                strokeWidth={2}
                              />
                              {lead.rep_name}
                            </span>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={lead.score} size="sm" />
                    </TableCell>
                    {archived ? (
                      <>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center border border-signal-warm/40 bg-signal-warm/[0.07] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal-warm">
                            {archivedReasonLabel(lead.archived_reason)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell mono text-[12px] text-ink-2">
                          {lead.archived_at ? (
                            formatRelative(lead.archived_at)
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="hidden xl:table-cell mono text-[12px]">
                          <SourceLink source={lead.signal_source} url={lead.source_url} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell mono text-[12px] text-ink-2 truncate">
                          {lead.location || <span className="text-ink-faint">—</span>}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell mono text-[12px] text-ink-2 truncate">
                          {lead.industry || <span className="text-ink-faint">—</span>}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <StatusPill status={lead.status} repName={lead.rep_name} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
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
                            <KillLeadButton leadId={lead.id} leadName={lead.company_name} />
                          </>
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/leads/${lead.id}?from=${view}`}>
                            Open
                            <ArrowUpRight className="h-3 w-3" />
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
      </section>
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
      className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[12.5px] border-b-2 transition-colors ${
        active
          ? "border-brand text-ink font-semibold"
          : "border-transparent text-ink-dim hover:text-ink"
      }`}
    >
      {label}
      <span
        className={`mono text-[11px] tabular ${
          active ? "text-brand" : "text-ink-faint"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function SourceLink({
  source,
  url,
}: {
  source: string | null;
  url: string | null;
}) {
  if (!source && !url) return <span className="text-ink-faint">—</span>;
  const label = source || "source";
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open source · ${label}`}
        className="inline-flex items-center gap-1 text-ink-2 hover:text-brand-ink transition-colors max-w-[120px]"
      >
        <span className="truncate">{label}</span>
        <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />
      </a>
    );
  }
  return <span className="text-ink-2 truncate block max-w-[120px]">{label}</span>;
}

function StatusPill({
  status,
  repName,
}: {
  status: string;
  repName?: string | null;
}) {
  // Filled chips. A column of hairline outlines all reads the same at a glance;
  // a filled block gives each stage its own weight down the page.
  const map: Record<string, string> = {
    new: "bg-signal-cold text-white",
    listed: "bg-brand text-white",
    assigned: "bg-signal-warm text-white",
    contacted: "bg-signal-cold text-white",
    meeting: "bg-brand text-white",
    quote: "bg-brand-ink text-white",
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
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${cls}`}
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
  if (filtered) {
    return (
      <div className="px-6 py-20 text-center">
        <div className="display-serif text-6xl text-ink-faint/30 mb-3">∅</div>
        <h3 className="display-serif text-2xl text-ink mb-2">No matches.</h3>
        <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
          No leads match the current filters. Try clearing the search, status,
          industry or score filters.
        </p>
      </div>
    );
  }
  return (
    <div className="px-6 py-20 text-center">
      <div className="display-serif text-6xl text-ink-faint/30 mb-3">∅</div>
      <h3 className="display-serif text-2xl text-ink mb-2">
        {archived
          ? "Nothing archived."
          : killed
            ? "Nothing killed."
            : "Quiet on the wires."}
      </h3>
      <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
        {archived
          ? "Rejected leads will appear here when the pipeline filters them out — for example when a source article fails the freshness check."
          : killed
            ? "Leads killed by a manager will appear here for review."
            : "New warehouse signals from across the GCC will appear here as they are detected by the intelligence pipeline."}
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
