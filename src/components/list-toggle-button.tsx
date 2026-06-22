"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listLead, unlistLead } from "@/app/actions";
import { Tag, Loader2 } from "lucide-react";

/**
 * Admin toggle to publish / withdraw a lead on the marketplace. Shown only for
 * unowned leads (new / returned / listed); owned leads can't be listed.
 */
export function ListToggleButton({
  leadId,
  isListed,
}: {
  leadId: string;
  isListed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("leadId", leadId);
    const result = await (isListed ? unlistLead(fd) : listLead(fd));
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Could not update the marketplace.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={onClick}
        disabled={pending}
        size="sm"
        variant={isListed ? "outline" : "secondary"}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {isListed ? "Unlist" : "List on marketplace"}
      </Button>
      {error && (
        <span className="mono text-[10px] text-signal-hot text-right max-w-[200px]">
          {error}
        </span>
      )}
    </div>
  );
}
