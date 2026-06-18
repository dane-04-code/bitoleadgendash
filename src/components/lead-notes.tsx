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
      <div className="border border-line bg-surface">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this lead…"
          rows={3}
          className="border-0 bg-transparent focus-visible:bg-transparent rounded-none"
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter submits.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <div className="flex items-center justify-between border-t border-line px-3 py-2">
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            ⌘ + ↵ to save
          </span>
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
        <p className="text-[13px] text-ink-faint italic">No notes yet.</p>
      ) : (
        <ol className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 mono text-[10px] uppercase tracking-wider text-ink-faint">
                  {note.author && (
                    <span className="text-brand-ink/80">{note.author}</span>
                  )}
                  <span>{formatRelative(note.created_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  disabled={pending}
                  aria-label="Delete note"
                  className="text-ink-faint hover:text-signal-hot transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-2 whitespace-pre-wrap">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
