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
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("leadId", leadId);
    for (const c of REVIEW_CATEGORIES) {
      const v = scores[c.key];
      if (v != null) fd.set(c.key, String(v));
    }
    fd.set("comment", comment);
    startTransition(async () => {
      await saveLeadReview(fd);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 bg-surface-2">
        <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
          Manual review
        </span>
        <span className="inline-flex items-center rounded-sm border border-signal-warm/40 bg-signal-warm/[0.08] px-1.5 py-0.5 mono text-[9px] uppercase tracking-wider text-signal-warm">
          Temp
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {REVIEW_CATEGORIES.map((c) => (
          <div key={c.key}>
            <div className="mono text-[10px] uppercase tracking-wider text-ink-dim mb-1.5">
              {c.label}
            </div>
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
                      "flex-1 h-7 rounded-sm border text-[12px] mono tabular transition-colors",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface-2 text-ink-dim hover:border-line-strong hover:text-ink"
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
          <div className="mono text-[10px] uppercase tracking-wider text-ink-dim mb-1.5">
            Comment
          </div>
          <Textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
            }}
            placeholder="Anything worth noting on this lead…"
            rows={3}
            className="text-[12px]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
        <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
          {review?.updated_at ? (
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
    </div>
  );
}
