import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllFeedback, getRepById } from "@/lib/queries";
import { StatStrip, Stat } from "@/components/stat-strip";
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
      <h1 className="sr-only">Feedback — ideas and suggestions</h1>

      <StatStrip number={isAdmin ? "05" : "03"} className="mb-5">
        {isAdmin ? (
          <>
            <Stat label="Total" value={items.length} />
            <Stat label="New" value={openCount} tone="brand" />
          </>
        ) : (
          <Stat label="Feedback" value="Open" tone="brand" />
        )}
      </StatStrip>

      <p className="mb-5 max-w-2xl text-[12.5px] leading-relaxed text-ink-dim">
        Spotted a bug or have an idea to make this better? Send it through — the
        admin reviews every submission.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(0,1.4fr)]">
        {/* SUBMIT */}
        <section className="panel p-[18px] lg:p-5">
          <h2 className="mb-3.5 text-[13.5px] font-bold text-ink">Send feedback</h2>
          <FeedbackForm />
        </section>

        {/* ADMIN REVIEW LIST */}
        {isAdmin && (
          <section className="panel p-[18px] lg:p-5">
            <div className="mb-3.5 flex items-baseline justify-between gap-3">
              <h2 className="text-[13.5px] font-bold text-ink">Submissions</h2>
              <span className="mono tabular text-[11px] text-ink-faint">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg bg-surface-2 px-6 py-14 text-center">
                <div className="display-serif mb-3 text-5xl text-ink-ghost">∅</div>
                <h3 className="display-serif mb-2 text-xl text-ink">
                  No feedback yet.
                </h3>
                <p className="mx-auto max-w-xs text-[12.5px] text-ink-dim">
                  Suggestions from you and your reps will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
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
    <li className="rounded-lg bg-surface-2 p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="eyebrow mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-sm bg-surface px-1.5 py-0.5 text-ink-2">
              {categoryLabel}
            </span>
            <span className="text-ink-2">{item.author || "Unknown"}</span>
            {item.author_role && <span>· {item.author_role}</span>}
            <span>· {formatRelative(item.created_at)}</span>
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
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
