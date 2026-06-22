import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllFeedback, getRepById } from "@/lib/queries";
import { PageHeader, MetaItem } from "@/components/page-header";
import { FeedbackForm } from "@/components/feedback-form";
import { FeedbackStatusSelector } from "@/components/feedback-status-selector";
import {
  FEEDBACK_CATEGORY_LABELS,
  type Feedback,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/supabase/types";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";

  // Reps mid forced-password reset must clear it before doing anything else.
  if (!isAdmin) {
    const rep = await getRepById(session.subject);
    if (rep?.must_change_password) redirect("/my/account");
  }

  const items = isAdmin ? await getAllFeedback() : [];
  const openCount = items.filter((f) => f.status === "new").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        number={isAdmin ? "05" : "03"}
        eyebrow="Lead Intelligence Terminal / Feedback"
        title={
          <>
            Ideas &amp; <em className="text-brand-ink">suggestions</em>.
          </>
        }
        subtitle="Spotted a bug or have an idea to make this better? Send it through — the admin reviews every submission."
        meta={
          isAdmin ? (
            <>
              <MetaItem label="Total" value={items.length} />
              <MetaItem label="New" value={openCount} accent />
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.4fr)] gap-10">
        {/* SUBMIT */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
            <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
              A
            </span>
            <h2 className="display-serif text-xl text-ink leading-none">
              Send feedback
            </h2>
          </div>
          <div className="border border-line bg-surface p-5">
            <FeedbackForm />
          </div>
        </section>

        {/* ADMIN REVIEW LIST */}
        {isAdmin && (
          <section>
            <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-line">
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
                B
              </span>
              <h2 className="display-serif text-xl text-ink leading-none">
                Submissions
              </h2>
              <span className="mono text-[10px] uppercase tracking-wider text-ink-faint ml-auto">
                {items.length} entries
              </span>
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-line px-6 py-16 text-center">
                <div className="display-serif text-5xl text-ink-faint/30 mb-3">
                  ∅
                </div>
                <h3 className="display-serif text-xl text-ink mb-2">
                  No feedback yet.
                </h3>
                <p className="text-[13px] text-ink-dim max-w-xs mx-auto">
                  Suggestions from you and your reps will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-px bg-line border border-line">
                {items.map((f) => (
                  <FeedbackRow key={f.id} item={f} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function FeedbackRow({ item }: { item: Feedback }) {
  const categoryLabel =
    FEEDBACK_CATEGORY_LABELS[item.category as FeedbackCategory] ?? item.category;
  return (
    <li className="bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
            <span className="inline-flex items-center rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-ink-2">
              {categoryLabel}
            </span>
            <span className="text-ink-2">{item.author || "Unknown"}</span>
            {item.author_role && <span>· {item.author_role}</span>}
            <span>· {formatRelative(item.created_at)}</span>
          </div>
          <p className="text-[13px] text-ink-2 leading-relaxed whitespace-pre-wrap">
            {item.body}
          </p>
        </div>
        <div className="shrink-0">
          <FeedbackStatusSelector
            id={item.id}
            currentStatus={item.status as FeedbackStatus}
          />
        </div>
      </div>
    </li>
  );
}
