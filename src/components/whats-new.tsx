"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  RELEASE_ID,
  RELEASE_HEADLINE,
  RELEASE_SUBHEAD,
  notesForRole,
} from "@/lib/release-notes";

/**
 * The once-per-release notice, opened on the first app load after an update.
 *
 * Dismissal lives in localStorage rather than the database: it is a per-person,
 * per-browser reading receipt, not shared state, and keeping it client-side
 * means a release note needs no migration and no write path through RLS. The
 * cost is that a rep who switches laptops sees it a second time — cheap, and
 * the alternative is a table for one boolean.
 *
 * The key carries the subject so a shared machine does not hide the notice from
 * the next person to sign in, and the stored value is the release id so a later
 * release re-opens it without any clearing step.
 */
export function WhatsNew({
  role,
  subject,
}: {
  role: "admin" | "rep";
  subject: string;
}) {
  const [open, setOpen] = React.useState(false);
  const storageKey = `bito.whatsnew.${subject}`;

  // Deliberately post-mount: the server has no localStorage, so deciding this
  // during render would hydrate one tree and immediately swap it for another.
  React.useEffect(() => {
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(storageKey);
    } catch {
      // Safari in private mode, or storage disabled by policy. Staying quiet is
      // the right failure: a notice we cannot mark as read would return on
      // every page load.
      return;
    }
    if (seen !== RELEASE_ID) setOpen(true);
  }, [storageKey]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, RELEASE_ID);
    } catch {
      // Nothing to do — the dialog is closed for this session either way.
    }
  }

  const notes = notesForRole(role);

  return (
    // onOpenChange rather than a button-only handler: Esc, the X, and a click
    // on the overlay all count as read. A notice that punishes the wrong exit
    // by coming back is worse than one seen once.
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-[520px] gap-0 p-0 overflow-hidden">
        {/* No mono kicker above the title — the label names a field or a
            counter in this system, it does not introduce a heading. The
            release marker sits in the footer instead, where it labels a
            value. */}
        <div className="bg-rail px-6 pb-6 pt-7">
          <DialogHeader>
            <DialogTitle className="text-rail-ink">{RELEASE_HEADLINE}</DialogTitle>
            <DialogDescription className="mt-1 text-rail-2">
              {RELEASE_SUBHEAD}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ul className="divide-y divide-line-soft">
          {notes.map((note, i) => (
            <li key={note.title} className="flex gap-4 px-6 py-4">
              <span className="mono mt-[3px] text-[10px] tabular-nums text-ink-ghost">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{note.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">
                  {note.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="items-center border-t border-line bg-surface-2 px-6 py-4 sm:justify-between">
          <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-ink-ghost">
            Release {RELEASE_ID}
          </span>
          <Button onClick={dismiss}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
