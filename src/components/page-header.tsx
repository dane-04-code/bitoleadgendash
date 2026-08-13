import { cn } from "@/lib/utils";

export function PageHeader({
  number,
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  className,
}: {
  number?: string;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 pb-8 mb-8 border-b border-line",
        className
      )}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-5 min-w-0">
          {number && (
            <div className="hidden sm:block shrink-0 mt-1">
              <div className="display-number text-5xl text-ink-faint/40 leading-none">
                {number}
              </div>
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="eyebrow mb-2 text-brand-ink">{eyebrow}</div>
            )}
            <h1 className="text-[28px] sm:text-[36px] font-bold leading-[1.05] tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] text-ink-dim mt-3 max-w-xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {meta && (
        <div className="flex items-center gap-x-8 gap-y-2 flex-wrap mono text-[11px] uppercase tracking-wider text-ink-faint">
          {meta}
        </div>
      )}
    </header>
  );
}

/**
 * Tones for the counter strip. These carry meaning, not decoration — a won
 * count reads green and a dead count reads red at a glance, which is the whole
 * point of the counters asked for in the 2026-07-11 meeting.
 */
const META_TONE = {
  good: "text-signal-good",
  warn: "text-signal-warm",
  bad: "text-signal-hot",
} as const;

export function MetaItem({
  label,
  value,
  accent,
  tone,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  tone?: keyof typeof META_TONE;
  /** Plain-language explanation, surfaced as a native tooltip on the label. */
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn("text-ink-faint", hint && "cursor-help border-b border-dotted border-line-strong")}
        title={hint}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-ink-2 tabular",
          accent && "text-brand-ink",
          tone && META_TONE[tone]
        )}
      >
        {value}
      </span>
    </div>
  );
}
