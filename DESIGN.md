---
name: BITO LeadIntelligence
description: A single-hue teal sales console — deep-teal rail, white panels on a mint ground, Barlow with a condensed numeral voice, softly rounded corners.
colors:
  teal: "#00797f"
  teal-ink: "#00565b"
  teal-deep: "#00464a"
  teal-soft: "#4fa3a8"
  teal-wash: "#e7edec"
  mint-ground: "#eef2f2"
  surface: "#ffffff"
  surface-2: "#f2f6f5"
  surface-3: "#e7edec"
  rail: "#00464a"
  rail-hover: "#00595e"
  rail-active: "#00797f"
  rail-edge: "#003a3d"
  rail-ink: "#f2fafa"
  rail-ink-2: "#b3d4d6"
  rail-ink-3: "#9cc6c9"
  rail-mark: "#a8e4ea"
  flare-orange: "#e06c00"
  ink: "#1c1f1f"
  ink-2: "#4d5d5d"
  ink-dim: "#5c6a6a"
  ink-faint: "#6f7c7c"
  ink-ghost: "#a8b5b5"
  line: "#dde6e5"
  line-soft: "#f0f4f3"
  line-strong: "#cfdad9"
  heat-high: "#b04a3a"
  heat-mid: "#c98a1f"
  heat-low: "#8fa0a0"
  heat-high-ink: "#b04a3a"
  heat-mid-ink: "#8a5d0f"
  heat-low-ink: "#5c6a6a"
  stage-won: "#0f7a42"
  stage-dead: "#b04a3a"
  signal-good: "#4f8f5f"
  signal-warn: "#cf9a3a"
  signal-cold: "#546b85"
  dark-ground: "#0e1618"
  dark-surface: "#151f21"
  dark-teal: "#4fb4bd"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "62px"
    fontWeight: 700
    lineHeight: 0.85
    letterSpacing: "0"
    fontFeature: "\"lnum\", \"tnum\""
  headline:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  metric:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"lnum\", \"tnum\""
  title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-sm:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.14em"
    fontFeature: "\"zero\", \"tnum\""
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "\"zero\", \"tnum\""
rounded:
  sm: "5px"
  md: "9px"
  lg: "11px"
  xl: "14px"
  full: "9999px"
spacing:
  card: "12px"
  panel-x: "16px"
  gutter: "30px"
  section: "20px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.teal-ink}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.md}"
    height: "36px"
  button-sm:
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    textColor: "{colors.ink}"
  kanban-card:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  kanban-card-hover:
    backgroundColor: "{colors.surface-3}"
  chip-stage:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
    typography: "{typography.label}"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px 10px 40px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.rail-ink-2}"
    rounded: "{rounded.md}"
    padding: "10px"
  nav-item-active:
    backgroundColor: "{colors.rail-active}"
    textColor: "{colors.rail-ink}"
    rounded: "{rounded.md}"
---

# Design System: BITO LeadIntelligence

## Overview

**Creative North Star: "The Teal Control Room"**

LeadIntelligence is a working console, not a marketing surface. The whole product reads as one instrument: a deep-teal navigation rail holding the left edge, a flat mint ground, and white panels floating on it with soft corners and almost no shadow. Nothing decorates. Every tone in the palette is either brand (teal), structure (mint/ink/hairline), or meaning (score heat, stage, semantic status), and the three families never trade places.

Density is deliberately split by the work being done. Tables and lists run tight — 13px body, 11px mono metadata, hairline dividers, rows that light up on hover — because an operator triages dozens of leads in a sitting and scanning speed is the whole job. Kanban cards are the exception: roomier, 12px of internal padding on an 11px-radius tile, sized as a drag target rather than as a data row. The two densities are the same system applied to two different physical acts.

The brand is expressed through colour and type only. BITO's mark is never placed in the interface; the sidebar holds an empty, width-reserved slot so it could be, without a relayout. Both light and dark themes ship, and the dark theme is the same teal on deep petrol ink, never a second identity.

**Key Characteristics:**
- One brand hue (BITO teal `#00797f`), four steps, plus a matched deep-teal rail ramp.
- Mint ground, white panels, borderless cards; hairlines only inside a panel.
- Barlow for everything readable, Barlow Condensed for numerals and titles, IBM Plex Mono for metadata.
- Softly rounded corners on a four-step scale (5 / 9 / 11 / 14px); status dots fully round.
- Flat at rest — depth is offset-plus-blur tinted from ink, reserved for things genuinely lifted.
- Colour never carries meaning alone; every tint ships with its word.

## Colors

A single teal hue against a cool-grey ink ladder and a mint ground, with two small, strictly-bounded meaning ramps (score heat and stage) that are never mistaken for brand.

### Primary
- **BITO Teal** (`{colors.teal}`): The brand. Primary buttons, active rail item, focus rings, links and hover states on record titles, the selection highlight. On white it carries text at weight; it is the only hue permitted to fill a large region, and only in the rail.
- **Teal Ink** (`{colors.teal-ink}`): The darker step. Primary-button hover, teal text on white where the base step would be marginal, `meeting`-stage chips.
- **Teal Deep** (`{colors.teal-deep}`): The rail's resting plane and the deepest stage chip (`quote`). The most saturated dark in the system.
- **Teal Soft** (`{colors.teal-soft}`): The light step, for de-emphasised brand marks and the `assigned` stage.
- **Teal Wash** (`{colors.teal-wash}`): The 8%-strength brand surface — active-drop columns on the board, command-palette selection, the settle flash after a card lands.

### Secondary — the rail ramp
The one region the brand hue owns outright. Every pair is measured, not eyeballed.
- **Rail** (`{colors.rail}`) with **Rail Hover** (`{colors.rail-hover}`) and **Rail Active** (`{colors.rail-active}`): the navigation plane and its two states.
- **Rail Ink** (`{colors.rail-ink}`, 10.0:1 on rail), **Rail Ink 2** (`{colors.rail-ink-2}`, 6.7:1), **Rail Ink 3** (`{colors.rail-ink-3}`, 5.7:1), **Rail Mark** (`{colors.rail-mark}`, 7.6:1): the rail's own four-step text ladder. On an *active* item only Rail Ink clears 4.5:1, so the item's numeral and count badge ride full ink there instead of dimming.
- **Rail Edge** (`{colors.rail-edge}`): the hairline that separates rail from ground in dark mode, where the two sit only 1.4:1 apart.

### Tertiary — meaning ramps
- **Score heat** — **Heat High** (`{colors.heat-high}`), **Heat Mid** (`{colors.heat-mid}`), **Heat Low** (`{colors.heat-low}`): red / amber / grey, one ramp for the whole console. The vivid values fill dots only. The `-ink` variants (`{colors.heat-high-ink}`, `{colors.heat-mid-ink}`, `{colors.heat-low-ink}`) set the tier *word*, because the vivid amber and grey read at 2.9:1 and 2.7:1 as text on white.
- **Stage tones**: nine, one per pipeline stage, drawn mostly from the teal ramp with **Stage Won** (`{colors.stage-won}`) and **Stage Dead** (`{colors.stage-dead}`) stepping outside it. They appear as a dot beside a written stage name, or as a chip whose label states the stage.
- **Flare Orange** (`{colors.flare-orange}`): the one non-teal accent, permitted for elements smaller than a badge — a flag, a hairline, a single figure. Currently held in reserve; no shipped surface uses it.

### Neutral
- **Mint Ground** (`{colors.mint-ground}`): the page. Flat — no texture, no grid.
- **Surface** (`{colors.surface}`) / **Surface 2** (`{colors.surface-2}`) / **Surface 3** (`{colors.surface-3}`): white panel, row-hover wash, and the resting tint for chips and kanban cards.
- **Ink ladder** — **Ink** (`{colors.ink}`) for headings and record names, **Ink 2** (`{colors.ink-2}`) for secondary cells, **Ink Dim** (`{colors.ink-dim}`) for small body copy, **Ink Faint** (`{colors.ink-faint}`) for labels and metadata, **Ink Ghost** (`{colors.ink-ghost}`) for rules, row numerals and empty-state glyphs. Every step through Ink Faint clears 4.5:1 on both white and the mint ground.
- **Line** (`{colors.line}`) for section rules, **Line Soft** (`{colors.line-soft}`) for dividers inside a panel, **Line Strong** (`{colors.line-strong}`) for input edges, scrollbar thumbs and the oversized page numeral.

### Named Rules
**The One Hue Rule.** BITO teal is the only brand colour. Any new brand-flavoured tone must be a step on the existing teal ramp — deep, ink, base, soft, wash — never a new hue.

**The Never-Colour-Alone Rule.** No state is legible by colour alone. A score tier ships its dot *and* its word; a stage chip ships its tint *and* the stage name. If removing colour removes meaning, the component is wrong.

**The One Score Ramp Rule.** The console has exactly one score ramp: red hot (≥80), amber warm (≥50), grey cold. It is the same ramp in the inbox, on the board, in the command palette and on the lead page. There is no teal score ramp and there must never be one — teal means brand and action, never temperature.

**The Vivid-Dot / Ink-Word Rule.** Vivid heat tones fill dots and fills only; the `-ink` variants set text. Never set a tier word in the vivid amber or grey.

**The Tiny-Flare Rule.** Orange appears only on elements smaller than a badge. If an orange region reads as a surface, it is wrong.

**The Contrast-Split Rule.** Ink Dim is the small-text grey; Ink Faint is the label grey; Ink Ghost is decorative and must never carry meaning on its own.

## Typography

**Display Font:** Barlow Condensed (600, 700), exposed as `.display-number` and `.display-serif`
**Body Font:** Barlow (400, 500, 600, 700)
**Label/Mono Font:** IBM Plex Mono (400, 500, 600), exposed as `.mono`, `.label-xs`

**Character:** Barlow is a low-contrast industrial grotesque — plain, dense, unbothered — and its condensed cut gives the console its one theatrical gesture: an oversized page numeral and big metric figures that anchor a screen without adding a second personality. IBM Plex Mono carries every piece of metadata: identifiers, counts, timestamps, uppercase micro-labels. Three families, one voice: technical, current, unornamented.

### Hierarchy
- **Display** (Barlow Condensed 700, 62px, line-height 0.85, tabular): the page numeral in the header strip and the 140px numeral on the not-found page. Decorative wayfinding; hidden from assistive tech.
- **Headline** (Barlow Condensed 700, 26–30px, line-height 1.1): the lead-detail title, auth pages, rep pages.
- **Metric** (Barlow Condensed 700, 22–52px, tabular): counter figures in the stat strip, the large score on a lead.
- **Title** (Barlow 700, 13.5–14.5px, line-height 1.25): record names in table rows and kanban cards. The densest heading level in the product.
- **Body** (Barlow 400, 13px): table cells and form text.
- **Body Small** (Barlow 400, 11.5–12.5px, line-height 1.45): signal summaries, secondary lines under a record name.
- **Label** (IBM Plex Mono 500, 9.5–11px, uppercase, tracking 0.06–0.16em): column headers, field labels, counter labels, stage chips, rail meta.
- **Data** (IBM Plex Mono 400/500, 11px, tabular, `zero` slashed): identifiers, day counts, timestamps.

### Named Rules
**The Three-Family Rule.** Barlow, Barlow Condensed, IBM Plex Mono. Nothing else. No serif, no system display face, no fourth family for emphasis. Note that `.display-serif` is a legacy class name only — it renders Barlow Condensed, not a serif.

**The Tabular Numeral Rule.** Every figure that can appear in a column — scores, counts, days, dates, currency — carries tabular numerals via `font-variant-numeric`, applied globally to tables, `.tabular`, `.stat` and code. Numbers align by feature setting, never by a second font.

**The Label-Not-Kicker Rule.** The uppercase mono micro-label names a column, a field, or a counter. It is not a kicker: it does not sit above a heading to introduce it.

**The Condensed-For-Figures Rule.** Barlow Condensed is for numerals and page titles only. It never sets body copy, labels, or button text.

## Layout

The shell is a fixed 236px deep-teal rail on the left (`lg` and up) beside a fluid content column; below `lg` the rail collapses into a sticky teal top bar with icon-only targets that scroll horizontally rather than clipping. Content sits in a 30px gutter on desktop, 24px at `sm`, 16px on mobile, with a 26px top inset and a mono footer strip in Ink Ghost.

Every page opens with the same header: an oversized condensed numeral pinned to the left edge (hidden below `sm`, hidden from screen readers) with a baseline-aligned counter strip beside it — mono label above condensed figure, 32–40px apart. Content below sits in white `.panel` cards with 14px corners and no border.

The spacing rhythm is small and consistent: 2px–6px inside chips, 10–14px inside interactive controls, 12px inside kanban cards, 16–24px inside panels, 20px between a header and the panel it introduces. Tables progressively disclose columns rather than scrolling: secondary columns appear at `lg`, `xl` and `2xl` and are hidden below.

**The Density Split Rule.** Tables and lists run at CRM density — 13px cells, 11px mono metadata, hairline dividers, full-row hover. Kanban cards run looser — 12px padding, 11px radius, a two-line summary — because they are drag targets held under a pointer, not rows to be scanned. Never harmonise the two.

**The Panel-Not-Page Rule.** Content lives inside white panels on the mint ground. The ground itself never carries text other than the page header strip and the footer.

## Elevation & Depth

The system is functionally flat. Separation comes from tone — white panel against mint ground — not from shadow. The resting shadow (`lift-1`) is a whisper that only keeps a white card from dissolving into the ground; real elevation is reserved for surfaces that are genuinely above the page: dialogs, the command palette, and a kanban card under the pointer. Every shadow is tinted from a deep teal-grey ink, never neutral black, so depth stays inside the palette.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px hsl(var(--shadow-ink) / 0.04)`): white panels on the ground. Barely perceptible by design.
- **Floating** (`0 2px 4px .../0.06, 0 6px 16px .../0.08`): popovers, menus, the command palette.
- **Lifted** (`0 4px 8px .../0.10, 0 14px 32px .../0.13`): dialogs and other modal surfaces.
- **Dragged** (`0 8px 16px .../0.12, 0 18px 40px .../0.14` with `scale(1.02) rotate(0.4deg)`): a kanban card held under the pointer. The only place in the product where a surface tilts.
- **Dark mode**: the same offsets at 0.45–0.6 alpha against near-black, because a 4% shadow disappears on a dark ground.

### Named Rules
**The Offset-Not-Halo Rule.** Depth is always offset plus blur, tinted with the brand's ink. No zero-offset glow, no coloured halo, no hard offset shadow.

**The Lift-Only-When-Lifted Rule.** A surface earns a shadow only while it is above the page: dragged, floating or modal. Resting panels stay flat.

**The Settle-Not-Fade Rule.** A card that lands in a new column settles from an already-visible state — a 4px rise and a teal wash decaying over 420ms — never a fade-in that hides content. Both drag lift and settle are disabled under `prefers-reduced-motion`.

## Shapes

Corners are softly rounded on a four-step scale, and the step encodes the size of the thing: 5px for chips, badges and inline mono tags; 9px for buttons, nav items and icon targets; 11px for controls, filter pills and kanban cards; 14px for the panel a whole table sits in. Nothing is square, and nothing is a pill except by intent — the only fully-round shapes are the 6px status dot and the 28px avatar disc.

Panels are borderless: they separate from the ground by tone. Borders appear inside a panel as hairline dividers (Line Soft) between rows, and around low-emphasis controls (secondary, outline buttons and badges) at Line or Line Strong. Focus is a 2px teal outline at 2px offset with a 5px radius, applied globally.

Iconography is Lucide line icons at 14–16px, stroke weight 1.75, always paired with a text label except in the mobile rail where each target carries an `aria-label`.

**The Radius-By-Scale Rule.** Radius grows with the element: chip 5, control 9, card 11, panel 14. Never mix — a chip inside a panel does not inherit the panel's corner.

**The Borderless-Panel Rule.** A panel separates by tone, not by an outline. If a panel needs a border to be visible, the tone behind it is wrong.

## Components

### Buttons
- **Shape:** softly rounded (9px), 36px tall by default, 28px in `sm`, 44px in `lg`.
- **Primary:** BITO teal fill, white label, matching teal border, 13px Barlow medium with 14px side padding and a 14px leading icon.
- **Hover / Focus:** background moves to Teal Ink over 150ms; focus is a 1px teal ring at 2px offset against the surface.
- **Secondary:** Surface 2 fill with a Line border, Ink label, hovering to Surface 3.
- **Ghost:** transparent with an Ink Dim label; hover fills Surface 2 and darkens the label to Ink.
- **Outline:** transparent with a Line border; hover strengthens the border to Line Strong.
- **Destructive:** Signal Hot at 10% fill with a 30% border and Hot text — never a solid red button.
- **Disabled:** 50% opacity, pointer events off.

### Chips
- **Stage chip:** solid tint from the stage map with white (or Teal Deep on the wash) text, 5px corners, 9.5px uppercase mono at 0.06em tracking, 6px/2px padding. The stage word is always present; when a lead is assigned the chip names the rep ("Assigned to Layla").
- **Badge:** 5px corners, 11px mono, bordered and transparent by default; the tinted variants (hot / warm / cold / success / accent) use a 40–45% border over a 6–7% fill of the same tone.

### Cards / Containers
- **Panel** — the container everything else sits in. White, 14px corners, no border, `overflow: hidden` so table rows clip to the corner. Resting shadow only.
- **Kanban card** — Surface 2, 11px corners, 12px padding, a bold 13.5px record name, a two-line 11.5px summary, and a mono footer row. Hover lifts 2px and deepens to Surface 3; the card is the drag handle.
- **Internal padding:** 16–24px in panels, 12px in cards, 46px vertical in empty states.

### Inputs / Fields
- **Style:** borderless — Surface fill, 11px corners, 10px vertical padding, 13px medium text, a 14px Ink Ghost leading icon inset 16px, placeholder in Ink Faint at regular weight.
- **Focus:** the field fills to Surface 3 and takes the global 2px teal outline. No glow.
- **Filter pills:** the same 11px-cornered control shape, used for every select in a filter bar.

### Navigation
- **Style:** a 236px deep-teal plane painted by the outer wrapper (so a tall page never reveals mint ground below it) with a sticky inner column. Each item is a 9px-cornered row carrying a two-digit mono code, a 14px line icon, a 13.5px label and an optional live mono count.
- **Default / hover / active:** Rail Ink 2 label on the plane; hover fills Rail Hover and brightens to Rail Ink; active fills Rail Active, sets the label semibold, and promotes numeral and badge to full Rail Ink.
- **Brand block:** a reserved, empty 28px logo slot beside the "LeadIntelligence" wordmark and a mono "BITO UAE · GCC" line. The mark itself is never placed.
- **Mobile:** the rail becomes a sticky teal top bar of 32px icon targets that scrolls horizontally.

### Score Badge (signature)
The console's most-repeated component and the carrier of the score ramp. Small and default sizes render a 6px round dot in the vivid heat tone, the score in condensed tabular figures at 13.5–16px in full Ink, then the tier word in 9–10px uppercase mono in the matching `-ink` tone. The large size drops the dot and sets the score itself at 52px in the tier's ink tone beside the word. The word ships at every size.

### Stat Strip (signature)
The shared page header: an oversized condensed numeral in Line Strong pinned to the left edge, `aria-hidden`, with counters running along its baseline — an 11px mono uppercase label above a 34px condensed figure, optionally toned brand / good / bad / warn. Counters are one strip, never a row of equal-sized stat cards.

## Do's and Don'ts

### Do:
- **Do** derive every colour from a token. Components never hard-code a hex.
- **Do** ship the word with the tint — score tier, pipeline stage, semantic status.
- **Do** use the `-ink` heat variants for any tier text, and the vivid heat tones only for dots and fills.
- **Do** keep tables and lists at CRM density and kanban cards roomy; they are the same system serving two different acts.
- **Do** pick the radius from the element's scale: 5px chip, 9px control, 11px card, 14px panel.
- **Do** keep depth as offset-plus-blur tinted from ink, and only on surfaces that are actually above the page.
- **Do** reserve the logo slot and leave it empty; the brand shows through colour and type.
- **Do** carry both themes: any new token needs a dark-mode value in the same `.dark` block.

### Don't:
- **Don't** introduce a second brand hue. New brand tones are steps on the teal ramp.
- **Don't** build a second score ramp. There is one — red / amber / grey at 80 and 50 — and it is never teal.
- **Don't** let orange fill a surface; it is permitted only on elements smaller than a badge.
- **Don't** put a border on a panel, or a shadow on a resting one.
- **Don't** use a zero-offset glow, a coloured halo, or a hard offset shadow.
- **Don't** set body copy, labels or button text in Barlow Condensed, and don't add a fourth font family.
- **Don't** use Ink Ghost for anything that carries meaning.
- **Don't** set a mono micro-label above a heading as a kicker or eyebrow.
- **Don't** place the BITO logo anywhere in the UI.
