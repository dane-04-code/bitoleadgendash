import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getCurrentRepId } from "@/lib/auth";
import { getLeadsForRep, getRepById, getRepStats, type RepInboxLead } from "@/lib/queries";
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
import { PageHeader, MetaItem } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyPage() {
  const repId = await getCurrentRepId();
  if (!repId) redirect("/login");

  const [rep, leads, stats] = await Promise.all([
    getRepById(repId),
    getLeadsForRep(repId),
    getRepStats(repId),
  ]);

  if (!rep) {
    // Account was deleted while logged in
    redirect("/api/auth/logout");
  }

  const firstName = rep.full_name.split(/\s+/)[0] || rep.full_name;

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="A"
        eyebrow={`Sales rep · ${rep.full_name}`}
        title={
          <>
            Welcome back, <em className="text-brand-ink">{firstName}</em>.
          </>
        }
        subtitle="The leads routed to you. Triage, work them, update their status as they move."
        meta={
          <>
            <MetaItem label="Open" value={stats.open} accent />
            <MetaItem label="Hot" value={stats.hot} />
            <MetaItem label="Won" value={stats.won} />
            <MetaItem label="Total assigned" value={stats.total} />
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-line divide-x divide-line bg-surface mb-10">
        <Stat label="In play" value={stats.open} accent="ink" />
        <Stat label="Hot · 80+" value={stats.hot} accent="hot" />
        <Stat label="Won" value={stats.won} accent="good" />
        <Stat label="Dead" value={stats.dead} accent="faint" />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="display-serif text-2xl text-ink leading-none">
              Your leads
            </h2>
            <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
              {leads.length} routed to you
            </span>
          </div>
        </div>

        <div className="border border-line bg-surface">
          {leads.length === 0 ? (
            <Empty />
          ) : (
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
          )}
        </div>
      </section>
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "ink" | "hot" | "warm" | "good" | "cold" | "faint";
}) {
  const colorMap: Record<typeof accent, string> = {
    ink: "text-ink",
    hot: "text-signal-hot",
    warm: "text-signal-warm",
    good: "text-signal-good",
    cold: "text-signal-cold",
    faint: "text-ink-faint",
  };
  return (
    <div className="px-5 sm:px-6 py-5 sm:py-6">
      <div className="eyebrow mb-3">{label}</div>
      <div className={`display-number text-5xl sm:text-6xl ${colorMap[accent]}`}>
        {value}
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
