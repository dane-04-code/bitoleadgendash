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

export function MetaItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-faint">{label}</span>
      <span className={cn("text-ink-2", accent && "text-brand-ink")}>
        {value}
      </span>
    </div>
  );
}
