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
import { PageHeader, MetaItem } from "@/components/page-header";
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
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-dim hover:text-brand transition-colors mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        All team
      </Link>

      <div className="flex items-start gap-3.5 mb-4">
        <div className="h-11 w-11 shrink-0 border border-line-strong bg-surface-2 flex items-center justify-center">
          <span className="text-[15px] font-bold text-ink-2">
            {initials(rep.full_name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[21px] font-bold tracking-tight text-ink leading-tight">
              {rep.full_name}
            </h1>
            <span
              className={cn(
                "text-[10.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border",
                rep.is_active
                  ? "border-signal-good/40 text-signal-good bg-signal-good/[0.08]"
                  : "border-line text-ink-faint bg-surface-2"
              )}
            >
              {rep.is_active ? "Active" : "Inactive"}
            </span>
            {rep.availability === "looking" && (
              <span className="text-[10.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border border-signal-warm/40 text-signal-warm bg-signal-warm/[0.07]">
                Looking for leads
              </span>
            )}
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5 text-[12px] text-ink-dim">
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
                className="inline-flex items-center gap-1.5 hover:text-brand transition-colors"
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

      {/* The rep's name above is already this page's <h1>, so the counter strip
          is rendered on its own rather than through PageHeader — passing an
          empty title would emit a second, unnamed heading landmark. */}
      <div className="flex items-center gap-x-8 gap-y-2 flex-wrap mono text-[11px] uppercase tracking-wider text-ink-faint pb-6 mb-6 border-b border-line">
        {/* Book inventory only. Win/loss performance was deliberately
            left off this page — it answers "what are they holding?", not
            "how are they doing?". */}
        <MetaItem label="Total held" value={stats.total} accent />
        <MetaItem label="In play" value={stats.open} />
        <MetaItem label="Live quotes" value={liveQuotes} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
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
    <section aria-labelledby="book-heading">
      <div className="flex items-baseline gap-2.5 mb-2.5">
        <h2 id="book-heading" className="text-[15px] font-bold tracking-tight text-ink">
          Book of work
        </h2>
        <span className="text-[12px] text-ink-dim">
          {total === 0 ? "nothing held" : `${total} lead${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {total === 0 ? (
        <div className="border border-line bg-surface px-6 py-12 text-center">
          <p className="text-[13.5px] font-semibold text-ink">No leads held</p>
          <p className="text-[12.5px] text-ink-dim mt-1.5">
            Nothing has been routed to or claimed by this rep yet.
          </p>
        </div>
      ) : (
        <div className="border border-line bg-surface divide-y divide-line">
          {BOOK_COLUMNS.map((status) => {
            const rows = byStage.get(status) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={status}>
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface-2 sticky top-0">
                  <h3 className="label-xs text-ink-2">
                    {LEAD_STATUS_LABELS[status]}
                  </h3>
                  <span className="mono text-[11px] tabular font-semibold text-ink-dim">
                    {rows.length}
                  </span>
                </div>
                <ul>
                  {rows.map((lead) => {
                    const stale = daysBetween(lead.updated_at || lead.assigned_at);
                    return (
                      <li key={lead.id} className="border-t border-line first:border-t-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="row-hit flex items-center gap-3 px-3 py-2 group"
                        >
                          <ScoreBadge score={lead.score} size="sm" showLabel={false} />
                          <span className="text-[13px] font-medium text-ink truncate flex-1 min-w-0 group-hover:text-brand transition-colors">
                            {lead.company_name}
                          </span>
                          {lead.location && (
                            <span className="text-[11.5px] text-ink-dim truncate hidden sm:block max-w-[30%]">
                              {lead.location}
                            </span>
                          )}
                          <span
                            className={cn(
                              "mono text-[11px] tabular shrink-0 w-12 text-right",
                              stale > 30
                                ? "text-signal-hot font-semibold"
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
    <section aria-labelledby="activity-heading">
      <div className="flex items-baseline gap-2.5 mb-2.5">
        <h2
          id="activity-heading"
          className="text-[15px] font-bold tracking-tight text-ink"
        >
          Activity
        </h2>
        <span className="text-[12px] text-ink-dim">most recent first</span>
      </div>

      {events.length === 0 ? (
        <div className="border border-line bg-surface px-5 py-10 text-center">
          <p className="text-[13px] font-semibold text-ink">Nothing recorded</p>
          <p className="text-[12px] text-ink-dim mt-1.5">
            Assignments and stage changes will appear here.
          </p>
        </div>
      ) : (
        <ol className="border border-line bg-surface divide-y divide-line max-h-[70vh] overflow-y-auto scrollbar-thin">
          {events.map((e) => (
            <li key={e.id} className="px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/leads/${e.lead_id}`}
                  className="text-[12.5px] font-semibold text-ink hover:text-brand transition-colors truncate"
                >
                  {e.company_name}
                </Link>
                <time
                  className="mono text-[10.5px] text-ink-faint shrink-0"
                  dateTime={e.at}
                >
                  {formatRelative(e.at)}
                </time>
              </div>

              <p className="text-[12px] text-ink-dim mt-1">
                {e.kind === "assigned" ? (
                  "Lead assigned"
                ) : (
                  <>
                    {e.from_status ? LEAD_STATUS_LABELS[e.from_status] : "—"}
                    <ArrowRight
                      className="inline h-3 w-3 mx-1.5 text-ink-faint align-[-1px]"
                      strokeWidth={2}
                    />
                    <span className="text-ink-2 font-semibold">
                      {e.to_status ? LEAD_STATUS_LABELS[e.to_status] : "—"}
                    </span>
                  </>
                )}
              </p>

              {e.note && (
                <p className="text-[11.5px] text-ink-faint mt-1 leading-snug line-clamp-2">
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
