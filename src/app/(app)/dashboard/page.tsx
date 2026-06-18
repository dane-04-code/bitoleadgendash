import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  getDashboardStats,
  getLeadInbox,
  getActiveReps,
  getActiveLeadCount,
  getArchivedLeadCount,
  getRecentLeadCount,
  getLeadFilterFacets,
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
import { formatRelative, daysBetween, firstName } from "@/lib/utils";
import { AssignDialog } from "@/components/assign-dialog";
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
  const view: InboxView =
    searchParams?.view === "archived"
      ? "archived"
      : searchParams?.view === "new"
        ? "new"
        : "active";
  const archived = view === "archived";
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

  const [stats, leads, reps, activeCount, archivedCount, recentCount, facets] =
    await Promise.all([
      getDashboardStats(),
      getLeadInbox(60, view, filters),
      getActiveReps(),
      getActiveLeadCount(),
      getArchivedLeadCount(),
      getRecentLeadCount(),
      getLeadFilterFacets(),
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
            <MetaItem label="Reps online" value={reps.length} />
            <MetaItem label="Total tracked" value={leads.length} />
            <MetaItem label="Region" value="GCC · UAE / KSA / QAT" />
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-line divide-x divide-line bg-surface mb-10">
        <Stat label="New today"        value={stats.totalToday} accent="ink" />
        <Stat label="Hot leads · 80+"  value={stats.hot}        accent="hot" trend />
        <Stat label="Assigned"         value={stats.assigned}   accent="good" />
        <Stat label="Awaiting"         value={stats.awaiting}   accent="warm" />
      </section>

      {top && (
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start border border-line bg-surface p-6 corner-marks">
          <div className="min-w-0">
            <div className="eyebrow text-brand-ink mb-3">
              Top Signal · Highest Score
            </div>
            <Link
              href={`/leads/${top.id}`}
              className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-ink hover:text-brand-ink transition-colors"
            >
              {top.company_name}
            </Link>
            {top.signal_summary && (
              <p className="text-[13px] text-ink-dim mt-3 leading-relaxed max-w-2xl">
                {top.signal_summary}
              </p>
            )}
            <div className="flex items-center gap-x-6 gap-y-1 flex-wrap mt-4 mono text-[11px] uppercase tracking-wider text-ink-faint">
              {top.location && <span>{top.location}</span>}
              {top.industry && <span>{top.industry}</span>}
              {top.signal_type && (
                <span className="text-brand-ink">
                  {String(top.signal_type).replace(/_/g, " ")}
                </span>
              )}
              {top.signal_source &&
                (top.source_url ? (
                  <a
                    href={top.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-brand-ink transition-colors"
                  >
                    via {top.signal_source}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : (
                  <span>via {top.signal_source}</span>
                ))}
              <span>{formatRelative(top.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
            <ScoreBadge score={top.score} size="lg" />
            <div className="flex items-center gap-2">
              <AssignDialog
                leadId={top.id}
                leadName={top.company_name}
                reps={reps}
                currentRepName={top.rep_name ?? null}
                triggerVariant="default"
              />
              <Button asChild variant="outline" size="default">
                <Link href={`/leads/${top.id}`}>
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="display-serif text-2xl text-ink leading-none">
              {archived ? "Archived" : isNew ? "New this week" : "The Inbox"}
            </h2>
            <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
              {isNew
                ? `${leads.length} ${
                    leads.length === 1 ? "signal" : "signals"
                  } from the last 7 days`
                : `${leads.length} ${archived ? "archived" : "signals"}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-line rounded-sm overflow-hidden mono text-[10px] uppercase tracking-wider">
              <Link
                href="/dashboard?view=new"
                className={`px-3 py-1.5 transition-colors ${
                  isNew
                    ? "bg-brand/[0.08] text-brand-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                New this week ({recentCount})
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 border-l border-line transition-colors ${
                  view === "active"
                    ? "bg-brand/[0.08] text-brand-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                Leads ({activeCount})
              </Link>
              <Link
                href="/dashboard?view=archived"
                className={`px-3 py-1.5 border-l border-line transition-colors ${
                  archived
                    ? "bg-brand/[0.08] text-brand-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                Archive ({archivedCount})
              </Link>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pipeline">
                View pipeline
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

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

        <div className="border border-line bg-surface">
          {leads.length === 0 ? (
            <EmptyInbox archived={archived} filtered={filtersActive} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Company / Signal</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  {archived ? (
                    <>
                      <TableHead className="hidden sm:table-cell w-[220px]">Reason</TableHead>
                      <TableHead className="hidden lg:table-cell w-[130px]">Archived</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="hidden sm:table-cell w-[130px]">Source</TableHead>
                      <TableHead className="hidden lg:table-cell w-[140px]">Location</TableHead>
                      <TableHead className="hidden xl:table-cell w-[140px]">Industry</TableHead>
                    </>
                  )}
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="text-right w-[180px]">Action</TableHead>
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
                        <div className="flex items-center gap-3 mt-1.5 mono text-[10px] uppercase tracking-wider text-ink-faint">
                          {lead.signal_type && (
                            <span className="text-brand-ink/80">
                              {String(lead.signal_type).replace(/_/g, " ")}
                            </span>
                          )}
                          <span>{formatRelative(lead.created_at)}</span>
                          {lead.last_article_check && (
                            <span
                              className={articleCheckClass(lead.last_article_check)}
                              title="Source article last re-verified"
                            >
                              article ✓ {formatRelative(lead.last_article_check)}
                            </span>
                          )}
                          {lead.rep_name && (
                            <span>→ {lead.rep_name}</span>
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
                          <span className="inline-flex items-center rounded-sm border border-signal-warm/40 bg-signal-warm/[0.06] px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider text-signal-warm">
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
                        <TableCell className="hidden sm:table-cell mono text-[12px]">
                          <SourceLink source={lead.signal_source} url={lead.source_url} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell mono text-[12px] text-ink-2 truncate">
                          {lead.location || <span className="text-ink-faint">—</span>}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell mono text-[12px] text-ink-2 truncate">
                          {lead.industry || <span className="text-ink-faint">—</span>}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <StatusPill status={lead.status} repName={lead.rep_name} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        {!archived && (
                          <AssignDialog
                            leadId={lead.id}
                            leadName={lead.company_name}
                            reps={reps}
                            currentRepName={lead.rep_name ?? null}
                            triggerSize="sm"
                            triggerVariant="ghost"
                          />
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/leads/${lead.id}`}>
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
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  trend,
}: {
  label: string;
  value: number;
  accent: "ink" | "hot" | "warm" | "good" | "cold";
  trend?: boolean;
}) {
  const colorMap: Record<typeof accent, string> = {
    ink: "text-ink",
    hot: "text-signal-hot",
    warm: "text-signal-warm",
    good: "text-signal-good",
    cold: "text-signal-cold",
  };
  return (
    <div className="px-5 sm:px-6 py-5 sm:py-6 relative">
      <div className="eyebrow mb-3">{label}</div>
      <div className="flex items-baseline gap-3">
        <span
          className={`display-number text-5xl sm:text-6xl ${colorMap[accent]}`}
        >
          {value}
        </span>
        {trend && (
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            ↗ live
          </span>
        )}
      </div>
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
  const baseLabel =
    LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status;
  // When a lead is assigned to a rep, name them: "Assigned to Layla".
  const label =
    status === "assigned" && repName
      ? `Assigned to ${firstName(repName)}`
      : baseLabel;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

function EmptyInbox({
  archived,
  filtered,
}: {
  archived?: boolean;
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
        {archived ? "Nothing archived." : "Quiet on the wires."}
      </h3>
      <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
        {archived
          ? "Rejected leads will appear here when the pipeline filters them out — for example when a source article fails the freshness check."
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
