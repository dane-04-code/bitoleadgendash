import Link from "next/link";
import { Mail, Send, MapPin, ArrowUpRight } from "lucide-react";
import { getAllReps, getRepLeadCounts, type RepWithStatus } from "@/lib/queries";
import { AddRepForm } from "@/components/add-rep-form";
import { SetPasswordDialog } from "@/components/set-password-dialog";
import { DeleteRepDialog } from "@/components/delete-rep-dialog";
import { cn, initials } from "@/lib/utils";
import { PageHeader, MetaItem } from "@/components/page-header";
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
      <PageHeader
        number="03"
        eyebrow="Lead Intelligence Terminal / Team"
        title={
          <>
            The <em className="text-brand-ink">closers</em>.
          </>
        }
        subtitle="Your sales reps and their territories. Open a rep to see their full book of work and recent activity."
        meta={
          <>
            <MetaItem label="Active" value={active.length} accent />
            <MetaItem label="Looking for leads" value={looking} />
            <MetaItem label="Total reps" value={reps.length} />
            <MetaItem label="Leads routed" value={totalLeads} />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <div className="space-y-6 min-w-0">
          <section aria-labelledby="active-heading">
            <div className="flex items-baseline gap-2.5 mb-2.5">
              <h2 id="active-heading" className="text-[15px] font-bold tracking-tight text-ink">
                Active
              </h2>
              <span className="text-[12px] text-ink-dim">{active.length}</span>
            </div>
            {active.length === 0 ? (
              <EmptyReps />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-line">
                {active.map((r) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} />
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section aria-labelledby="inactive-heading">
              <div className="flex items-baseline gap-2.5 mb-2.5">
                <h2
                  id="inactive-heading"
                  className="text-[15px] font-bold tracking-tight text-ink"
                >
                  Inactive
                </h2>
                <span className="text-[12px] text-ink-dim">{inactive.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-line">
                {inactive.map((r) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} muted />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <div className="border border-line bg-surface lg:sticky lg:top-5">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-bold text-ink leading-tight">
                Add a rep
              </h2>
              <p className="text-[12px] text-ink-dim mt-1 leading-relaxed">
                Reps with a Telegram username receive lead notifications instantly.
              </p>
            </header>
            <div className="p-4">
              <AddRepForm />
            </div>
          </div>
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
    <div className={cn("bg-surface p-3.5 group border-r border-b border-line", muted && "opacity-70")}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 border border-line-strong flex items-center justify-center shrink-0 bg-surface-2">
          <span className="text-[12px] font-bold text-ink-2">
            {initials(rep.full_name)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/reps/${rep.id}`}
            className="inline-flex items-center gap-1 text-[14px] font-bold text-ink hover:text-brand transition-colors leading-tight"
          >
            <span className="truncate">{rep.full_name}</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-brand transition-colors"
              strokeWidth={2}
            />
          </Link>

          {rep.speciality && (
            <p className="text-[12px] text-ink-dim mt-0.5 truncate">
              {rep.speciality}
            </p>
          )}

          <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-[10.5px] font-semibold uppercase tracking-wider">
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
          className="text-right shrink-0 hover:text-brand transition-colors"
          aria-label={`${count} leads held by ${rep.full_name}`}
        >
          <div className="display-number text-[22px] text-ink leading-none">
            {count}
          </div>
          <div className="label-xs mt-1">Leads</div>
        </Link>
      </div>

      <div className="space-y-1 pt-2.5 mt-2.5 border-t border-line text-[11.5px]">
        <a
          href={`mailto:${rep.email}`}
          className="flex items-center gap-2 text-ink-2 hover:text-brand transition-colors truncate"
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

      <div className="pt-2.5 mt-2.5 border-t border-line flex items-center gap-2">
        <SetPasswordDialog
          repId={rep.id}
          repName={rep.full_name}
          repEmail={rep.email}
          hasPassword={rep.has_password}
        />
        <DeleteRepDialog repId={rep.id} repName={rep.full_name} leadCount={count} />
      </div>
    </div>
  );
}

function EmptyReps() {
  return (
    <div className="border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h3 className="text-[14px] font-bold text-ink">No active reps yet</h3>
      <p className="text-[12.5px] text-ink-dim max-w-xs mx-auto mt-1.5 leading-relaxed">
        Use the form to onboard your first rep and start routing leads to them.
      </p>
    </div>
  );
}
