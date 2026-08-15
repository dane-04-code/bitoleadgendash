"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Undo2, Loader2 } from "lucide-react";
import { markOutreachUsed } from "@/app/actions";
import { cn } from "@/lib/utils";

/**
 * Marks one outreach draft as sent, or undoes it.
 *
 * Sent state carries the word "Sent" beside its tint, not the tint alone — the
 * palette is a single hue, so colour never carries status on its own here.
 */
export function OutreachUsedToggle({
  outreachId,
  leadId,
  used,
  channelLabel,
}: {
  outreachId: string;
  leadId: string;
  used: boolean;
  /** e.g. "LinkedIn DM" — only used to label the control for screen readers. */
  channelLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const result = await markOutreachUsed(outreachId, leadId, !used);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Could not update this draft.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="mono max-w-[160px] truncate text-[10px] text-signal-hot">
          {error}
        </span>
      )}

      {used && (
        <span className="mono inline-flex items-center gap-1.5 rounded-sm bg-signal-good/[0.12] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-signal-good">
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          Sent
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={
          used
            ? `Mark ${channelLabel} as not sent`
            : `Mark ${channelLabel} as sent`
        }
        className={cn(
          "mono inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] transition-colors",
          "text-ink-faint hover:bg-surface-3 hover:text-ink",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : used ? (
          <Undo2 className="h-3 w-3" strokeWidth={2} aria-hidden />
        ) : (
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        )}
        {used ? "Undo" : "Mark sent"}
      </button>
    </div>
  );
}
