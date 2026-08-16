import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Send,
} from "lucide-react";
import {
  getLeadById,
  getActiveReps,
  isLeadOwnedByRep,
  getLeadNotes,
  getLeadReview,
  getDealSale,
  getRepById,
  getNextInboxLeadId,
} from "@/lib/queries";
import type { InboxView } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { ScoreBadge } from "@/components/ui/score-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { AssignDialog } from "@/components/assign-dialog";
import { StatusSelector } from "@/components/status-selector";
import { ReturnLeadDialog } from "@/components/return-lead-dialog";
import { ClaimButton } from "@/components/claim-button";
import { UnclaimButton } from "@/components/unclaim-button";
import { ListToggleButton } from "@/components/list-toggle-button";
import { LeadNotes } from "@/components/lead-notes";
import { OutreachUsedToggle } from "@/components/outreach-used-toggle";
import { OrderProfileDialog } from "@/components/order-profile-panel";
import { LeadReviewCard } from "@/components/lead-review";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { LEAD_STATUS_LABELS, archivedReasonLabel } from "@/lib/supabase/types";
import { cn, formatRelative, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INBOX_VIEWS: InboxView[] = [
  "active",
  "archived",
  "killed",
  "new",
  "unassigned",
  "listed",
  "assigned",
  "returned",
];

function dashboardHref(view: InboxView): string {
  return view === "active" ? "/dashboard" : `/dashboard?view=${view}`;
}

/**
 * Reps have two surfaces on /my. Send them back to the one they came from —
 * `from=inbox` is the rep list, anything else is the board.
 */
function repHref(from: string | undefined): string {
  return from === "inbox" ? "/my?view=inbox" : "/my";
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { from?: string };
}) {
  const session = await getSession();
  if (!session) notFound();
  const inboxView = INBOX_VIEWS.includes(searchParams?.from as InboxView)
    ? (searchParams?.from as InboxView)
    : "active";

  // Reps must clear a forced password change before working any lead.
  if (session.role === "rep") {
    const rep = await getRepById(session.subject);
    if (rep?.must_change_password) redirect("/my/account");
  }

  const data = await getLeadById(params.id);
  if (!data || !data.lead) notFound();

  const { lead, contacts, outreach, call_briefs, assignments, pipeline_updates } = data;
  const isAdmin = session.role === "admin";

  // Reps may open a lead they own OR one that's on the marketplace (to claim).
  let repOwns = false;
  if (!isAdmin) {
    repOwns = await isLeadOwnedByRep(params.id, session.subject);
    if (!repOwns && lead.status !== "listed") notFound();
  }
  const [reps, notes, review, dealSale, nextLeadId] = await Promise.all([
    isAdmin ? getActiveReps() : Promise.resolve([]),
    getLeadNotes(params.id),
    getLeadReview(params.id),
    getDealSale(params.id),
    isAdmin ? getNextInboxLeadId(params.id, inboxView) : Promise.resolve(null),
  ]);

  const currentAssignment = assignments[0];
  const linkedinDrafts = outreach.filter((o) => o.channel === "linkedin");
  const emailDrafts = outreach.filter((o) => o.channel === "email");
  const otherDrafts = outreach.filter((o) => o.channel !== "linkedin" && o.channel !== "email");
  const latestBrief = call_briefs[0];
  // Mock ids look like "lead-29"; take the trailing segment, not the leading word.
  const shortId = lead.id.split("-").pop()?.toUpperCase();

  return (
    <div className="animate-fade-in pb-12">
      <Link
        href={isAdmin ? dashboardHref(inboxView) : repHref(searchParams?.from)}
        className="eyebrow mb-4 inline-flex items-center gap-1.5 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={2} />
        {isAdmin ? "Back to inbox" : "Back to my leads"}
      </Link>

      {lead.archived && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-surface-2 px-4 py-3">
          <span className="mono inline-flex items-center rounded-sm bg-stage-assigned px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">
            Archived
          </span>
          <span className="text-[12.5px] text-ink-dim">
            {archivedReasonLabel(lead.archived_reason)}
          </span>
          {lead.archived_at && (
            <span className="eyebrow">
              archived {formatRelative(lead.archived_at)}
            </span>
          )}
        </div>
      )}

      {/* HEADER — the record's identity panel. The score rides at the right as
          the anchor numeral, matching the oversized numeral on the index pages. */}
      <header className="panel mb-4 grid grid-cols-1 gap-6 p-[18px] lg:grid-cols-[1fr_auto] lg:gap-10 lg:p-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="eyebrow">Lead · {shortId}</span>
            {lead.signal_type && (
              <>
                <span className="text-ink-ghost">/</span>
                <span className="eyebrow text-brand-ink">
                  {String(lead.signal_type).replace(/_/g, " ")}
                </span>
              </>
            )}
            <StatusChip
              status={lead.status}
              repName={currentAssignment?.rep?.full_name}
              className="ml-0.5"
            />
          </div>

          <h1 className="display-serif text-[26px] leading-[1.1] text-ink sm:text-[30px]">
            {lead.company_name}
          </h1>

          {lead.signal_summary && (
            <p className="mt-3.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
              {lead.signal_summary}
            </p>
          )}

          {lead.source_url && (
            <a
              href={lead.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex max-w-full items-center gap-2.5 rounded-md bg-surface-2 px-3.5 py-2.5 transition-colors hover:bg-surface-3"
            >
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0 text-brand-ink"
                strokeWidth={1.75}
              />
              <span className="mono text-[11px] font-medium uppercase tracking-[0.12em] text-brand-ink">
                Read source article
              </span>
              {lead.signal_source && (
                <span className="max-w-[220px] truncate text-[12px] text-ink-faint">
                  {lead.signal_source}
                </span>
              )}
            </a>
          )}

          <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <Field label="Location" value={lead.location} />
            <Field label="Industry" value={lead.industry} />
            <Field label="Warehouse" value={lead.warehouse_size} />
            <Field label="Source" value={lead.signal_source} />
          </dl>
        </div>

        <aside className="flex shrink-0 flex-col items-start gap-5 lg:min-w-[280px] lg:items-end">
          {isAdmin && nextLeadId && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/leads/${nextLeadId}?from=${inboxView}`}>
                Next lead
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <ScoreBadge score={lead.score} size="lg" />
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {/* Order details exist only for a closed sale — the panel stays
                hidden until the lead is Won (meeting 2026-07-11). */}
            {(isAdmin || repOwns) && lead.status === "won" && (
              <OrderProfileDialog leadId={lead.id} sale={dealSale} />
            )}
            {isAdmin ? (
              <>
                <StatusSelector
                  leadId={lead.id}
                  currentStatus={lead.status}
                  role="admin"
                />
                <AssignDialog
                  leadId={lead.id}
                  leadName={lead.company_name}
                  reps={reps}
                  currentRepName={currentAssignment?.rep?.full_name ?? null}
                  triggerVariant="default"
                />
                {["new", "returned", "listed"].includes(lead.status) && (
                  <ListToggleButton
                    leadId={lead.id}
                    isListed={lead.status === "listed"}
                  />
                )}
              </>
            ) : repOwns ? (
              <>
                <StatusSelector
                  leadId={lead.id}
                  currentStatus={lead.status}
                  role="rep"
                />
                <UnclaimButton leadId={lead.id} />
                <ReturnLeadDialog leadId={lead.id} leadName={lead.company_name} />
              </>
            ) : (
              <ClaimButton leadId={lead.id} />
            )}
          </div>
          {currentAssignment?.rep && (
            <div className="lg:text-right">
              <div className="eyebrow mb-1.5">Owner</div>
              <div className="text-[13px] font-medium text-ink">
                {currentAssignment.rep.full_name}
              </div>
              <div className="eyebrow mt-1">
                Since {formatRelative(currentAssignment.assigned_at)}
              </div>
            </div>
          )}
        </aside>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* MAIN COLUMN */}
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Why this is a lead">
            {/* An empty array is truthy — length-check it, or the rubric
                renders nothing and swallows the score_reason fallback. */}
            {lead.score_breakdown?.length ? (
              <ScoreBreakdown breakdown={lead.score_breakdown} />
            ) : lead.score_reason ? (
              <p className="text-[13.5px] leading-relaxed text-ink-2">
                {lead.score_reason}
              </p>
            ) : (
              <Empty>No scoring rationale recorded for this lead yet.</Empty>
            )}
          </Section>

          {lead.bito_products && lead.bito_products.length > 0 && (
            <Section title="BITO products matched">
              <div className="flex flex-wrap gap-2">
                {lead.bito_products.map((p) => (
                  <span
                    key={p}
                    className="mono inline-flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-2"
                  >
                    <span className="dot bg-brand" />
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Contacts" count={contacts.length}>
            {contacts.length === 0 ? (
              <Empty>No contacts captured yet.</Empty>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Outreach drafts">
            <div className="flex flex-col gap-5">
              <DraftBlock
                heading="LinkedIn DM"
                drafts={linkedinDrafts}
                leadId={lead.id}
                emptyMessage="No LinkedIn DM drafted yet."
              />
              <DraftBlock
                heading="Email"
                drafts={emailDrafts}
                leadId={lead.id}
                emptyMessage="No email drafted yet."
                showSubject
              />
              {otherDrafts.length > 0 && (
                <DraftBlock
                  heading="Other"
                  drafts={otherDrafts}
                  leadId={lead.id}
                  emptyMessage=""
                />
              )}
            </div>
          </Section>

          <Section title="Call brief">
            {!latestBrief ? (
              <Empty>No call brief generated yet.</Empty>
            ) : (
              <div className="overflow-hidden rounded-lg bg-surface-2">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="eyebrow">
                    Generated {formatRelative(latestBrief.generated_at)}
                  </span>
                  <CopyButton value={latestBrief.brief_content} label="Copy brief" />
                </div>
                <pre className="whitespace-pre-wrap px-4 pb-4 font-sans text-[13px] leading-relaxed text-ink-2">
                  {latestBrief.brief_content}
                </pre>
              </div>
            )}
          </Section>

          <Section title="Notes" count={notes.length}>
            <LeadNotes leadId={lead.id} notes={notes} />
          </Section>
        </div>

        {/* SIDE COLUMN */}
        <aside className="flex min-w-0 flex-col gap-4">
          <LeadReviewCard leadId={lead.id} review={review} />

          {currentAssignment?.notes && (
            <Section title="Assignment note">
              <blockquote className="border-l-2 border-brand pl-3.5 text-[13px] italic leading-relaxed text-ink-2">
                &ldquo;{currentAssignment.notes}&rdquo;
              </blockquote>
            </Section>
          )}

          <Section title="Pipeline history">
            {pipeline_updates.length === 0 ? (
              <Empty>No status changes yet.</Empty>
            ) : (
              <ol>
                {pipeline_updates.map((u, i) => (
                  <li
                    key={u.id}
                    className="relative grid grid-cols-[14px_1fr] gap-3 pb-4 last:pb-0"
                  >
                    {i < pipeline_updates.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-[3px] top-3.5 w-px bg-line"
                      />
                    )}
                    <span className="dot relative z-10 mt-1.5 bg-brand" />
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-ink">
                        <span className="text-ink-dim">
                          {u.old_status ? LEAD_STATUS_LABELS[u.old_status] : "—"}
                        </span>
                        <ArrowRight
                          className="mx-1.5 inline h-3 w-3 align-[-1px] text-ink-faint"
                          strokeWidth={2}
                        />
                        <span className="font-medium">
                          {LEAD_STATUS_LABELS[u.new_status]}
                        </span>
                      </div>
                      <div className="eyebrow mt-1">
                        {formatRelative(u.updated_at)}
                      </div>
                      {u.note && (
                        <div className="mt-1.5 text-[12.5px] leading-snug text-ink-dim">
                          {u.note}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Created">
            <div className="mono text-[12px] text-ink-2">
              {new Date(lead.created_at).toLocaleString("en-GB", {
                timeZone: "Asia/Dubai",
              })}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}

/**
 * A titled block on its own panel. The heading row holds still at the top so
 * the eye finds the same anchor down the column, and the count sits at the
 * right rather than inline with the title.
 */
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-[18px] lg:p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="text-[13.5px] font-bold text-ink">{title}</h2>
        {count !== undefined && (
          <span className="mono text-[11px] tabular text-ink-faint">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/** Every v2 field can be absent, so an empty state is designed, never blank. */
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] text-ink-faint">{children}</p>;
}

function ContactCard({
  contact: c,
}: {
  contact: import("@/lib/supabase/types").Contact;
}) {
  return (
    <div className="rounded-lg bg-surface-2 p-3.5 transition-colors hover:bg-surface-3">
      <div className="flex items-start gap-3">
        <div className="display-serif flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-[15px] text-ink-2">
          {initials(c.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[13.5px] font-medium text-ink">
              {c.full_name}
            </span>
            {c.is_primary && (
              <span className="mono inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-brand-ink">
                <span className="dot bg-brand" />
                Primary
              </span>
            )}
          </div>
          {c.job_title && (
            <p className="mt-0.5 text-[12px] text-ink-dim">{c.job_title}</p>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            {c.email && (
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={`mailto:${c.email}`}
                  className="mono inline-flex min-w-0 items-center gap-1.5 text-[11px] text-ink-2 transition-colors hover:text-brand-ink"
                >
                  <Mail className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{c.email}</span>
                </a>
                <CopyButton value={c.email} label="Copy email" iconOnly />
                <a
                  href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
                    c.email
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Compose in Outlook"
                  className="mono inline-flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-brand-ink"
                >
                  <Send className="h-3 w-3" strokeWidth={1.75} />
                  Outlook
                </a>
              </div>
            )}
            {c.phone && (
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="mono inline-flex min-w-0 items-center gap-1.5 text-[11px] text-ink-2 transition-colors hover:text-brand-ink"
                >
                  <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{c.phone}</span>
                </a>
                <CopyButton value={c.phone} label="Copy phone" iconOnly />
              </div>
            )}
            {c.linkedin_url && (
              <a
                href={c.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-flex items-center gap-1.5 text-[11px] text-ink-2 transition-colors hover:text-brand-ink"
              >
                <Linkedin className="h-3 w-3" strokeWidth={1.75} />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd className="text-[12.5px] text-ink-2">
        {value || <span className="text-ink-faint">—</span>}
      </dd>
    </div>
  );
}

function DraftBlock({
  heading,
  drafts,
  leadId,
  emptyMessage,
  showSubject,
}: {
  heading: string;
  drafts: {
    id: string;
    subject: string | null;
    body: string;
    used: boolean;
    created_at: string;
  }[];
  leadId: string;
  emptyMessage: string;
  showSubject?: boolean;
}) {
  if (drafts.length === 0 && !emptyMessage) return null;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 className="text-[12.5px] font-semibold text-ink">{heading}</h3>
        {drafts[0] && (
          <div className="flex items-center gap-3">
            <OutreachUsedToggle
              outreachId={drafts[0].id}
              leadId={leadId}
              used={drafts[0].used}
              channelLabel={heading}
            />
            <CopyButton
              value={
                showSubject && drafts[0].subject
                  ? `Subject: ${drafts[0].subject}\n\n${drafts[0].body}`
                  : drafts[0].body
              }
              label={`Copy ${heading.toLowerCase()}`}
            />
          </div>
        )}
      </div>
      {drafts.length === 0 ? (
        <Empty>{emptyMessage}</Empty>
      ) : (
        <div className="overflow-hidden rounded-lg bg-surface-2">
          {showSubject && drafts[0].subject && (
            <div
              className={cn(
                "mono px-4 pt-3 text-[11px] text-ink-dim",
                "border-b border-line-soft pb-3"
              )}
            >
              <span className="text-ink-faint">Subject:</span>{" "}
              <span className="text-ink">{drafts[0].subject}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap px-4 py-3.5 font-sans text-[13px] leading-relaxed text-ink-2">
            {drafts[0].body}
          </pre>
          <div className="eyebrow px-4 pb-3">
            Generated {formatRelative(drafts[0].created_at)}
          </div>
        </div>
      )}
    </div>
  );
}
