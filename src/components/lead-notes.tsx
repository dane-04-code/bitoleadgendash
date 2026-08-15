"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus } from "lucide-react";
import type { LeadNote } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addLeadNote, deleteLeadNote } from "@/app/actions";
import { formatRelative } from "@/lib/utils";

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: LeadNote[];
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function handleAdd() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("body", trimmed);
    startTransition(async () => {
      await addLeadNote(fd);
      setBody("");
      router.refresh();
    });
  }

  function handleDelete(noteId: string) {
    setDeletingId(noteId);
    startTransition(async () => {
      await deleteLeadNote(noteId, leadId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="overflow-hidden rounded-lg bg-surface-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this lead…"
          rows={3}
          className="rounded-none border-0 bg-transparent focus-visible:bg-transparent"
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter submits.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <div className="flex items-center justify-between gap-3 border-t border-line-soft px-3 py-2">
          <span className="eyebrow">⌘ + ↵ to save</span>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={pending || !body.trim()}
          >
            {pending && deletingId === null ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add note
          </Button>
        </div>
      </div>

      {/* List */}
      {notes.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No notes yet.</p>
      ) : (
        <ol className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="group rounded-lg bg-surface-2 px-3.5 py-3">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="eyebrow flex items-center gap-2">
                  {note.author && (
                    <span className="text-brand-ink">{note.author}</span>
                  )}
                  <span>{formatRelative(note.created_at)}</span>
                </div>
                {/* Revealed on hover, but also on keyboard focus — opacity-0
                    alone leaves the control unreachable without a mouse. */}
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  disabled={pending}
                  aria-label="Delete note"
                  className="text-ink-faint opacity-0 transition-colors hover:text-signal-hot focus-visible:opacity-100 disabled:opacity-50 group-hover:opacity-100"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
