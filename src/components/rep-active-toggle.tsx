"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleRepActive } from "@/app/actions";

/**
 * Admin control to take a rep out of rotation, or bring them back.
 *
 * Deactivating drops them from the assignment picker and moves their card to
 * the Inactive section; their leads and history are untouched. This is the
 * reversible counterpart to DeleteRepDialog, so it needs no confirmation step —
 * one more click puts it back.
 */
export function RepActiveToggle({
  repId,
  repName,
  isActive,
}: {
  repId: string;
  repName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const result = await toggleRepActive(repId, !isActive);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Could not update this rep.");
      return;
    }
    router.refresh();
  }

  const Icon = isActive ? UserMinus : UserCheck;

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Button
        onClick={onClick}
        disabled={pending}
        size="sm"
        variant={isActive ? "ghost" : "secondary"}
        aria-label={
          isActive ? `Deactivate ${repName}` : `Reactivate ${repName}`
        }
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {isActive ? "Deactivate" : "Reactivate"}
      </Button>
      {error && (
        <span className="mono max-w-[200px] text-[10px] text-signal-hot">
          {error}
        </span>
      )}
    </div>
  );
}
