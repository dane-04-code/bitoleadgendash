"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/lib/supabase/types";
import { submitFeedback } from "@/app/actions";

export function FeedbackForm() {
  const router = useRouter();
  const [category, setCategory] = React.useState<FeedbackCategory>("idea");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Please enter your feedback.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("category", category);
    fd.set("body", body.trim());
    const result = await submitFeedback(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not submit feedback.");
      return;
    }
    setBody("");
    setCategory("idea");
    setSent(true);
    router.refresh();
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as FeedbackCategory)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEEDBACK_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {FEEDBACK_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedbackBody">Your suggestion</Label>
        <Textarea
          id="feedbackBody"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What would make this better? Spotted a bug? Tell us…"
          rows={5}
        />
      </div>

      {error && (
        <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-line">
        <div className="min-h-[28px] flex items-center">
          {sent && (
            <span className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider text-signal-good">
              <Check className="h-3 w-3" />
              Thanks — sent
            </span>
          )}
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {submitting ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
