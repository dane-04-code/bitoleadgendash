---
name: BITO LeadIntelligence
description: A single-hue teal CRM console for BITO UAE — square corners, hairline structure, Quicksand throughout.
colors:
  teal-100: "#00797f"
  teal-130: "#00565b"
  teal-150: "#00464a"
  teal-40: "#4fa3a8"
  teal-wash: "#e7edec"
  teal-ground: "#f2f6f5"
  brand-white: "#ffffff"
  flare-orange: "#e06c00"
  ink: "#1c1f1f"
  ink-2: "#3d4646"
  ink-dim: "#5c6a6a"
  ink-faint: "#6f7c7c"
  line: "#d4dbda"
  line-strong: "#a9b6b5"
  signal-good: "#4f8f5f"
  signal-warn: "#cf9a3a"
  signal-bad: "#b8503f"
  signal-hot: "#b8503f"
  signal-warm: "#cf9a3a"
  signal-cold: "#546b85"
  dark-ground: "#0e1618"
  dark-surface: "#151f21"
  dark-accent: "#4fb4bd"
typography:
  page-title:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  metric:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-sm:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  data:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.015em"
    fontFeature: "\"tnum\" 1"
  label:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.07em"
rounded:
  none: "0px"
  all: "0px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  gutter-mobile: "16px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal-100}"
    textColor: "{colors.brand-white}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.teal-130}"
    textColor: "{colors.brand-white}"
  button-secondary:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  table-head:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    height: "32px"
    padding: "0 12px"
  table-cell:
    backgroundColor: "{colors.brand-white}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    padding: "8px 12px"
  card-surface:
    backgroundColor: "{colors.brand-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 16px"
  status-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
    typography: "{typography.label}"
  input-search:
    backgroundColor: "{colors.teal-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
    typography: "{typography.body-sm}"
  nav-item-active:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "7px 10px"
---

# Design System: BITO LeadIntelligence

> [!WARNING]
> **STALE — do not build from this document.** It was generated from the build
> shipped 2026-08-12. The `ui-overhaul/inbox` branch then rebuilt the console on
> the Claude Design comps, which replaced the visual language. These sections
> are now false:
>
> | This document says | The shipped tokens say |
> |---|---|
> | Zero corner radius, "without exception" | `--radius-sm` 5px → `--radius-xl` 14px |
> | "Circles do not exist"; status dot is a 7px square | `.dot` is `border-radius: 50%` |
> | Quicksand only; Barlow "must never be reintroduced" | Barlow + Barlow Condensed + IBM Plex Mono |
> | `.mono` is Quicksand, not a monospace | `.mono` is `ui-monospace, Menlo` |
> | Hairline borders separate everything; panels bordered | `.panel` is borderless, soft-cornered |
>
> Until this file is regenerated from the current build, treat
> `src/app/globals.css` and `tailwind.config.ts` as the source of truth for
> shape, type and colour. The *reasoning* below — density split, one-hue rule,
> status never by colour alone, offset-not-halo depth — still holds and carried
> over into the comps.

## Overview

**Creative North Star: "The Ruled Ledger"**

This is CRM canon played straight at the Attio/Linear craft bar. The console is drawn the way a good ledger is drawn: everything sits on a ruled grid of cool hairlines, panels are plain white on a faint teal-washed ground, and nothing has a rounded corner anywhere. There is exactly one brand hue — BITO teal — and it earns its appearances by marking what is active, what is selected, and what the operator should press. The data is the page; chrome takes one line and hands the viewport to the table.

The build refuses the AI-dashboard arrangement it was pushed toward: no row of same-size stat cards floating over a gradient, no glassmorphism, no halo glows. Counters live in one bordered strip divided by hairlines. Depth is real offset plus blur, tuned per theme, and it appears only where something is genuinely above the page — a drag overlay, the command palette. Everything else is flat and separated by a 1px line.

Density is deliberately split. Tables and lists are tight (32px header rows, 8px cell padding, 13px body) because a manager scans dozens of leads at once. Kanban cards are roomier because they are drag targets that a hand has to grab. That split was chosen by the operator and is the system, not an inconsistency.

**Key Characteristics:**
- One brand hue (BITO teal) plus white; orange survives only on tiny components
- Zero corner radius on every element, everywhere
- Quicksand as the only typeface, at four weights
- Hairline structure over shadow: 1px cool borders separate everything
- Dense tables, roomier kanban cards
- Exactly one authored motion moment: the kanban stage change
- A reserved, empty logo slot — no mark is drawn

## Colors

A single-hue palette: BITO teal on white, with a cool near-neutral ramp derived from the same hue and a small set of non-brand semantic signals.

### Primary
- **BITO Teal** (`{colors.teal-100}`): The one brand colour. Primary CTAs, active nav marker and rail, selected rows, focus rings, links on hover, the caret, and the 20%-alpha selection highlight. Sampled from the real BITO logo asset; it is the identity and nothing else may compete with it.
- **Teal Deep Hover** (`{colors.teal-130}`): Primary button hover only.
- **Teal Deepest** (`{colors.teal-150}`): Reserved deep end of the ramp; used for text-on-wash where the base teal is too light.
- **Teal Tint** (`{colors.teal-40}`): Mid-stage kanban stage dots and secondary teal marks that must read as brand but not as an action.
- **Teal Wash** (`{colors.teal-wash}`): Panel and table-header fill, active nav item background, selected command-palette row. The brand as a surface, at wash strength only.
- **Teal Ground** (`{colors.teal-ground}`): The page ground behind every white panel. This is what keeps a white-card layout from looking like a blank document.

### Secondary
- **Flare Orange** (`{colors.flare-orange}`): The one non-teal identity accent, permitted on tiny components only — the "Top signal" flag and equivalent hairline-bordered badges. Never a surface, never a fill larger than a badge, never a second brand colour. This is an explicit, operator-approved exception to BRANDING.md's blanket no-orange rule, scoped to this app alone.

### Neutral
- **Ink** (`{colors.ink}`): Primary text — company names, headings, metric figures.
- **Ink 2** (`{colors.ink-2}`): Table cell body, secondary structural text.
- **Ink Dim** (`{colors.ink-dim}`): Subtitles, signal summaries, ghost-button rest state. Darkened from BRANDING.md's muted grey specifically so small text clears 4.5:1 on white.
- **Ink Faint** (`{colors.ink-faint}`): Field labels, timestamps, table head text, footer. **Large or secondary text only** — this is the original brand muted value, retained because it is correct at label scale and above but not for body copy on white.
- **Line** (`{colors.line}`) / **Line Strong** (`{colors.line-strong}`): The cool hairlines that do all the structural work. `line` is the default border on every element (set globally); `line-strong` marks hover borders, avatars, the palette frame, and scrollbar thumbs.

### Tertiary
Semantic status colours are UX convention, deliberately outside the brand: **good** (`{colors.signal-good}`), **warn** (`{colors.signal-warn}`), **bad** (`{colors.signal-bad}`). Lead-score signals are a separate scale on the same logic: **hot**, **warm**, and **cold** (`{colors.signal-cold}`, a muted slate chosen to stay out of teal's way).

### Named Rules

**The One Hue Rule.** BITO teal and white are the only brand colours. Any new accent must be a step on the teal ramp (`{colors.teal-150}` → `{colors.teal-40}`), never a new hue.

**The Tiny-Flare Rule.** Orange appears only on elements smaller than a badge — a flag, a hairline border, a single figure. If an orange region is large enough to read as a surface, it is wrong.

**The Non-Brand Signal Rule.** Status and score colours are never drawn from the teal ramp and never treated as brand. Teal means "active/actionable"; green/amber/red mean "state of the world."

**The Dark-Ramp Rule.** In dark mode the accent is a lifted teal that must stay inside the brand ramp — between teal 40 and the base — lifted only as far as AA against near-black text requires (measured 7.2:1 against `--primary-foreground`). Never brighten dark-mode teal past the ramp to gain contrast; flip the foreground instead.

**The Contrast-Split Rule.** `--ink-dim` is the small-text grey; `--ink-faint` is the label grey. Never use `--ink-faint` for body copy on white.

## Typography

**Display Font:** Quicksand (with ui-sans-serif, system-ui fallback)
**Body Font:** Quicksand
**Label / Data Font:** Quicksand, with tabular numerals locked on

**Character:** One geometric humanist sans carries the entire console. Quicksand's round, even counters keep a dense operator surface from feeling punishing, and its geometric numerals hold a metric strip well at 700 weight with tight tracking. There is no second typeface anywhere in the build — figures align through `font-variant-numeric: tabular-nums`, not through a monospace.

Two class names in the codebase are historical misnomers, kept because 100+ call sites reference them; both are documented here by their real behaviour:
- `.mono` is **not** a monospace font. It is Quicksand with tabular numerals and +0.015em tracking — the dense-data voice.
- `.display-serif` is **not** a serif. It is Quicksand at 700 with -0.02em tracking and balanced wrapping — the heading voice.

### Hierarchy
- **Page title** (700, 19px mobile / 21px desktop, 1.25, -0.02em tracking): One line at the top of a surface. Deliberately small; the table is the page.
- **Section title** (700, 17px, -0.02em): Hero-lead company name, panel headings.
- **Metric** (700, 19px, 0.95 line-height, -0.03em, tabular): Counter figures in the stat strip; scales to 48px for the single large score readout on a lead detail.
- **Body** (400/500, 13px, 1.5): Table cells, palette rows, nav items.
- **Body small** (400, 12px–12.5px, 1.45): Subtitles, signal summaries, card meta.
- **Data** (500, 11–12px, +0.015em, tabular): Counts, day-in-stage figures, dates, scores, keyboard hints.
- **Label** (600, 10.5px, +0.07em, uppercase, ink-faint): Column headers, field names, footer, stat-strip captions.

### Named Rules

**The One Typeface Rule.** Quicksand only, at 400/500/600/700. Barlow was an earlier unverified assumption and must never be reintroduced. No serif, no monospace, no system display face.

**The Tabular Numeral Rule.** Every figure that can appear in a column — scores, counts, days, dates, currency — carries tabular numerals. Numbers align by feature setting, never by a second font.

**The Label-Not-Kicker Rule.** The 10.5px uppercase label style names a column, a field, or a counter. It is never set above a heading as a kicker or eyebrow; the page header component explicitly accepts and discards a kicker prop for that reason.

## Layout

A fixed 228px left rail (sticky, full height, white on the teal ground, right hairline) plus a fluid main column. The rail carries the reserved logo slot, wordmark, ⌘K search trigger, nav, and the account/theme/sign-out block. Below `lg` the rail is replaced by a sticky top bar with a horizontally scrollable tab rail — every destination stays reachable without a hamburger.

Main content is gutter-padded `16px` at mobile, `24px` at `sm`, `32px` at `lg`, with `20px`/`28px` vertical. There is no max-width clamp: the triage table runs full width, which is the point of the first viewport. A hairline footer closes every page in label type.

**Density.** Tables run 32px header rows and `8px 12px` cells at 13px. Lists and nav rows sit around 28–34px. Kanban columns are a fixed 264px with `6px` gutters and `6px` internal padding, and their cards are visibly roomier than a table row — they are drag targets.

**Responsive behaviour.**
- The triage table becomes a divided card list below `sm`; an eight-column table at 390px is a horizontal-scroll trap.
- The stat strip is a two-column grid on a phone, with a trailing odd cell spanning both columns so no dead cell renders. From `sm` up it becomes an inline-flex strip that hugs its counters instead of ruling an empty half-width box across the page.
- Table columns drop progressively by breakpoint (`lg`, `xl`, `2xl`) rather than compressing.
- The kanban board scrolls horizontally, bleeding to the gutter edges.

### Named Rules

**The Action-In-Row Rule.** The primary action for a record lives in that record's own row or card, never in a detached toolbar above the list.

**The Strip-Not-Cards Rule.** Counters render as one bordered strip divided by hairlines. Never a row of same-size stat cards, and never over a gradient.

## Elevation & Depth

The system is flat by default. Separation comes from 1px cool hairlines and the white-panel-on-teal-ground relationship, not from shadow. Shadows exist only for things genuinely lifted off the page, and they are always a real vertical offset plus blur — never a zero-offset halo, never a hard offset block.

### Shadow Vocabulary
- **lift-1** (`box-shadow: 0 1px 2px hsl(183 40% 8% / 0.06), 0 1px 1px hsl(183 40% 8% / 0.04)`): Barely-there seat for a resting raised element.
- **lift-2** (`box-shadow: 0 2px 4px hsl(183 40% 8% / 0.07), 0 4px 12px hsl(183 40% 8% / 0.07)`): Menus and small popovers.
- **lift-3** (`box-shadow: 0 4px 8px hsl(183 40% 8% / 0.10), 0 12px 28px hsl(183 40% 8% / 0.12)`): Modal-tier — the command palette.
- **card-lift** (`box-shadow: 0 8px 16px hsl(183 40% 8% / 0.12), 0 18px 40px hsl(183 40% 8% / 0.14)` with `scale(1.02) rotate(0.4deg)`): The kanban drag overlay only.

Every shadow is re-tuned in dark mode against a near-black teal-charcoal rather than reused at light-mode alpha.

### Named Rules

**The Offset-Not-Halo Rule.** Depth is always offset + blur tinted with the brand hue. No zero-offset glow, no coloured halo, no hard offset shadow.

**The Lift-Only-When-Lifted Rule.** A surface gets a shadow only while it is above the page: dragged, or modal. Resting panels are flat with a hairline.

## Shapes

Zero corner radius, everywhere, without exception. Every Tailwind radius token — including `rounded-full` — resolves to `0px`, so no component can accidentally round itself. Circles do not exist in this system: the status dot is a 7px square, avatars are square, badges are square-cornered hairline boxes.

Form language is rectangles separated by hairlines. Panels are white rectangles bordered `1px` in `line` on the teal ground. Badges and pills are rectangles with a 40%-alpha border of their own semantic colour and a 6–7% fill of the same. The active nav item is marked by a 2px teal bar flush to the left edge; active tabs by a 2px teal bottom border.

### Named Rules

**The Zero-Radius Rule.** Nothing in this product has a rounded corner. If a shape needs softening, it gets more padding, not a radius.

## Components

### Buttons
- **Shape:** Square (0px), 36px default height, 28px small, 44px large.
- **Primary:** Teal fill with a matching teal border and theme-flipped foreground text (white in light, near-black in dark — hardcoding white fails AA against the lifted dark teal). Hover deepens to teal 130.
- **Hover / Focus:** 150ms transition on background, colour, and border only — buttons never move. Focus shows a 1px teal ring with a 2px surface-coloured offset.
- **Secondary:** Teal-wash fill, ink text, hairline border; hovers to the next wash step.
- **Ghost:** Transparent with a transparent border (so it never shifts on hover), ink-dim text warming to ink over a wash background. This is the default in-row action.
- **Outline:** Hairline border on transparent, border strengthens on hover.
- **Destructive:** 10%-alpha bad fill, bad text, 30%-alpha bad border. Never a solid red button.

### Chips / Pills
- **Status pill:** Uppercase 10px label, 600 weight, `2px 6px` padding, square, with a 40–45% alpha border and a 6% fill of its own status colour. Dead status drops to a plain hairline and faint ink — a closed lead loses its colour.
- **Score badge:** A 7px square dot in the tier colour, a zero-padded tabular figure, and an uppercase tier word in faint ink. At large size it becomes a 48px tabular figure with the tier word beside it.

### Cards / Containers
- **Corner style:** Square (0px).
- **Background:** White (`{colors.brand-white}`) on the teal ground; secondary panels in teal wash.
- **Shadow strategy:** None at rest — hairline border only. See Elevation.
- **Border:** 1px `line`; `line-strong` on hover for interactive cards.
- **Internal padding:** `12–16px` for panels, `8px` for kanban card bodies.

### Inputs / Fields
- **Style:** Square, 1px `line` border, ground-coloured or transparent fill, 12–14px text, faint placeholder.
- **Focus:** Global 2px teal outline at 1px offset; the caret is teal. Inputs inside a framed surface (the palette) drop their own border and rely on the frame.

### Navigation
- Rail items are 13px, `7px 10px`, ink-dim with faint 16px stroked icons at 1.75 weight. Active items take a teal-wash background, ink text at 600, a teal icon, and a 2px teal bar on the left edge. Mobile tabs use a 2px teal bottom border instead. Hover is a wash background with no motion.

### Data Table (signature)
Sticky teal-wash header in uppercase label type; body rows at 13px with tabular figures, a `border-b` hairline, and a 75ms wash hover. The row is the unit of work: rank number, company plus a one-line clamped signal summary plus a nowrap meta line, score badge, status pill, and the action cluster right-aligned in the row itself. Below `sm` the whole table is replaced by a divided card list carrying the same fields.

### Kanban Board (signature)
Fixed 264px columns, each with a bordered header carrying a square stage dot, the stage name, a lock icon when the stage is not a drop target, and a tabular count. Column bodies tint to teal wash with a 50%-alpha teal border while a valid drag is over them; non-droppable columns sit at a dimmer wash. Cards are white with a hairline, a dedicated grip handle, a two-line company name, score dot, rep or location, and a days-in-stage figure that turns warm past 14 days and hot past 30.

**The single authored motion moment** in the entire app is the stage change: the drag overlay takes `card-lift` (scale 1.02, 0.4° rotation, deep offset shadow, 140ms), and the landed card plays `card-settle` — 420ms exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) from an already-visible state, starting teal-bordered and teal-washed and resolving to rest. It never fades content in from zero. All authored transition and animation is neutralised under `prefers-reduced-motion: reduce`.

### Command Palette (signature)
A 576px-max framed panel at 12vh, `line-strong` border, `lift-3` shadow, over a 25% ink scrim (60% black in dark). Search row, grouped results under uppercase labels, an active row on teal wash with a teal icon and a teal return glyph, tabular score at the right, and a hairline footer of bordered `kbd` hints. Opens on ⌘K/Ctrl-K or `/` anywhere outside a text field.

### Logo Slot
A reserved, deliberately **empty** flex box (`min-height: 28px`, 32px in the rail, 28px compact) marked `aria-hidden`. BITO has supplied no reversed mark, so the build holds the space at the correct size rather than inventing one.

## Do's and Don'ts

### Do:
- **Do** build every new surface from BITO teal, white, and the cool hairline neutrals; take new accents from the teal ramp (`#00464a` → `#4fa3a8`).
- **Do** set every corner to 0px, including things that "want" to be circles — dots, avatars, badges.
- **Do** use Quicksand only, at 400/500/600/700.
- **Do** lock tabular numerals on every figure that can appear in a column.
- **Do** separate surfaces with a 1px `line` hairline before reaching for any shadow.
- **Do** put a record's primary action inside its own row or card.
- **Do** use `--ink-dim` for small text on white and reserve `--ink-faint` for labels and large or secondary text.
- **Do** keep dark-mode teal inside the brand ramp and flip the foreground to near-black to hold AA.
- **Do** render counters as one bordered, hairline-divided strip.
- **Do** keep tables and lists dense and kanban cards roomier — the density split is intentional.
- **Do** hold the logo slot empty until BITO supplies a mark.

### Don't:
- **Don't** introduce a second brand hue. One teal, one white.
- **Don't** let orange become a surface, a fill, or a second identity colour — badge-scale elements only.
- **Don't** round anything, ever.
- **Don't** reintroduce Barlow, a serif, a monospace, or any system display face; `.mono` and `.display-serif` are Quicksand under legacy names.
- **Don't** set the 10.5px uppercase label above a heading as a kicker or eyebrow.
- **Don't** use a zero-offset glow, a coloured halo, or a hard offset shadow; depth is offset + blur.
- **Don't** shadow a resting panel.
- **Don't** arrange same-size stat cards over a gradient ground.
- **Don't** animate anything beyond the kanban stage change and the sub-150ms colour transitions already in the system.
- **Don't** draw a status or score colour from the teal ramp — teal means actionable, not "good."
- **Don't** place a BITO logo anywhere.
