import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, MapPin, Send } from "lucide-react";
import {
  getRepById,
  getLeadsForRep,
  getRepStats,
  getRepActivity,
  type RepInboxLead,
} from "@/lib/queries";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/supabase/types";
import { Stat } from "@/components/stat-strip";
import { ScoreBadge } from "@/components/ui/score-badge";
import { cn, daysBetween, formatRelative, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BOOK_COLUMNS: LeadStatus[] = LEAD_STATUSES.filter(
  (s) => s !== "new" && s !== "listed"
);

export default async function RepProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const rep = await getRepById(params.id);
  if (!rep) notFound();

  const [leads, stats, activity] = await Promise.all([
    getLeadsForRep(rep.id),
    getRepStats(rep.id),
    getRepActivity(rep.id),
  ]);

  const liveQuotes = leads.filter((l) => l.status === "quote").length;

  const byStage = new Map<LeadStatus, RepInboxLead[]>();
  for (const status of BOOK_COLUMNS) byStage.set(status, []);
  for (const lead of leads) {
    const bucket = byStage.get(lead.status) ?? byStage.get("assigned")!;
    bucket.push(lead);
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/reps"
        className="eyebrow mb-4 inline-flex items-center gap-1.5 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={2} />
        All team
      </Link>

      <header className="panel mb-4 p-[18px] lg:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-2">
            <span className="text-[15px] font-bold text-ink-2">
              {initials(rep.full_name)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="display-serif text-[22px] leading-tight text-ink">
                {rep.full_name}
              </h1>
              <span
                className={cn(
                  "mono rounded-sm px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]",
                  rep.is_active
                    ? "bg-signal-good text-white"
                    : "bg-ink-faint text-white"
                )}
              >
                {rep.is_active ? "Active" : "Inactive"}
              </span>
              {rep.availability === "looking" && (
                <span className="mono rounded-sm bg-stage-assigned px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">
                  Looking for leads
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-dim">
              {rep.speciality && <span>{rep.speciality}</span>}
              {rep.territory && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  {rep.territory}
                </span>
              )}
              {rep.email && (
                <a
                  href={`mailto:${rep.email}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-ink"
                >
                  <Mail className="h-3 w-3" strokeWidth={1.75} />
                  {rep.email}
                </a>
              )}
              {rep.telegram_username && (
                <span className="inline-flex items-center gap-1.5">
                  <Send className="h-3 w-3" strokeWidth={1.75} />@
                  {rep.telegram_username}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* The rep's name above is already this page's <h1>, so the counters run
            bare here rather than through a header component that would emit a
            second, unnamed heading landmark.

            Book inventory only. Win/loss performance was deliberately left off
            this page — it answers "what are they holding?", not "how are they
            doing?". */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-4 border-t border-line-soft pt-4 lg:gap-x-10">
          <Stat label="Total held" value={stats.total} tone="brand" />
          <Stat label="In play" value={stats.open} />
          <Stat label="Live quotes" value={liveQuotes} />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <BookOfWork byStage={byStage} total={leads.length} />
        <ActivityTimeline events={activity} />
      </div>
    </div>
  );
}

function BookOfWork({
  byStage,
  total,
}: {
  byStage: Map<LeadStatus, RepInboxLead[]>;
  total: number;
}) {
  return (
    <section className="panel p-[18px] lg:p-5" aria-labelledby="book-heading">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 id="book-heading" className="text-[13.5px] font-bold text-ink">
          Book of work
        </h2>
        <span className="mono text-[11px] text-ink-faint">
          {total === 0 ? "nothing held" : `${total} lead${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {total === 0 ? (
        <div className="rounded-lg bg-surface-2 px-6 py-12 text-center">
          <p className="text-[13px] font-semibold text-ink">No leads held</p>
          <p className="mt-1.5 text-[12.5px] text-ink-dim">
            Nothing has been routed to or claimed by this rep yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {BOOK_COLUMNS.map((status) => {
            const rows = byStage.get(status) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={status}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <h3 className="label-xs text-ink-2">
                    {LEAD_STATUS_LABELS[status]}
                  </h3>
                  <span className="mono tabular text-[11px] font-semibold text-ink-dim">
                    {rows.length}
                  </span>
                </div>
                <ul className="divide-y divide-line-soft overflow-hidden rounded-lg bg-surface-2">
                  {rows.map((lead) => {
                    const stale = daysBetween(lead.updated_at || lead.assigned_at);
                    return (
                      <li key={lead.id}>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-3"
                        >
                          <ScoreBadge score={lead.score} size="sm" showLabel={false} />
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink transition-colors group-hover:text-brand-ink">
                            {lead.company_name}
                          </span>
                          {lead.location && (
                            <span className="hidden max-w-[30%] truncate text-[11.5px] text-ink-dim sm:block">
                              {lead.location}
                            </span>
                          )}
                          <span
                            className={cn(
                              "mono tabular w-12 shrink-0 text-right text-[11px]",
                              stale > 30
                                ? "font-semibold text-signal-hot"
                                : stale > 14
                                  ? "text-signal-warm"
                                  : "text-ink-faint"
                            )}
                            title={`${stale} days since last movement`}
                          >
                            {stale}d
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActivityTimeline({
  events,
}: {
  events: Awaited<ReturnType<typeof getRepActivity>>;
}) {
  return (
    <section className="panel p-[18px] lg:p-5" aria-labelledby="activity-heading">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 id="activity-heading" className="text-[13.5px] font-bold text-ink">
          Activity
        </h2>
        <span className="mono text-[11px] text-ink-faint">most recent first</span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg bg-surface-2 px-5 py-10 text-center">
          <p className="text-[13px] font-semibold text-ink">Nothing recorded</p>
          <p className="mt-1.5 text-[12px] text-ink-dim">
            Assignments and stage changes will appear here.
          </p>
        </div>
      ) : (
        <ol className="scrollbar-thin max-h-[70vh] divide-y divide-line-soft overflow-y-auto overflow-hidden rounded-lg bg-surface-2">
          {events.map((e) => (
            <li key={e.id} className="px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/leads/${e.lead_id}`}
                  className="truncate text-[12.5px] font-semibold text-ink transition-colors hover:text-brand-ink"
                >
                  {e.company_name}
                </Link>
                <time
                  className="mono shrink-0 text-[10.5px] text-ink-faint"
                  dateTime={e.at}
                >
                  {formatRelative(e.at)}
                </time>
              </div>

              <p className="mt-1 text-[12px] text-ink-dim">
                {e.kind === "assigned" ? (
                  "Lead assigned"
                ) : (
                  <>
                    {e.from_status ? LEAD_STATUS_LABELS[e.from_status] : "—"}
                    <ArrowRight
                      className="mx-1.5 inline h-3 w-3 align-[-1px] text-ink-faint"
                      strokeWidth={2}
                    />
                    <span className="font-semibold text-ink-2">
                      {e.to_status ? LEAD_STATUS_LABELS[e.to_status] : "—"}
                    </span>
                  </>
                )}
              </p>

              {e.note && (
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-faint">
                  {e.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
