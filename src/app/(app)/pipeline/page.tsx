import Link from "next/link";
import { getPipelineLeads, type PipelineLead } from "@/lib/queries";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";
import { ScoreBadge } from "@/components/ui/score-badge";
import { PageHeader, MetaItem } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COLUMN_DOT: Record<LeadStatus, string> = {
  new: "bg-signal-cold",
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
  assigned: "02",
  contacted: "03",
  meeting: "04",
  proposal: "05",
  won: "06",
  dead: "07",
  returned: "08",
};

export default async function PipelinePage() {
  const buckets = await getPipelineLeads();
  const total = LEAD_STATUSES.reduce((sum, s) => sum + buckets[s].length, 0);
  const won = buckets.won.length;
  // "In pipeline" excludes closed-out (dead) and rep-returned leads.
  const inPipeline = total - buckets.dead.length - buckets.returned.length;
  const winRate =
    inPipeline > 0 ? Math.round((won / Math.max(1, inPipeline)) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="02"
        eyebrow="Lead Intelligence Terminal / Pipeline"
        title={
          <>
            The deal <em className="text-brand-ink">flow</em>.
          </>
        }
        subtitle="Every active lead, plotted across each sales stage. Days indicate how long a lead has been sitting in its current stage. Returned leads have been sent back by a rep for re-routing."
        meta={
          <>
            <MetaItem label="In pipeline" value={inPipeline} />
            <MetaItem label="Won" value={won} />
            <MetaItem label="Win rate" value={`${winRate}%`} accent />
            <MetaItem label="Returned" value={buckets.returned.length} />
          </>
        }
      />

      <div className="overflow-x-auto -mx-5 sm:-mx-8 lg:-mx-10 px-5 sm:px-8 lg:px-10 scrollbar-thin pb-3">
        <div className="flex gap-3 min-w-max">
          {LEAD_STATUSES.map((status) => (
            <Column key={status} status={status} leads={buckets[status]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Column({ status, leads }: { status: LeadStatus; leads: PipelineLead[] }) {
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
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: PipelineLead }) {
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

      <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-ink-faint border-t border-line pt-2">
        <span className="truncate">
          {lead.rep_name || <span className="italic">unassigned</span>}
        </span>
        <span
          className={cn(
            "tabular shrink-0",
            lead.days_in_stage > 14 && "text-signal-warm",
            lead.days_in_stage > 30 && "text-signal-hot"
          )}
        >
          {lead.days_in_stage}d
        </span>
      </div>
    </Link>
  );
}
