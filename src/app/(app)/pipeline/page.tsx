import { getPipelineLeads, getActiveReps } from "@/lib/queries";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/supabase/types";
import { PageHeader, MetaItem } from "@/components/page-header";
import { KanbanBoard, type KanbanLead } from "@/components/kanban-board";

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

export default async function PipelinePage() {
  const [buckets, reps] = await Promise.all([
    getPipelineLeads(),
    getActiveReps(),
  ]);

  // The board filters on rep_name, which is what the pipeline query returns.
  // Union with the names actually on the board so a lead assigned to a rep who
  // has since been deactivated is still reachable through the picker.
  const onBoard = new Set(
    Object.values(buckets)
      .flat()
      .map((l) => l.rep_name)
      .filter((n): n is string => Boolean(n))
  );
  const repNames = Array.from(
    new Set([...reps.map((r) => r.full_name), ...onBoard])
  ).sort((a, b) => a.localeCompare(b));

  const total = LEAD_STATUSES.reduce((sum, s) => sum + buckets[s].length, 0);
  const won = buckets.won.length;
  const dead = buckets.dead.length;
  const liveQuotes = buckets.quote.length;
  const inPipeline = total - dead - buckets.returned.length - won;
  const decided = won + dead;
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

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
    }));
  }

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
        subtitle="Every active lead, plotted across each sales stage. Drag a lead between stages to move it. Days indicate how long a lead has been sitting in its current stage."
        meta={
          <>
            <MetaItem label="In pipeline" value={inPipeline} />
            <MetaItem
              label="Live quotes"
              value={liveQuotes}
              accent
              hint="Quotes issued and still open"
            />
            <MetaItem label="Won" value={won} tone="good" />
            <MetaItem label="Dead" value={dead} tone="bad" />
            <MetaItem
              label="Win rate"
              value={`${winRate}%`}
              hint="Won as a share of all decided deals (won + dead)"
            />
            <MetaItem label="Returned" value={buckets.returned.length} tone="warn" />
          </>
        }
      />

      <KanbanBoard
        columns={LEAD_STATUSES}
        buckets={kanban}
        droppable={DROPPABLE}
        reps={repNames}
        emptyHint="No leads"
      />
    </div>
  );
}
