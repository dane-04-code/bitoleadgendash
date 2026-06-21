"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { returnLead } from "@/app/actions";
import { Undo2, Loader2 } from "lucide-react";

/**
 * Lets the owning rep send a lead back to the admin with a required reason.
 * On success the lead leaves the rep's board, so we route them back to /my.
 */
export function ReturnLeadDialog({
  leadId,
  leadName,
}: {
  leadId: string;
  leadName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Please give a reason for returning this lead.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("reason", reason.trim());
    const result = await returnLead(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not return this lead.");
      return;
    }
    setOpen(false);
    setReason("");
    // The lead no longer belongs to this rep — go back to their inbox.
    router.push("/my");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          Return lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="eyebrow text-brand-ink mb-1">Send back to admin</div>
          <DialogTitle>{leadName}</DialogTitle>
          <DialogDescription>
            This removes the lead from your board and returns it to the admin to
            re-route. Let them know why — your reason is saved as a note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="returnReason">Reason</Label>
            <Textarea
              id="returnReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. wrong territory, bad contact details, no fit for my specialty…"
              rows={3}
              autoFocus
            />
          </div>

          {error && (
            <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? "Returning…" : "Return lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
