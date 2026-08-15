import { LEAD_STATUS_LABELS } from "@/lib/supabase/types";
import { cn, firstName } from "@/lib/utils";

/**
 * Stage chip. The teal ramp is one hue, so the stage word always ships — the
 * tint narrows it down, the label states it.
 *
 * Shared by the inbox row and the lead detail header so a stage never reads as
 * two different colours on two screens.
 */
const STAGE_TINT: Record<string, string> = {
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

export function StatusChip({
  status,
  repName,
  className,
}: {
  status: string;
  repName?: string | null;
  className?: string;
}) {
  const cls = STAGE_TINT[status] || "bg-ink-faint text-white";
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
        cls,
        className
      )}
    >
      {label}
    </span>
  );
}
