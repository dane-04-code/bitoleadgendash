import { cn } from "@/lib/utils";

/**
 * The page header both comps share: an oversized condensed numeral anchoring
 * the left edge, with the counter strip running along its baseline. The
 * numeral is wayfinding — it matches the rail's stage number and the meta
 * strip — so it is decorative to a screen reader and hidden from it.
 */
export function StatStrip({
  number,
  children,
  className,
}: {
  number: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center gap-5 sm:gap-[22px]", className)}>
      <span
        aria-hidden
        className="display-number hidden shrink-0 text-[62px] leading-[0.85] text-line-strong sm:block"
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-8 gap-y-4 lg:gap-x-10">
        {children}
      </div>
    </header>
  );
}

const TONE = {
  brand: "text-brand-ink",
  quiet: "text-ink-faint",
  good: "text-stage-won",
  bad: "text-stage-dead",
  warn: "text-stage-assigned",
  cool: "text-brand-soft",
} as const;

/** A counter: mono label above a condensed figure. */
export function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof TONE;
  /** Plain-language explanation, surfaced as a native tooltip on the label. */
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint",
          hint && "cursor-help"
        )}
        title={hint}
      >
        {label}
      </span>
      <span
        className={cn(
          "display-number text-[34px] leading-none tabular",
          tone ? TONE[tone] : "text-ink"
        )}
      >
        {value}
      </span>
    </div>
  );
}
