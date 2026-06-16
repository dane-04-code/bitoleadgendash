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
import { deleteRep } from "@/app/actions";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  repId: string;
  repName: string;
  leadCount: number;
}

export function DeleteRepDialog({ repId, repName, leadCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteRep(repId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error || "Could not delete this rep.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-signal-hot hover:text-signal-hot">
          <Trash2 className="h-3 w-3" strokeWidth={1.75} />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="eyebrow text-signal-hot mb-1">Delete rep</div>
          <DialogTitle>{repName}</DialogTitle>
          <DialogDescription>
            This permanently removes the rep and their login.
            {leadCount > 0
              ? ` Their ${leadCount} assigned lead${
                  leadCount === 1 ? "" : "s"
                } will become unassigned — the leads themselves are kept.`
              : ""}{" "}
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? "Deleting…" : "Delete rep"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
