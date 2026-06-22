"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { unclaimLead } from "@/app/actions";
import { RotateCcw, Loader2 } from "lucide-react";

/**
 * Rep action to release a lead they hold back onto the marketplace. Works on
 * both claimed and admin-assigned leads. Sends them back to /my afterwards.
 */
export function UnclaimButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("leadId", leadId);
    const result = await unclaimLead(fd);
    if (!result.ok) {
      setPending(false);
      setError(result.error || "Could not unclaim this lead.");
      return;
    }
    router.push("/my");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={onClick} disabled={pending} size="sm" variant="outline">
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {pending ? "Unclaiming…" : "Unclaim"}
      </Button>
      {error && (
        <span className="mono text-[10px] text-signal-hot max-w-[220px]">
          {error}
        </span>
      )}
    </div>
  );
}
