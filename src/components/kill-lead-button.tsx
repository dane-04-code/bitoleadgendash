"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { killLead } from "@/app/actions";

export function KillLeadButton({
  leadId,
  leadName,
}: {
  leadId: string;
  leadName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleConfirm() {
    const fd = new FormData();
    fd.set("leadId", leadId);
    setError(null);
    startTransition(async () => {
      const result = await killLead(fd);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-signal-hot/70 hover:text-signal-hot hover:bg-signal-hot/[0.06]">
          Kill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kill this lead?</DialogTitle>
          <DialogDescription>
            This will mark <span className="text-ink font-medium">{leadName}</span> as
            dead and move it out of the live inbox. You can still review it from
            the Killed inbox tab and the pipeline Dead column.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-[12px] text-signal-hot">{error}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Killing…" : "Kill lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
