"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  REVIEW_CATEGORIES,
  type LeadReview,
  type ReviewCategoryKey,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveLeadReview } from "@/app/actions";
import { cn, formatRelative } from "@/lib/utils";

type Scores = Record<ReviewCategoryKey, number | null>;

function fromReview(review: LeadReview | null): Scores {
  return {
    contact_accuracy: review?.contact_accuracy ?? null,
    relevancy: review?.relevancy ?? null,
    score_accuracy: review?.score_accuracy ?? null,
    gut_feel: review?.gut_feel ?? null,
  };
}

export function LeadReviewCard({
  leadId,
  review,
}: {
  leadId: string;
  review: LeadReview | null;
}) {
  const router = useRouter();
  const [scores, setScores] = React.useState<Scores>(() => fromReview(review));
  const [comment, setComment] = React.useState(review?.comment ?? "");
  const [saved, setSaved] = React.useState(false); // saved flash
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Keep in sync if the server data changes after a refresh.
  React.useEffect(() => {
    setScores(fromReview(review));
    setComment(review?.comment ?? "");
  }, [review]);

  const dirty = React.useMemo(() => {
    const base = fromReview(review);
    const scoresDirty = REVIEW_CATEGORIES.some((c) => base[c.key] !== scores[c.key]);
    const commentDirty = (review?.comment ?? "") !== comment;
    return scoresDirty || commentDirty;
  }, [scores, comment, review]);

  function set(key: ReviewCategoryKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("leadId", leadId);
    for (const c of REVIEW_CATEGORIES) {
      const v = scores[c.key];
      if (v != null) fd.set(c.key, String(v));
    }
    fd.set("comment", comment);
    setError(null);
    startTransition(async () => {
      const result = await saveLeadReview(fd);
      if (result && result.ok === false) {
        setError(result.error ?? "Couldn’t save. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className="panel p-[18px] lg:p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="text-[13.5px] font-bold text-ink">Manual review</h2>
        <span className="mono rounded-sm bg-stage-assigned px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">
          Temp
        </span>
      </div>

      <div className="space-y-3.5">
        {REVIEW_CATEGORIES.map((c) => (
          <div key={c.key}>
            <div className="eyebrow mb-1.5">{c.label}</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = scores[c.key] === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set(c.key, n)}
                    aria-label={`${c.label}: ${n} of 5`}
                    aria-pressed={active}
                    className={cn(
                      "mono tabular h-7 flex-1 rounded-md text-[12px] transition-colors",
                      active
                        ? "bg-brand text-white"
                        : "bg-surface-2 text-ink-dim hover:bg-surface-3 hover:text-ink"
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <div className="eyebrow mb-1.5">Comment</div>
          <Textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
              setError(null);
            }}
            placeholder="Anything worth noting on this lead…"
            rows={3}
            className="text-[12px]"
          />
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
        <span className="eyebrow min-w-0 truncate">
          {error ? (
            <span className="text-signal-hot normal-case tracking-normal">{error}</span>
          ) : review?.updated_at ? (
            <>
              {review.reviewed_by ? `${review.reviewed_by} · ` : ""}
              {formatRelative(review.updated_at)}
            </>
          ) : (
            "Not scored yet"
          )}
        </span>
        <Button
          type="button"
          size="sm"
          variant={dirty ? "default" : "secondary"}
          onClick={handleSave}
          disabled={pending || (!dirty && !saved)}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved && !dirty ? (
            <Check className="h-3.5 w-3.5 text-signal-good" />
          ) : null}
          {saved && !dirty ? "Saved" : "Save"}
        </Button>
      </div>
    </section>
  );
}
