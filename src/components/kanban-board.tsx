"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lock, X } from "lucide-react";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moveLeadToStatus } from "@/app/actions";
import { cn, regionOf, scoreTier } from "@/lib/utils";
import { PILL_CONTROL, PILL_GHOST } from "@/lib/styles";

export type KanbanLead = {
  id: string;
  company_name: string;
  score: number;
  signal_summary: string | null;
  location: string | null;
  rep_name: string | null;
  days_in_stage: number;
  /**
   * Age of the lead itself, not of its current stage. Computed on the server
   * beside `days_in_stage` so the board never reads the clock during render —
   * a `Date.now()` here would differ between the server pass and hydration.
   */
  days_since_created: number;
};

/** What "new this week" means, in days since the lead first landed. */
const NEW_WINDOW_DAYS = 7;

/** Filter sentinels. Real values are names or numbers, which cannot collide. */
const ANY = "__any__";
const UNASSIGNED = "__unassigned__";

const SCORE_OPTIONS = [
  { value: ANY, label: "Any score" },
  { value: "50", label: "50+" },
  { value: "70", label: "70+" },
  { value: "80", label: "Hot · 80+" },
  { value: "90", label: "90+" },
];

const AGE_OPTIONS = [
  { value: ANY, label: "Age · any" },
  { value: "7", label: "Under a week" },
  { value: "8-30", label: "1–4 weeks" },
  { value: "30", label: "Over a month" },
];

/**
 * Where the pointer is, not where the dragged rect happens to overlap.
 * `closestCorners` alone measures the source card's own rectangle and, on a
 * wide horizontally-scrolling board, resolves to a column several stages away.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  const rectHits = rectIntersection(args);
  if (rectHits.length > 0) return rectHits;
  return closestCorners(args);
};

/** One tone per stage, carried as a dot beside the written stage name. */
const STAGE_DOT: Record<LeadStatus, string> = {
  new: "bg-stage-new",
  listed: "bg-stage-listed",
  assigned: "bg-stage-assigned",
  contacted: "bg-stage-contacted",
  meeting: "bg-stage-meeting",
  quote: "bg-stage-quote",
  won: "bg-stage-won",
  dead: "bg-stage-dead",
  returned: "bg-stage-returned",
};

/**
 * Score heat. Thresholds come from scoreTier so a lead cannot be "hot" on the
 * inbox and "warm" here; the dot restates the number printed beside it.
 */
const HEAT_DOT = {
  hot: "bg-heat-high",
  warm: "bg-heat-mid",
  cold: "bg-heat-low",
} as const;

export function KanbanBoard({
  columns,
  buckets,
  droppable,
  showRep = true,
  emptyHint = "Nothing here",
  reps,
  regions,
  filters,
}: {
  columns: LeadStatus[];
  buckets: Record<string, KanbanLead[]>;
  /** Stages a drag may land on. Others render as read-only columns. */
  droppable: LeadStatus[];
  showRep?: boolean;
  emptyHint?: string;
  /**
   * Salesmen who may own a lead. Supplying this shows the salesman picker; a
   * rep-scoped board (every card already theirs) omits it and keeps the rest.
   */
  reps?: string[];
  /** Countries present on the board, for the region filter. */
  regions?: string[];
  /**
   * Whether to show the filter bar at all. Defaults to "yes if this board has
   * a salesman picker", which is how the pipeline has always turned it on —
   * a rep board opts in explicitly, since it has no `reps` to key off.
   */
  filters?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, KanbanLead[]>>(buckets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repFilter, setRepFilter] = useState<string>(ANY);
  const [regionFilter, setRegionFilter] = useState<string>(ANY);
  const [scoreFilter, setScoreFilter] = useState<string>(ANY);
  const [ageFilter, setAgeFilter] = useState<string>(ANY);
  const [newOnly, setNewOnly] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server data wins whenever it changes underneath us (revalidate, nav back).
  useEffect(() => setLocal(buckets), [buckets]);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const sensors = useSensors(
    // A small distance threshold keeps a click-through to the lead page working.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumn = (id: string): LeadStatus | null => {
    // A drop can land on the column body ("col:won") or on a card sitting
    // inside it; both must resolve to the same stage.
    if (id.startsWith("col:")) {
      const status = id.slice(4) as LeadStatus;
      return columns.includes(status) ? status : null;
    }
    for (const col of columns) {
      if ((local[col] ?? []).some((l) => l.id === id)) return col;
    }
    return null;
  };

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const hit = (local[col] ?? []).find((l) => l.id === activeId);
      if (hit) return hit;
    }
    return null;
  }, [activeId, local, columns]);

  const filtering =
    repFilter !== ANY ||
    regionFilter !== ANY ||
    scoreFilter !== ANY ||
    ageFilter !== ANY ||
    newOnly;

  /**
   * Filtering is a view over `local`, never a mutation of it — a drag still
   * resolves against the full board, so moving a visible card cannot be
   * confused by the cards the filter is hiding.
   */
  const visible = useMemo(() => {
    if (!filtering) return local;
    const matches = (lead: KanbanLead) => {
      if (repFilter === UNASSIGNED && lead.rep_name) return false;
      if (repFilter !== ANY && repFilter !== UNASSIGNED && lead.rep_name !== repFilter)
        return false;
      if (regionFilter !== ANY && regionOf(lead.location) !== regionFilter)
        return false;
      if (scoreFilter !== ANY && lead.score < Number(scoreFilter)) return false;
      if (ageFilter === "7" && lead.days_in_stage > 7) return false;
      if (ageFilter === "8-30" && (lead.days_in_stage < 8 || lead.days_in_stage > 30))
        return false;
      if (ageFilter === "30" && lead.days_in_stage <= 30) return false;
      if (newOnly && lead.days_since_created > NEW_WINDOW_DAYS) return false;
      return true;
    };
    const out: Record<string, KanbanLead[]> = {};
    for (const col of columns) out[col] = (local[col] ?? []).filter(matches);
    return out;
  }, [
    local,
    columns,
    filtering,
    repFilter,
    regionFilter,
    scoreFilter,
    ageFilter,
    newOnly,
  ]);

  /**
   * How much of the board arrived this week. Stated on the pill so the filter
   * answers the question ("anything new?") before it is even switched on.
   */
  const newCount = useMemo(() => {
    let n = 0;
    for (const col of columns) {
      for (const lead of local[col] ?? []) {
        if (lead.days_since_created <= NEW_WINDOW_DAYS) n += 1;
      }
    }
    return n;
  }, [local, columns]);

  /** Lead count per salesman, so the picker states the size of each book. */
  const repCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    let total = 0;
    for (const col of columns) {
      for (const lead of local[col] ?? []) {
        total += 1;
        if (lead.rep_name) {
          counts.set(lead.rep_name, (counts.get(lead.rep_name) ?? 0) + 1);
        } else {
          unassigned += 1;
        }
      }
    }
    return { counts, unassigned, total };
  }, [local, columns]);

  const shown = useMemo(
    () => columns.reduce((n, col) => n + (visible[col] ?? []).length, 0),
    [visible, columns]
  );

  function clearFilters() {
    setRepFilter(ANY);
    setRegionFilter(ANY);
    setScoreFilter(ANY);
    setAgeFilter(ANY);
    setNewOnly(false);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setError(null);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;

    if (!droppable.includes(to)) {
      setError(`${LEAD_STATUS_LABELS[to]} can't be set by dragging.`);
      return;
    }

    const lead = (local[from] ?? []).find((l) => l.id === String(active.id));
    if (!lead) return;

    const snapshot = local;
    // Optimistic: the card lands before the round trip, then we reconcile.
    setLocal((prev) => ({
      ...prev,
      [from]: (prev[from] ?? []).filter((l) => l.id !== lead.id),
      [to]: [{ ...lead, days_in_stage: 0 }, ...(prev[to] ?? [])],
    }));
    setFlash(lead.id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 900);

    startTransition(async () => {
      const res = await moveLeadToStatus(lead.id, to);
      if (!res?.ok) {
        setLocal(snapshot);
        setError(res?.error ?? "Couldn't move that lead. Nothing was changed.");
        return;
      }
      router.refresh();
    });
  }

  const showRepPicker = Boolean(reps && reps.length > 0);
  const showFilters = filters ?? showRepPicker;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showFilters && (
        <div className="mb-4 flex items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2.5">
            {/* First in the row: the question a manager opens the board with.
                A toggle rather than another select — it is one state, and
                burying it in the age picker would conflate the age of a lead
                with how long it has sat in its current stage. */}
            <button
              type="button"
              onClick={() => setNewOnly((on) => !on)}
              aria-pressed={newOnly}
              disabled={newCount === 0 && !newOnly}
              className={cn(
                PILL_CONTROL,
                "flex items-center disabled:pointer-events-none disabled:opacity-45",
                newOnly &&
                  "bg-brand-bg text-brand-deep hover:bg-brand-bg hover:text-brand-deep"
              )}
            >
              <span
                className={cn(
                  "dot shrink-0",
                  newCount > 0 ? "bg-flare" : "bg-line-strong"
                )}
                aria-hidden
              />
              New this week
              <span
                className={cn(
                  "mono text-[11px] tabular",
                  newOnly ? "text-brand-deep" : "text-ink-faint"
                )}
              >
                {newCount}
              </span>
            </button>

            {/* Owner picker only where ownership varies. On a rep's own board
                every card is already theirs, so the control would offer one
                answer. */}
            {showRepPicker && (
              <Select value={repFilter} onValueChange={setRepFilter}>
                <SelectTrigger className={PILL_CONTROL} aria-label="Filter by salesman">
                  <SelectValue placeholder="All reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All reps · {repCounts.total}</SelectItem>
                  {repCounts.unassigned > 0 && (
                    <SelectItem value={UNASSIGNED}>
                      Unassigned · {repCounts.unassigned}
                    </SelectItem>
                  )}
                  {reps!.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name} · {repCounts.counts.get(name) ?? 0}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {regions && regions.length > 0 && (
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className={PILL_CONTROL} aria-label="Filter by region">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className={PILL_CONTROL} aria-label="Filter by minimum score">
                <SelectValue placeholder="Any score" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger
                className={PILL_CONTROL}
                aria-label="Filter by time in stage"
              >
                <SelectValue placeholder="Age · any" />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nothing falls through: while a filter is on, say plainly how
                much of the board is hidden rather than letting it look empty. */}
            {filtering && (
              <>
                <p
                  className="self-center text-[12.5px] text-ink-dim"
                  role="status"
                  aria-live="polite"
                >
                  <span className="font-semibold text-ink">{shown}</span> of{" "}
                  {repCounts.total} shown
                </p>
                <button type="button" onClick={clearFilters} className={PILL_GHOST}>
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
              </>
            )}
          </div>

          <span className="mono hidden shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint lg:block">
            Drag to move stage
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-signal-hot/[0.08] px-4 py-3 text-[12.5px] text-signal-hot"
        >
          {error}
        </div>
      )}

      <DndContext
        id="lead-kanban"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <BoardScroller>
          {columns.map((status) => (
            <Column
              key={status}
              index={columns.indexOf(status)}
              status={status}
              leads={visible[status] ?? []}
              totalCount={(local[status] ?? []).length}
              filtering={filtering}
              canDrop={droppable.includes(status)}
              showRep={showRep}
              flashId={flash}
              emptyHint={filtering ? "No matches" : emptyHint}
            />
          ))}
        </BoardScroller>

        <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2,0,0,1)" }}>
          {activeLead ? <Card lead={activeLead} showRep={showRep} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/**
 * The board scrolls horizontally, but its own scrollbar would sit below the
 * fold at the bottom of a full-height column. A slim rail above the board
 * mirrors it in both directions, so the control is where the eye already is.
 */
function BoardScroller({ children }: { children: React.ReactNode }) {
  const board = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [overflows, setOverflows] = useState(false);

  const measure = useCallback(() => {
    const el = board.current;
    if (!el) return;
    setTrackWidth(el.scrollWidth);
    // A pixel of slack: sub-pixel layout otherwise reports a permanent overflow.
    setOverflows(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
    if (!board.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(board.current);
    for (const child of Array.from(board.current.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [measure]);

  const mirror = (from: typeof board, to: typeof board) => {
    if (syncing.current) return;
    syncing.current = true;
    if (from.current && to.current) to.current.scrollLeft = from.current.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  };

  return (
    <>
      <div
        ref={rail}
        onScroll={() => mirror(rail, board)}
        aria-hidden
        tabIndex={-1}
        className={cn(
          // Tall enough for the 9px thumb to render inside it.
          "mb-2.5 h-2.5 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-thin",
          !overflows && "hidden"
        )}
      >
        <div className="h-px" style={{ width: trackWidth }} />
      </div>

      <div
        ref={board}
        onScroll={() => mirror(board, rail)}
        className="no-scrollbar flex min-h-0 flex-1 items-stretch gap-3.5 overflow-x-auto pb-1"
      >
        {children}
      </div>
    </>
  );
}

function Column({
  index,
  status,
  leads,
  totalCount,
  filtering,
  canDrop,
  showRep,
  flashId,
  emptyHint,
}: {
  index: number;
  status: LeadStatus;
  leads: KanbanLead[];
  totalCount: number;
  filtering: boolean;
  canDrop: boolean;
  showRep: boolean;
  flashId: string | null;
  emptyHint: string;
}) {
  const { setNodeRef, isOver } = useSortableColumn(status, canDrop);
  const empty = leads.length === 0;

  return (
    <section
      className="flex max-h-[640px] w-[286px] shrink-0 flex-col self-stretch overflow-hidden rounded-xl bg-surface"
      aria-label={LEAD_STATUS_LABELS[status]}
    >
      <header className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-3.5">
        <span className={cn("dot shrink-0", empty ? "bg-line-strong" : STAGE_DOT[status])} />
        <span className="mono text-[9.5px] font-medium tracking-[0.12em] text-ink-ghost">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="truncate text-[12.5px] font-semibold tracking-[0.02em] text-ink">
          {LEAD_STATUS_LABELS[status]}
        </h3>
        {!canDrop && (
          <span title="Set elsewhere — not a drop target" className="shrink-0">
            <Lock className="h-3 w-3 text-ink-ghost" strokeWidth={2} />
            <span className="sr-only">Not a drop target</span>
          </span>
        )}
        <span
          className={cn(
            "display-number ml-auto shrink-0 text-[15px] tabular",
            empty ? "text-ink-faint" : "text-ink"
          )}
        >
          {leads.length}
          {filtering && (
            <span className="text-ink-faint">/{totalCount}</span>
          )}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scrollbar-thin px-2.5 pb-2.5 transition-colors",
          isOver && canDrop && "bg-brand-bg"
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {empty ? (
            <p className="mono rounded-lg bg-surface-2/60 px-3 py-[26px] text-center text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              {isOver && canDrop ? "Drop to move here" : emptyHint}
            </p>
          ) : (
            leads.map((lead) => (
              <SortableCard
                key={lead.id}
                lead={lead}
                showRep={showRep}
                flash={flashId === lead.id}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

/**
 * Column body as a plain droppable. `useSortable` would also register the
 * column as a *draggable*, which lets it win collision detection against its
 * own cards and silently swallows the drop.
 */
function useSortableColumn(status: LeadStatus, canDrop: boolean) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    disabled: !canDrop,
    data: { type: "column", status },
  });
  return { setNodeRef, isOver };
}

function SortableCard({
  lead,
  showRep,
  flash,
}: {
  lead: KanbanLead;
  showRep: boolean;
  flash: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id, data: { type: "card" } });

  return (
    <Card
      lead={lead}
      showRep={showRep}
      flash={flash}
      dragging={isDragging}
      setNodeRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}

function Card({
  lead,
  showRep,
  overlay = false,
  flash = false,
  dragging = false,
  setNodeRef,
  style,
  handleProps,
}: {
  lead: KanbanLead;
  showRep: boolean;
  overlay?: boolean;
  flash?: boolean;
  dragging?: boolean;
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  handleProps?: Record<string, unknown>;
}) {
  return (
    <article
      ref={setNodeRef}
      style={style}
      {...handleProps}
      className={cn(
        "group cursor-grab rounded-lg bg-surface-2 px-3 py-3 transition-[background-color,transform] duration-150",
        "hover:-translate-y-0.5 hover:bg-surface-3",
        "focus-visible:outline-2 focus-visible:outline-brand",
        overlay && "cursor-grabbing card-lift bg-surface-3",
        dragging && "opacity-40",
        flash && "card-settle bg-brand-bg"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Link
          href={`/leads/${lead.id}`}
          tabIndex={overlay ? -1 : undefined}
          onPointerDown={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-sm text-[13.5px] font-bold leading-[1.25] text-ink transition-colors hover:text-brand"
        >
          {lead.company_name}
        </Link>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className={cn("dot", HEAT_DOT[scoreTier(lead.score)])} />
          <span className="display-number text-[13px] tabular text-ink">
            {lead.score}
          </span>
        </span>
      </div>

      {lead.signal_summary && (
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.45] text-ink-dim">
          {lead.signal_summary}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        {showRep && (
          <span
            className={cn(
              "mono truncate text-[9.5px] font-medium uppercase tracking-[0.08em]",
              lead.rep_name ? "text-brand" : "text-ink-faint"
            )}
          >
            {lead.rep_name || "Unassigned"}
          </span>
        )}
        <span
          className={cn(
            "mono ml-auto shrink-0 text-[9.5px] font-medium tabular",
            lead.days_in_stage > 30
              ? "font-semibold text-stage-dead"
              : lead.days_in_stage > 14
                ? "text-stage-assigned"
                : "text-ink-faint"
          )}
          title={`${lead.days_in_stage} days in this stage`}
        >
          {lead.days_in_stage}d
        </span>
      </div>

      {lead.location && (
        <div className="mt-1 truncate text-[10.5px] text-ink-faint">
          {lead.location}
        </div>
      )}
    </article>
  );
}
