/**
 * Shared control styling for the teal console. Kept here rather than as a CSS
 * component class so it composes with the shadcn primitives' own utility
 * strings through `cn`/twMerge instead of fighting them on specificity.
 */

/** The soft white filter pill used on the inbox and the pipeline board. */
export const PILL_CONTROL =
  "h-auto w-auto gap-2.5 rounded-lg border-0 bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-2 " +
  "transition-colors hover:bg-surface-3 hover:text-brand-deep focus:bg-surface-3 focus:text-brand-deep " +
  "data-[state=open]:bg-surface-3 data-[state=open]:text-brand-deep";

/** Quiet inline control that sits beside a pill — "Clear", and friends. */
export const PILL_GHOST =
  "flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-faint " +
  "transition-colors hover:bg-surface hover:text-brand-deep";
