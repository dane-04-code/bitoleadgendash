import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
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
  getRepById,
} from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { AssignDialog } from "@/components/assign-dialog";
import { StatusSelector } from "@/components/status-selector";
import { ReturnLeadDialog } from "@/components/return-lead-dialog";
import { LeadNotes } from "@/components/lead-notes";
import { LeadReviewCard } from "@/components/lead-review";
import { LEAD_STATUS_LABELS, archivedReasonLabel } from "@/lib/supabase/types";
import { formatRelative, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) notFound();

  // Reps can only see leads assigned to them, and must clear a forced password
  // change before working any lead.
  if (session.role === "rep") {
    const rep = await getRepById(session.subject);
    if (rep?.must_change_password) redirect("/my/account");
    const owns = await isLeadOwnedByRep(params.id, session.subject);
    if (!owns) notFound();
  }

  const data = await getLeadById(params.id);
  if (!data || !data.lead) notFound();

  const { lead, contacts, outreach, call_briefs, assignments, pipeline_updates } = data;
  const isAdmin = session.role === "admin";
  const [reps, notes, review] = await Promise.all([
    isAdmin ? getActiveReps() : Promise.resolve([]),
    getLeadNotes(params.id),
    getLeadReview(params.id),
  ]);

  const currentAssignment = assignments[0];
  const linkedinDrafts = outreach.filter((o) => o.channel === "linkedin");
  const emailDrafts = outreach.filter((o) => o.channel === "email");
  const otherDrafts = outreach.filter((o) => o.channel !== "linkedin" && o.channel !== "email");
  const latestBrief = call_briefs[0];
  const shortId = lead.id.split("-")[0]?.toUpperCase();

  return (
    <div className="animate-fade-in pb-12">
      <Link
        href={isAdmin ? "/dashboard" : "/my"}
        className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3 w-3" />
        {isAdmin ? "Back to inbox" : "Back to my leads"}
      </Link>

      {lead.archived && (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border border-signal-warm/30 bg-signal-warm/[0.05] px-4 py-3">
          <span className="inline-flex items-center rounded-sm border border-signal-warm/40 bg-signal-warm/[0.08] px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider text-signal-warm">
            ⚑ Archived
          </span>
          <span className="text-[12px] text-ink-dim">
            {archivedReasonLabel(lead.archived_reason)}
          </span>
          {lead.archived_at && (
            <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
              · archived {formatRelative(lead.archived_at)}
            </span>
          )}
        </div>
      )}

      {/* HEADER */}
      <header className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 pb-8 mb-8 border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mono text-[10px] uppercase tracking-wider text-ink-faint mb-4">
            <span>Lead · {shortId}</span>
            <span className="text-ink-faint/40">/</span>
            {lead.signal_type && (
              <span className="text-brand-ink">
                {String(lead.signal_type).replace(/_/g, " ")}
              </span>
            )}
            <span className="text-ink-faint/40">/</span>
            <StatusInline status={lead.status} />
          </div>

          <h1 className="text-[30px] sm:text-[40px] font-bold leading-[1.05] tracking-tight text-ink">
            {lead.company_name}
          </h1>

          {lead.signal_summary && (
            <p className="text-[15px] text-ink-2 mt-5 max-w-2xl leading-relaxed">
              {lead.signal_summary}
            </p>
          )}

          {lead.source_url && (
            <a
              href={lead.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/article inline-flex items-center gap-2.5 mt-5 border border-line bg-surface px-4 py-2.5 hover:border-brand/45 hover:bg-brand/[0.05] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-brand-ink shrink-0" strokeWidth={1.75} />
              <span className="mono text-[11px] uppercase tracking-wider text-brand-ink">
                Read source article
              </span>
              {lead.signal_source && (
                <span className="text-[12px] text-ink-faint border-l border-line pl-2.5 truncate max-w-[220px]">
                  {lead.signal_source}
                </span>
              )}
            </a>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 mt-7 max-w-3xl">
            <Field label="Location" value={lead.location} />
            <Field label="Industry" value={lead.industry} />
            <Field label="Warehouse" value={lead.warehouse_size} />
            <Field label="Source" value={lead.signal_source} />
          </dl>
        </div>

        <aside className="flex flex-col items-start lg:items-end gap-5 shrink-0 lg:min-w-[280px]">
          <ScoreBadge score={lead.score} size="lg" />
          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <StatusSelector
              leadId={lead.id}
              currentStatus={lead.status}
              role={session.role}
            />
            {isAdmin ? (
              <AssignDialog
                leadId={lead.id}
                leadName={lead.company_name}
                reps={reps}
                currentRepName={currentAssignment?.rep?.full_name ?? null}
                triggerVariant="default"
              />
            ) : (
              <ReturnLeadDialog leadId={lead.id} leadName={lead.company_name} />
            )}
          </div>
          {currentAssignment?.rep && (
            <div className="text-right">
              <div className="eyebrow mb-1.5">Owner</div>
              <div className="text-[13px] text-ink">
                {currentAssignment.rep.full_name}
              </div>
              <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-1">
                Since {formatRelative(currentAssignment.assigned_at)}
              </div>
            </div>
          )}
        </aside>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* MAIN COLUMN */}
        <div className="space-y-10 min-w-0">
          {lead.score_reason && (
            <Section eyebrow="Why this is a lead" code="A">
              <p className="text-[15px] leading-relaxed text-ink-2">
                {lead.score_reason}
              </p>
            </Section>
          )}

          {lead.bito_products && lead.bito_products.length > 0 && (
            <Section eyebrow="BITO products matched" code="B">
              <div className="flex flex-wrap gap-2">
                {lead.bito_products.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-2 border border-line bg-surface px-2.5 py-1.5 mono text-[11px] uppercase tracking-wider text-ink-2"
                  >
                    <span className="dot bg-brand" />
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section eyebrow="Contacts" code="C" count={contacts.length}>
            {contacts.length === 0 ? (
              <p className="text-[13px] text-ink-faint italic">
                No contacts captured yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
                {contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            )}
          </Section>

          <Section eyebrow="Outreach drafts" code="D">
            <div className="space-y-6">
              <DraftBlock
                heading="LinkedIn DM"
                drafts={linkedinDrafts}
                emptyMessage="No LinkedIn DM drafted yet."
              />
              <DraftBlock
                heading="Email"
                drafts={emailDrafts}
                emptyMessage="No email drafted yet."
                showSubject
              />
              {otherDrafts.length > 0 && (
                <DraftBlock heading="Other" drafts={otherDrafts} emptyMessage="" />
              )}
            </div>
          </Section>

          <Section eyebrow="Call brief" code="E">
            {!latestBrief ? (
              <p className="text-[13px] text-ink-faint italic">
                No call brief generated yet.
              </p>
            ) : (
              <div className="border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5 bg-surface-2">
                  <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
                    Generated {formatRelative(latestBrief.generated_at)}
                  </span>
                  <CopyButton value={latestBrief.brief_content} label="Copy brief" />
                </div>
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2 font-sans p-5">
                  {latestBrief.brief_content}
                </pre>
              </div>
            )}
          </Section>

          <Section eyebrow="Notes" code="F" count={notes.length}>
            <LeadNotes leadId={lead.id} notes={notes} />
          </Section>
        </div>

        {/* SIDE COLUMN */}
        <aside className="space-y-8 lg:border-l lg:border-line lg:pl-8 min-w-0">
          <div>
            <div className="eyebrow mb-3">Manual review</div>
            <LeadReviewCard leadId={lead.id} review={review} />
          </div>

          {currentAssignment?.notes && (
            <div>
              <div className="eyebrow mb-3">Assignment note</div>
              <blockquote className="display-serif text-lg text-ink-2 leading-snug border-l-2 border-brand pl-4 italic">
                &ldquo;{currentAssignment.notes}&rdquo;
              </blockquote>
            </div>
          )}

          <div>
            <div className="eyebrow mb-3">Pipeline history</div>
            {pipeline_updates.length === 0 ? (
              <p className="text-[13px] text-ink-faint italic">
                No status changes yet.
              </p>
            ) : (
              <ol className="space-y-0">
                {pipeline_updates.map((u, i) => (
                  <li
                    key={u.id}
                    className="grid grid-cols-[20px_1fr] gap-3 relative pb-4"
                  >
                    {i < pipeline_updates.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[3px] top-3 bottom-0 w-px bg-line"
                      />
                    )}
                    <span className="dot bg-brand mt-1.5 ml-px relative z-10" />
                    <div>
                      <div className="text-[12px] text-ink">
                        <span className="text-ink-dim">{u.old_status || "—"}</span>
                        <span className="mx-1.5 text-ink-faint">→</span>
                        <span className="font-medium">{u.new_status}</span>
                      </div>
                      <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
                        {formatRelative(u.updated_at)}
                      </div>
                      {u.note && (
                        <div className="text-[12px] text-ink-dim mt-1.5 leading-snug">
                          {u.note}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <div className="eyebrow mb-3">Created</div>
            <div className="mono text-[12px] text-ink-2">
              {new Date(lead.created_at).toLocaleString("en-GB", {
                timeZone: "Asia/Dubai",
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  code,
  count,
  children,
}: {
  eyebrow: string;
  code?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
        {code && (
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            {code}
          </span>
        )}
        <h2 className="display-serif text-xl text-ink leading-none">{eyebrow}</h2>
        {count !== undefined && (
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint ml-auto">
            {count} entries
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function ContactCard({
  contact: c,
}: {
  contact: import("@/lib/supabase/types").Contact;
}) {
  return (
    <div className="bg-surface p-4 hover:bg-surface-2 transition-colors">
      <div className="flex items-start gap-3">
        <div className="display-serif text-xl text-ink-2 w-10 h-10 border border-line-strong flex items-center justify-center shrink-0">
          {initials(c.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-ink truncate">
              {c.full_name}
            </span>
            {c.is_primary && (
              <span className="mono text-[9px] uppercase tracking-wider text-brand-ink">
                ◆ Primary
              </span>
            )}
          </div>
          {c.job_title && (
            <p className="text-[12px] text-ink-dim mt-0.5">{c.job_title}</p>
          )}

          <div className="flex flex-col gap-1.5 mt-3">
            {c.email && (
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 mono text-[11px] text-ink-2 hover:text-brand-ink transition-colors min-w-0"
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
                  className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-brand-ink transition-colors shrink-0"
                >
                  <Send className="h-3 w-3" strokeWidth={1.75} />
                  Outlook
                </a>
              </div>
            )}
            {c.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-1.5 mono text-[11px] text-ink-2 hover:text-brand-ink transition-colors min-w-0"
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
                className="inline-flex items-center gap-1.5 mono text-[11px] text-ink-2 hover:text-brand-ink transition-colors"
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
    <div>
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd className="text-[13px] text-ink-2">
        {value || <span className="text-ink-faint">—</span>}
      </dd>
    </div>
  );
}

function StatusInline({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "text-signal-cold",
    assigned: "text-signal-warm",
    contacted: "text-signal-cold",
    meeting: "text-brand-ink",
    proposal: "text-brand-ink",
    won: "text-signal-good",
    dead: "text-ink-faint",
    returned: "text-signal-hot",
  };
  return (
    <span className={map[status] || "text-ink-dim"}>
      {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    </span>
  );
}

function DraftBlock({
  heading,
  drafts,
  emptyMessage,
  showSubject,
}: {
  heading: string;
  drafts: { id: string; subject: string | null; body: string; created_at: string }[];
  emptyMessage: string;
  showSubject?: boolean;
}) {
  if (drafts.length === 0 && !emptyMessage) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-medium text-ink">{heading}</h3>
        {drafts[0] && (
          <CopyButton
            value={
              showSubject && drafts[0].subject
                ? `Subject: ${drafts[0].subject}\n\n${drafts[0].body}`
                : drafts[0].body
            }
            label={`Copy ${heading.toLowerCase()}`}
          />
        )}
      </div>
      {drafts.length === 0 ? (
        <p className="text-[12px] text-ink-faint italic">{emptyMessage}</p>
      ) : (
        <div className="border border-line bg-surface-2">
          {showSubject && drafts[0].subject && (
            <div className="border-b border-line px-4 py-2.5 mono text-[11px] text-ink-dim">
              <span className="text-ink-faint">Subject:</span>{" "}
              <span className="text-ink">{drafts[0].subject}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2 font-sans p-4">
            {drafts[0].body}
          </pre>
          <div className="border-t border-line px-4 py-2 mono text-[10px] uppercase tracking-wider text-ink-faint">
            Generated {formatRelative(drafts[0].created_at)}
          </div>
        </div>
      )}
    </div>
  );
}
