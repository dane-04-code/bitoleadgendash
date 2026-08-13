"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { GripVertical, Lock, X } from "lucide-react";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";
import { ScoreBadge } from "@/components/ui/score-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moveLeadToStatus } from "@/app/actions";
import { cn } from "@/lib/utils";
import { PILL_CONTROL, PILL_GHOST } from "@/lib/styles";

/** Filter sentinels. Real values are rep names, which cannot collide. */
const ALL_REPS = "__all__";
const UNASSIGNED = "__unassigned__";

export type KanbanLead = {
  id: string;
  company_name: string;
  score: number;
  signal_summary: string | null;
  location: string | null;
  rep_name: string | null;
  days_in_stage: number;
};

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

/** Each stage owns a filled header block, deepening along the teal ramp as a
 *  deal advances, so progress is legible across the board without reading. */
const STAGE_HEAD: Record<LeadStatus, string> = {
  new: "bg-signal-cold text-white",
  listed: "bg-brand text-white",
  assigned: "bg-signal-warm text-white",
  contacted: "bg-signal-cold text-white",
  meeting: "bg-brand text-white",
  quote: "bg-brand-ink text-white",
  won: "bg-signal-good text-white",
  dead: "bg-ink-faint text-white",
  returned: "bg-signal-hot text-white",
};

export function KanbanBoard({
  columns,
  buckets,
  droppable,
  showRep = true,
  emptyHint = "Nothing here",
  reps,
}: {
  columns: LeadStatus[];
  buckets: Record<string, KanbanLead[]>;
  /** Stages a drag may land on. Others render as read-only columns. */
  droppable: LeadStatus[];
  showRep?: boolean;
  emptyHint?: string;
  /**
   * Salesmen who may own a lead. Supplying this turns on the board filter;
   * a rep-scoped board (every card already theirs) omits it.
   */
  reps?: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, KanbanLead[]>>(buckets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repFilter, setRepFilter] = useState<string>(ALL_REPS);
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

  /**
   * Filtering is a view over `local`, never a mutation of it — a drag still
   * resolves against the full board, so moving a visible card cannot be
   * confused by the cards the filter is hiding.
   */
  const matchesRep = (lead: KanbanLead) => {
    if (repFilter === ALL_REPS) return true;
    if (repFilter === UNASSIGNED) return !lead.rep_name;
    return lead.rep_name === repFilter;
  };

  const visible = useMemo(() => {
    if (repFilter === ALL_REPS) return local;
    const out: Record<string, KanbanLead[]> = {};
    for (const col of columns) out[col] = (local[col] ?? []).filter(matchesRep);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, columns, repFilter]);

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

  const filtering = repFilter !== ALL_REPS;
  const filterLabel =
    repFilter === UNASSIGNED ? "Unassigned" : repFilter;

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

  return (
    <div>
      {reps && reps.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <Select value={repFilter} onValueChange={setRepFilter}>
            <SelectTrigger
              className={PILL_CONTROL}
              aria-label="Filter the board by salesman"
            >
              <SelectValue placeholder="All salesmen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REPS}>
                All salesmen · {repCounts.total}
              </SelectItem>
              {repCounts.unassigned > 0 && (
                <SelectItem value={UNASSIGNED}>
                  Unassigned · {repCounts.unassigned}
                </SelectItem>
              )}
              {reps.map((name) => (
                <SelectItem key={name} value={name}>
                  {name} · {repCounts.counts.get(name) ?? 0}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nothing falls through: while a filter is on, say plainly how much
              of the board is hidden rather than letting it look empty. */}
          {filtering && (
            <>
              <p
                className="text-[12.5px] text-ink-dim"
                role="status"
                aria-live="polite"
              >
                <span className="font-semibold text-ink">{filterLabel}</span>
                {" · "}
                {shown} of {repCounts.total} lead
                {repCounts.total === 1 ? "" : "s"} shown
              </p>
              <button
                type="button"
                onClick={() => setRepFilter(ALL_REPS)}
                className={PILL_GHOST}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-3 border border-signal-hot/40 bg-signal-hot/[0.07] px-3 py-2 text-[12px] text-signal-hot"
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
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scrollbar-thin pb-3">
          <div className="flex gap-2.5 min-w-max items-stretch">
            {columns.map((status) => (
              <Column
                key={status}
                status={status}
                leads={visible[status] ?? []}
                totalCount={(local[status] ?? []).length}
                filtering={filtering}
                canDrop={droppable.includes(status)}
                showRep={showRep}
                flashId={flash}
                emptyHint={filtering ? `No leads for ${filterLabel}` : emptyHint}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2,0,0,1)" }}>
          {activeLead ? (
            <Card lead={activeLead} showRep={showRep} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  leads,
  totalCount,
  filtering,
  canDrop,
  showRep,
  flashId,
  emptyHint,
}: {
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

  return (
    <section className="w-[264px] shrink-0 flex flex-col self-stretch" aria-label={LEAD_STATUS_LABELS[status]}>
      <header
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          STAGE_HEAD[status]
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] truncate">
            {LEAD_STATUS_LABELS[status]}
          </h3>
          {!canDrop && (
            <span title="Set elsewhere — not a drop target">
              <Lock className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} />
            </span>
          )}
        </div>
        <span className="mono text-[12px] tabular font-bold shrink-0">
          {leads.length}
          {filtering && (
            <span className="font-medium opacity-70">/{totalCount}</span>
          )}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 border border-line border-t-0 p-1.5 space-y-1.5 min-h-[340px] max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin transition-colors",
          isOver && canDrop
            ? "bg-brand-bg border-brand/50"
            : canDrop
              ? "bg-surface/40"
              : "bg-surface-2/40"
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <p className="flex items-center justify-center h-24 text-[11px] text-ink-faint">
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
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <Card
        lead={lead}
        showRep={showRep}
        flash={flash}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function Card({
  lead,
  showRep,
  overlay = false,
  flash = false,
  handleProps,
}: {
  lead: KanbanLead;
  showRep: boolean;
  overlay?: boolean;
  flash?: boolean;
  handleProps?: Record<string, unknown>;
}) {
  return (
    <article
      className={cn(
        "group border bg-surface transition-colors",
        overlay
          ? "border-brand card-lift"
          : "border-line hover:border-brand/50 lift-1",
        flash && "border-brand bg-brand-bg card-settle"
      )}
    >
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          {...handleProps}
          aria-label={`Drag ${lead.company_name} to another stage`}
          className={cn(
            "shrink-0 pl-1 pr-0 flex items-center text-ink-faint/60 hover:text-brand cursor-grab active:cursor-grabbing touch-none",
            overlay && "cursor-grabbing text-brand"
          )}
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <Link
          href={`/leads/${lead.id}`}
          className="flex-1 min-w-0 py-2 pr-2.5 pl-0.5 block"
          tabIndex={overlay ? -1 : undefined}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[12.5px] font-semibold leading-snug text-ink group-hover:text-brand transition-colors line-clamp-2">
              {lead.company_name}
            </h4>
            <ScoreBadge score={lead.score} size="sm" showLabel={false} />
          </div>

          <div className="flex items-center justify-between gap-2 mt-1 text-[11px]">
            <span className="text-ink-dim truncate min-w-0">
              {showRep
                ? lead.rep_name || <span className="text-ink-faint">Unassigned</span>
                : lead.location}
            </span>
            <span
              className={cn(
                "mono tabular shrink-0",
                lead.days_in_stage > 30
                  ? "text-signal-hot font-semibold"
                  : lead.days_in_stage > 14
                    ? "text-signal-warm"
                    : "text-ink-faint"
              )}
              title={`${lead.days_in_stage} days in this stage`}
            >
              {lead.days_in_stage}d
            </span>
          </div>

          {showRep && lead.location && (
            <p className="text-[10.5px] text-ink-faint mt-0.5 truncate">
              {lead.location}
            </p>
          )}
        </Link>
      </div>
    </article>
  );
}
