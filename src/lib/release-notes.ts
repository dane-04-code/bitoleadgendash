/**
 * The notes shown once, on the first load after a release.
 *
 * RELEASE_ID — not the package version. The notice fires when a user has not
 * yet dismissed *this id*, so shipping a patch that nobody needs to read about
 * costs nothing: leave the id alone and no dialog appears. Bump it only when
 * there is something a user should see, and write the notes in the same edit.
 *
 * Notes are scoped by role because the two roles did not get the same release —
 * a rep has never seen the settings console, and telling them it was redesigned
 * is noise. `roles: "all"` covers the console-wide changes both of them meet.
 */

export const RELEASE_ID = "2026-08-ui-overhaul";

/** Shown under the title, above the list. */
export const RELEASE_HEADLINE = "Same console, new look";

/** Sits under the title. The whole point of the notice: nothing moved on you. */
export const RELEASE_SUBHEAD =
  "This update is the theme and the layout. Every surface, filter, and action works exactly as it did — nothing was removed, and nothing you saved has changed.";

export interface ReleaseNote {
  title: string;
  body: string;
  roles: "all" | "admin" | "rep";
}

const NOTES: ReleaseNote[] = [
  {
    title: "New colours, same screens",
    body: "Inbox, pipeline, lead records, and sign-in all moved to the BITO teal. The pages are the same pages in the same places — they just read more clearly.",
    roles: "all",
  },
  {
    title: "One way of showing a score",
    body: "Lead scores used to look slightly different from screen to screen. They are now identical everywhere. The scores themselves have not been recalculated.",
    roles: "all",
  },
  {
    title: "Your list view is back",
    body: "The one real addition: My Leads still opens on the board as before, and the Board / List toggle brings the table back — with days in stage, the assignment note, and a stage selector on every row.",
    roles: "rep",
  },
  {
    title: "Everything is where you left it",
    body: "Your leads, stages, notes, assignments, and filters are untouched. Nothing was archived, reset, or moved as part of this update.",
    roles: "admin",
  },
];

export function notesForRole(role: "admin" | "rep"): ReleaseNote[] {
  return NOTES.filter((n) => n.roles === "all" || n.roles === role);
}
