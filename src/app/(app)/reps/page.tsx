import Link from "next/link";
import { Mail, Send, MapPin, ArrowUpRight } from "lucide-react";
import { getAllReps, getRepLeadCounts, type RepWithStatus } from "@/lib/queries";
import { AddRepForm } from "@/components/add-rep-form";
import { SetPasswordDialog } from "@/components/set-password-dialog";
import { DeleteRepDialog } from "@/components/delete-rep-dialog";
import { RepActiveToggle } from "@/components/rep-active-toggle";
import { cn, initials } from "@/lib/utils";
import { StatStrip, Stat } from "@/components/stat-strip";
import { REP_AVAILABILITY_LABELS } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RepsPage() {
  const [reps, counts] = await Promise.all([getAllReps(), getRepLeadCounts()]);

  const active = reps.filter((r) => r.is_active);
  const inactive = reps.filter((r) => !r.is_active);
  const totalLeads = Object.values(counts).reduce((s, n) => s + n, 0);
  const looking = active.filter((r) => r.availability !== "not_looking").length;

  return (
    <div className="animate-fade-in">
      <h1 className="sr-only">Team — sales reps and their territories</h1>

      {/* 04 matches the rail's code for Team. */}
      <StatStrip number="04" className="mb-5">
        <Stat label="Active" value={active.length} tone="brand" />
        <Stat label="Looking for leads" value={looking} />
        <Stat label="Total reps" value={reps.length} />
        <Stat label="Leads routed" value={totalLeads} />
      </StatStrip>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="panel p-[18px] lg:p-5" aria-labelledby="active-heading">
            <div className="mb-3.5 flex items-baseline justify-between gap-3">
              <h2 id="active-heading" className="text-[13.5px] font-bold text-ink">
                Active
              </h2>
              <span className="mono tabular text-[11px] text-ink-faint">
                {active.length}
              </span>
            </div>
            {active.length === 0 ? (
              <EmptyReps />
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {active.map((r) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} />
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section
              className="panel p-[18px] lg:p-5"
              aria-labelledby="inactive-heading"
            >
              <div className="mb-3.5 flex items-baseline justify-between gap-3">
                <h2 id="inactive-heading" className="text-[13.5px] font-bold text-ink">
                  Inactive
                </h2>
                <span className="mono tabular text-[11px] text-ink-faint">
                  {inactive.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {inactive.map((r) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} muted />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <section className="panel p-[18px] lg:sticky lg:top-5 lg:p-5">
            <h2 className="text-[13.5px] font-bold text-ink">Add a rep</h2>
            <p className="mb-3.5 mt-1 text-[12.5px] leading-relaxed text-ink-dim">
              Reps with a Telegram username receive lead notifications instantly.
            </p>
            <AddRepForm />
          </section>
        </aside>
      </div>
    </div>
  );
}

function RepCard({
  rep,
  count,
  muted = false,
}: {
  rep: RepWithStatus;
  count: number;
  muted?: boolean;
}) {
  const looking = rep.availability !== "not_looking";

  return (
    <div
      className={cn(
        "group rounded-lg bg-surface-2 p-3.5 transition-colors hover:bg-surface-3",
        muted && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface">
          <span className="text-[12px] font-bold text-ink-2">
            {initials(rep.full_name)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/reps/${rep.id}`}
            className="inline-flex items-center gap-1 text-[13.5px] font-bold leading-tight text-ink transition-colors hover:text-brand-ink"
          >
            <span className="truncate">{rep.full_name}</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-brand-ink"
              strokeWidth={2}
            />
          </Link>

          {rep.speciality && (
            <p className="mt-0.5 truncate text-[12px] text-ink-dim">
              {rep.speciality}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-wider">
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                looking ? "text-signal-good" : "text-ink-faint"
              )}
            >
              <span className={cn("dot", looking ? "bg-signal-good" : "bg-ink-faint")} />
              {REP_AVAILABILITY_LABELS[looking ? "looking" : "not_looking"]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                rep.has_password ? "text-ink-faint" : "text-signal-warm"
              )}
            >
              {rep.has_password ? "Login set" : "No login"}
            </span>
          </div>
        </div>

        <Link
          href={`/reps/${rep.id}`}
          className="shrink-0 text-right transition-colors hover:text-brand-ink"
          aria-label={`${count} leads held by ${rep.full_name}`}
        >
          <div className="display-number text-[22px] leading-none text-ink">
            {count}
          </div>
          <div className="label-xs mt-1">Leads</div>
        </Link>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-line-soft pt-2.5 text-[11.5px]">
        <a
          href={`mailto:${rep.email}`}
          className="flex items-center gap-2 truncate text-ink-2 transition-colors hover:text-brand-ink"
        >
          <Mail className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
          <span className="truncate">{rep.email}</span>
        </a>
        {rep.telegram_username && (
          <div className="flex items-center gap-2 text-ink-dim">
            <Send className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
            <span className="truncate">@{rep.telegram_username}</span>
          </div>
        )}
        {rep.territory && (
          <div className="flex items-center gap-2 text-ink-dim">
            <MapPin className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
            <span className="truncate">{rep.territory}</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-line-soft pt-2.5">
        <SetPasswordDialog
          repId={rep.id}
          repName={rep.full_name}
          repEmail={rep.email}
          hasPassword={rep.has_password}
        />
        <RepActiveToggle
          repId={rep.id}
          repName={rep.full_name}
          isActive={rep.is_active}
        />
        <DeleteRepDialog repId={rep.id} repName={rep.full_name} leadCount={count} />
      </div>
    </div>
  );
}

function EmptyReps() {
  return (
    <div className="rounded-lg bg-surface-2 px-6 py-12 text-center">
      <h3 className="text-[13.5px] font-bold text-ink">No active reps yet</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-ink-dim">
        Use the form to onboard your first rep and start routing leads to them.
      </p>
    </div>
  );
}
