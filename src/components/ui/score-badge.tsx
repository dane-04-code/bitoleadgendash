import { cn, scoreTier } from "@/lib/utils";

/**
 * The score ramp rides the single teal hue, so the tier word ships with the
 * dot at every size — the tier is never carried by colour alone.
 */
const TIER = {
  hot: { dot: "bg-tier-hot", text: "text-tier-hot", label: "Hot" },
  warm: { dot: "bg-tier-warm", text: "text-tier-warm", label: "Warm" },
  cold: { dot: "bg-tier-cold", text: "text-tier-cold", label: "Cold" },
} as const;

export function ScoreBadge({
  score,
  className,
  size = "default",
  showLabel = true,
}: {
  score: number;
  className?: string;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}) {
  const tier = scoreTier(score);
  const t = TIER[tier];

  if (size === "lg") {
    return (
      <div className={cn("inline-flex items-baseline gap-2.5", className)}>
        <span className={cn("display-number text-[52px] tabular", t.text)}>
          {score}
        </span>
        {showLabel && (
          <span
            className={cn(
              "mono text-[10px] font-semibold uppercase tracking-[0.14em]",
              t.text
            )}
          >
            {t.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        size === "sm" ? "gap-1.5" : "gap-2",
        className
      )}
    >
      <span className={cn("dot shrink-0", t.dot)} />
      <span
        className={cn(
          "display-number tabular text-ink",
          size === "sm" ? "text-[13.5px]" : "text-[16px]"
        )}
      >
        {score}
      </span>
      {showLabel && (
        <span
          className={cn(
            "mono text-[9px] font-semibold uppercase tracking-[0.06em]",
            t.text
          )}
        >
          {t.label}
        </span>
      )}
    </span>
  );
}
