import { Check, X } from "lucide-react";
import {
  SCORE_BREAKDOWN_CRITERIA,
  type ScoreBreakdownItem,
} from "@/lib/supabase/types";

export function ScoreBreakdown({
  breakdown,
}: {
  breakdown: ScoreBreakdownItem[] | null;
}) {
  if (!breakdown || breakdown.length === 0) return null;

  const map = new Map(breakdown.map((item) => [item.key, item]));

  return (
    <div className="border border-line bg-surface">
      <div className="border-b border-line px-4 py-2.5 bg-surface-2">
        <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
          Score breakdown
        </span>
      </div>
      <div className="divide-y divide-line">
        {SCORE_BREAKDOWN_CRITERIA.map((criterion) => {
          const item = map.get(criterion.key);
          const passed = item?.passed ?? false;
          const note = item?.note ?? null;
          const present = map.has(criterion.key);

          return (
            <div key={criterion.key} className="flex items-start gap-3 px-4 py-2.5">
              <span
                className={`mt-0.5 shrink-0 h-4 w-4 flex items-center justify-center rounded-sm border ${
                  !present
                    ? "border-line bg-surface-2 text-ink-faint/40"
                    : passed
                    ? "border-signal-good/40 bg-signal-good/[0.08] text-signal-good"
                    : "border-signal-cold/30 bg-signal-cold/[0.05] text-signal-cold"
                }`}
              >
                {present && passed && (
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                )}
                {present && !passed && (
                  <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                )}
              </span>
              <div className="min-w-0">
                <div
                  className={`text-[13px] leading-snug ${
                    !present
                      ? "text-ink-faint"
                      : passed
                      ? "text-ink"
                      : "text-ink-dim"
                  }`}
                >
                  {criterion.label}
                </div>
                {note && (
                  <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
                    {note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
