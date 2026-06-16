import { Mail, Send, MapPin, KeyRound } from "lucide-react";
import { getAllReps, getRepLeadCounts, type RepWithStatus } from "@/lib/queries";
import { AddRepForm } from "@/components/add-rep-form";
import { SetPasswordDialog } from "@/components/set-password-dialog";
import { DeleteRepDialog } from "@/components/delete-rep-dialog";
import { initials } from "@/lib/utils";
import { PageHeader, MetaItem } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RepsPage() {
  const [reps, counts] = await Promise.all([getAllReps(), getRepLeadCounts()]);

  const active = reps.filter((r) => r.is_active);
  const inactive = reps.filter((r) => !r.is_active);
  const totalLeads = Object.values(counts).reduce((s, n) => s + n, 0);

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
        subtitle="Your sales reps and their territories. Reps with a Telegram username will receive instant notifications when leads are routed to them."
        meta={
          <>
            <MetaItem label="Active" value={active.length} />
            <MetaItem label="Total reps" value={reps.length} />
            <MetaItem label="Leads routed" value={totalLeads} />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-10 min-w-0">
          <section>
            <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">A</span>
              <h2 className="display-serif text-xl text-ink leading-none">Active reps</h2>
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint ml-auto">
                {active.length} entries
              </span>
            </div>
            {active.length === 0 ? (
              <EmptyReps />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
                {active.map((r, i) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} index={i} />
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section>
              <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
                <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">B</span>
                <h2 className="display-serif text-xl text-ink leading-none">Inactive</h2>
                <span className="mono text-[10px] uppercase tracking-wider text-ink-faint ml-auto">
                  {inactive.length} entries
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line opacity-60">
                {inactive.map((r, i) => (
                  <RepCard key={r.id} rep={r} count={counts[r.id] || 0} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <div className="border border-line bg-surface sticky top-20">
            <header className="border-b border-line px-5 py-4">
              <div className="eyebrow text-brand-ink mb-1.5">Onboard</div>
              <h2 className="display-serif text-xl text-ink leading-tight">
                Add a new rep
              </h2>
              <p className="text-[12px] text-ink-dim mt-2 leading-relaxed">
                Reps with a Telegram username receive lead notifications instantly.
              </p>
            </header>
            <div className="p-5">
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
  index,
}: {
  rep: RepWithStatus;
  count: number;
  index: number;
}) {
  return (
    <div className="bg-surface p-5 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="display-serif text-xl text-ink-2 w-10 h-10 border border-line-strong flex items-center justify-center shrink-0">
            {initials(rep.full_name)}
          </div>
          <div className="min-w-0">
            <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mb-1 flex items-center gap-2">
              <span>Rep · {String(index + 1).padStart(2, "0")}</span>
              {rep.has_password ? (
                <span className="text-signal-good flex items-center gap-1">
                  <span className="dot bg-signal-good" />
                  Active login
                </span>
              ) : (
                <span className="text-signal-warm flex items-center gap-1">
                  <span className="dot bg-signal-warm" />
                  No login
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-medium text-ink truncate">
              {rep.full_name}
            </h3>
            {rep.speciality && (
              <p className="text-[12px] text-ink-dim mt-0.5 truncate">{rep.speciality}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="display-number text-3xl text-ink leading-none">{count}</div>
          <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-1">
            Leads
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-line mono text-[11px]">
        <a
          href={`mailto:${rep.email}`}
          className="flex items-center gap-2 text-ink-2 hover:text-brand-ink transition-colors truncate"
        >
          <Mail className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
          <span className="truncate">{rep.email}</span>
        </a>
        {rep.telegram_username && (
          <div className="flex items-center gap-2 text-ink-dim">
            <Send className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
            <span className="truncate">{rep.telegram_username}</span>
          </div>
        )}
        {rep.territory && (
          <div className="flex items-center gap-2 text-ink-dim">
            <MapPin className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={1.75} />
            <span className="truncate">{rep.territory}</span>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-line flex items-center gap-2">
        <SetPasswordDialog
          repId={rep.id}
          repName={rep.full_name}
          repEmail={rep.email}
          hasPassword={rep.has_password}
        />
        <DeleteRepDialog
          repId={rep.id}
          repName={rep.full_name}
          leadCount={count}
        />
      </div>
    </div>
  );
}

function EmptyReps() {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <div className="display-serif text-5xl text-ink-faint/30 mb-3">∅</div>
      <h3 className="display-serif text-xl text-ink mb-2">No active reps yet.</h3>
      <p className="text-[13px] text-ink-dim max-w-xs mx-auto">
        Use the form on the right to onboard your first rep and start routing
        leads to them.
      </p>
    </div>
  );
}
