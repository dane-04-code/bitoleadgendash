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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Rep } from "@/lib/supabase/types";
import { assignLeadToRep } from "@/app/actions";
import { UserPlus, Loader2 } from "lucide-react";

interface AssignDialogProps {
  leadId: string;
  leadName: string;
  reps: Rep[];
  currentRepName?: string | null;
  triggerLabel?: string;
  triggerVariant?: "default" | "secondary" | "ghost" | "outline";
  triggerSize?: "sm" | "default" | "lg";
  triggerClassName?: string;
}

export function AssignDialog({
  leadId,
  leadName,
  reps,
  currentRepName,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
  triggerClassName,
}: AssignDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [repId, setRepId] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    if (!repId) {
      setError("Please choose a sales rep.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("repId", repId);
    if (notes) fd.set("notes", notes);
    const result = await assignLeadToRep(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not assign lead.");
      return;
    }
    setOpen(false);
    setRepId("");
    setNotes("");
    router.refresh();
  }

  const label = triggerLabel ?? (currentRepName ? "Reassign" : "Assign");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="eyebrow text-brand-ink mb-1">Route lead</div>
          <DialogTitle>{leadName}</DialogTitle>
          <DialogDescription>
            {currentRepName ? (
              <>
                Currently assigned to{" "}
                <span className="text-ink">{currentRepName}</span>. Choose a
                rep to reassign.
              </>
            ) : (
              "Choose a sales rep to take ownership of this lead."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sales rep</Label>
            <Select value={repId} onValueChange={setRepId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rep..." />
              </SelectTrigger>
              <SelectContent>
                {reps.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[12px] text-ink-faint italic">
                    No active reps. Add one on the Team page.
                  </div>
                ) : (
                  reps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="text-ink">{r.full_name}</span>
                      {r.territory && (
                        <span className="text-ink-faint">
                          {" "}· {r.territory}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context for the rep — angle, urgency, who to reach…"
              rows={3}
            />
          </div>

          {error && (
            <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? "Routing…" : "Route lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
