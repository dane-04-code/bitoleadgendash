import { cn, scoreTier } from "@/lib/utils";

const TIER = {
  hot: {
    dot: "bg-signal-hot",
    text: "text-signal-hot",
    label: "Hot",
  },
  warm: {
    dot: "bg-signal-warm",
    text: "text-signal-warm",
    label: "Warm",
  },
  cold: {
    dot: "bg-signal-cold",
    text: "text-signal-cold",
    label: "Cold",
  },
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
      <div className={cn("inline-flex items-baseline gap-2", className)}>
        <span className={cn("display-number text-5xl tabular", t.text)}>
          {score}
        </span>
        {showLabel && (
          <span className={cn("eyebrow", t.text)}>{t.label}</span>
        )}
      </div>
    );
  }

  const sizeMap = {
    sm: "text-[11px] gap-1.5",
    default: "text-[12px] gap-2",
  };

  return (
    <span className={cn("inline-flex items-center mono", sizeMap[size], className)}>
      <span className={cn("dot", t.dot)} />
      <span className={cn("font-semibold tabular", t.text)}>
        {score.toString().padStart(2, "0")}
      </span>
      {showLabel && (
        <span className="text-ink-faint uppercase tracking-wider text-[10px]">
          {t.label}
        </span>
      )}
    </span>
  );
}
