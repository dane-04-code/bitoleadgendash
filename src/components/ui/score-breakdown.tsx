import { Check, X } from "lucide-react";
import {
  SCORE_BREAKDOWN_CRITERIA,
  type ScoreBreakdownItem,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * The scoring rubric, one row per criterion. Renders inside an already-titled
 * panel, so it carries no heading of its own.
 *
 * A criterion the agents did not evaluate renders greyed rather than as a
 * fail — an unevaluated rubric and a failed one are different claims, so a
 * partial array is safe to send.
 */
export function ScoreBreakdown({
  breakdown,
}: {
  breakdown: ScoreBreakdownItem[] | null;
}) {
  if (!breakdown || breakdown.length === 0) return null;

  const map = new Map(breakdown.map((item) => [item.key, item]));

  return (
    <div className="divide-y divide-line-soft overflow-hidden rounded-lg bg-surface-2">
      {SCORE_BREAKDOWN_CRITERIA.map((criterion) => {
        const item = map.get(criterion.key);
        const passed = item?.passed ?? false;
        const note = item?.note ?? null;
        const present = map.has(criterion.key);

        return (
          <div key={criterion.key} className="flex items-start gap-3 px-3.5 py-2.5">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm",
                !present
                  ? "bg-surface text-ink-ghost"
                  : passed
                    ? "bg-signal-good text-white"
                    : "bg-surface text-ink-faint"
              )}
            >
              {present && passed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              {present && !passed && <X className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <div
                className={cn(
                  "text-[12.5px] leading-snug",
                  !present ? "text-ink-faint" : passed ? "text-ink" : "text-ink-dim"
                )}
              >
                {criterion.label}
                {!present && (
                  <span className="mono ml-1.5 text-[10px] uppercase tracking-[0.1em] text-ink-ghost">
                    not evaluated
                  </span>
                )}
              </div>
              {note && (
                <div className="mt-0.5 text-[11.5px] leading-snug text-ink-faint">
                  {note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
