import { getPipelineLeads, getActiveReps } from "@/lib/queries";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";
import { StatStrip, Stat } from "@/components/stat-strip";
import { KanbanBoard, type KanbanLead } from "@/components/kanban-board";
import { daysBetween, regionOf } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Stages the admin may set by dragging. `listed` is owned by the marketplace
 * toggle and `returned` is a rep action, so both stay read-only on the board
 * rather than silently doing something different from what a drag implies.
 */
const DROPPABLE: LeadStatus[] = [
  "new",
  "assigned",
  "contacted",
  "meeting",
  "quote",
  "won",
  "dead",
];

/** The stages the mix bar accounts for — open work, not decided outcomes. */
const MIX_STAGES: LeadStatus[] = [
  "new",
  "listed",
  "assigned",
  "contacted",
  "meeting",
  "quote",
];

const MIX_TONE: Record<string, string> = {
  new: "bg-stage-new",
  listed: "bg-stage-listed",
  assigned: "bg-stage-assigned",
  contacted: "bg-stage-contacted",
  meeting: "bg-stage-meeting",
  quote: "bg-stage-quote",
};

export default async function PipelinePage() {
  const [buckets, reps] = await Promise.all([
    getPipelineLeads(),
    getActiveReps(),
  ]);

  const total = LEAD_STATUSES.reduce((sum, s) => sum + buckets[s].length, 0);
  const won = buckets.won.length;
  const dead = buckets.dead.length;
  const liveQuotes = buckets.quote.length;
  const inPipeline = total - dead - buckets.returned.length - won;
  const decided = won + dead;
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

  // Share of open work sitting in each stage. Computed over the whole board,
  // not the filtered view — it is a portfolio reading, not a search result.
  const mixTotal = MIX_STAGES.reduce((n, s) => n + buckets[s].length, 0);
  const mix = MIX_STAGES.map((s) => ({
    status: s,
    label: LEAD_STATUS_LABELS[s],
    count: buckets[s].length,
    pct: mixTotal > 0 ? Math.round((buckets[s].length / mixTotal) * 100) : 0,
  })).filter((m) => m.count > 0);

  const kanban: Record<string, KanbanLead[]> = {};
  for (const status of LEAD_STATUSES) {
    kanban[status] = buckets[status].map((l) => ({
      id: l.id,
      company_name: l.company_name,
      score: l.score,
      signal_summary: l.signal_summary,
      location: l.location,
      rep_name: l.rep_name,
      days_in_stage: l.days_in_stage,
      days_since_created: daysBetween(l.created_at),
    }));
  }

  const all = Object.values(buckets).flat();

  // The board filters on rep_name, which is what the pipeline query returns.
  // Union with the names actually on the board so a lead assigned to a rep who
  // has since been deactivated is still reachable through the picker.
  const onBoard = new Set(
    all.map((l) => l.rep_name).filter((n): n is string => Boolean(n))
  );
  const repNames = Array.from(
    new Set([...reps.map((r) => r.full_name), ...onBoard])
  ).sort((a, b) => a.localeCompare(b));

  const regions = Array.from(
    new Set(all.map((l) => regionOf(l.location)).filter((r): r is string => Boolean(r)))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Pipeline — every active lead by stage</h1>

      <StatStrip number="02" className="mb-[18px]">
        <Stat label="In pipeline" value={inPipeline} />
        <Stat
          label="Live quotes"
          value={liveQuotes}
          tone="cool"
          hint="Quotes issued and still open"
        />
        <Stat label="Won" value={won} tone="good" />
        <Stat label="Dead" value={dead} tone="bad" />
        <Stat
          label="Win rate"
          value={`${winRate}%`}
          tone="brand"
          hint="Won as a share of all decided deals (won + dead)"
        />
        <Stat label="Returned" value={buckets.returned.length} tone="warn" />
      </StatStrip>

      {mix.length > 0 && (
        <>
          <div
            className="mb-2 flex h-1.5 overflow-hidden rounded-md bg-surface"
            role="img"
            aria-label={`Open pipeline by stage: ${mix
              .map((m) => `${m.label} ${m.pct}%`)
              .join(", ")}`}
          >
            {mix.map((m) => (
              <div
                key={m.status}
                className={MIX_TONE[m.status]}
                style={{ flex: m.count }}
              />
            ))}
          </div>
          <div className="mb-[18px] flex flex-wrap gap-x-[18px] gap-y-2" aria-hidden>
            {mix.map((m) => (
              <div
                key={m.status}
                className="mono flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint"
              >
                <span className={`dot ${MIX_TONE[m.status]}`} />
                {m.label}
                <span className="text-ink-2">{m.pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mb-4 h-px bg-line" />

      <KanbanBoard
        columns={LEAD_STATUSES}
        buckets={kanban}
        droppable={DROPPABLE}
        reps={repNames}
        regions={regions}
        emptyHint="No leads"
      />
    </div>
  );
}
