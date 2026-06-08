import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDashboardStats, getLeadInbox, getActiveReps } from "@/lib/queries";
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
import { LEAD_STATUS_LABELS } from "@/lib/supabase/types";
import { formatRelative } from "@/lib/utils";
import { AssignDialog } from "@/components/assign-dialog";
import { PageHeader, MetaItem } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [stats, leads, reps] = await Promise.all([
    getDashboardStats(),
    getLeadInbox(60),
    getActiveReps(),
  ]);

  const top = leads[0];

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
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="display-serif text-2xl text-ink leading-none">
              The Inbox
            </h2>
            <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
              {leads.length} signals
            </span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pipeline">
              View pipeline
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="border border-line bg-surface">
          {leads.length === 0 ? (
            <EmptyInbox />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Company / Signal</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  <TableHead className="hidden lg:table-cell w-[140px]">Location</TableHead>
                  <TableHead className="hidden xl:table-cell w-[140px]">Industry</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
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
                          {lead.rep_name && (
                            <span>→ {lead.rep_name}</span>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={lead.score} size="sm" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell mono text-[12px] text-ink-2 truncate">
                      {lead.location || <span className="text-ink-faint">—</span>}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell mono text-[12px] text-ink-2 truncate">
                      {lead.industry || <span className="text-ink-faint">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={lead.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <AssignDialog
                          leadId={lead.id}
                          leadName={lead.company_name}
                          reps={reps}
                          currentRepName={lead.rep_name ?? null}
                          triggerSize="sm"
                          triggerVariant="ghost"
                        />
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
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    </span>
  );
}

function EmptyInbox() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="display-serif text-6xl text-ink-faint/30 mb-3">∅</div>
      <h3 className="display-serif text-2xl text-ink mb-2">Quiet on the wires.</h3>
      <p className="text-[13px] text-ink-dim max-w-sm mx-auto leading-relaxed">
        New warehouse signals from across the GCC will appear here as they are
        detected by the intelligence pipeline.
      </p>
    </div>
  );
}
