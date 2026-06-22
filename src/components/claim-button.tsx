"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { claimLead } from "@/app/actions";
import { Hand, Loader2 } from "lucide-react";

/**
 * Rep action to claim a listed lead. Pass `redirectTo` to send them to the
 * lead after claiming (used from the marketplace); otherwise just refreshes.
 */
export function ClaimButton({
  leadId,
  redirectTo,
  size = "sm",
  variant = "default",
  className,
}: {
  leadId: string;
  redirectTo?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "ghost" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("leadId", leadId);
    const result = await claimLead(fd);
    if (!result.ok) {
      setPending(false);
      setError(result.error || "Could not claim this lead.");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={onClick}
        disabled={pending}
        size={size}
        variant={variant}
        className={className}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Hand className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {pending ? "Claiming…" : "Claim"}
      </Button>
      {error && (
        <span className="mono text-[10px] text-signal-hot text-right max-w-[200px]">
          {error}
        </span>
      )}
    </div>
  );
}
