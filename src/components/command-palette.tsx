"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Columns3,
  Users,
  Cog,
  Store,
  MessageSquare,
  UserCog,
  Building2,
  CornerDownLeft,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn, scoreTier } from "@/lib/utils";
import type { SearchLead, SearchRep } from "@/app/api/search/route";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };

const CommandPaletteContext = createContext<Ctx>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: "Go to" | "Leads" | "Team";
  icon: LucideIcon;
  href: string;
  score?: number | null;
};

const ADMIN_ROUTES: Item[] = [
  { id: "r-dash", label: "Inbox", group: "Go to", icon: LayoutGrid, href: "/dashboard" },
  { id: "r-pipe", label: "Pipeline", group: "Go to", icon: Columns3, href: "/pipeline" },
  { id: "r-mkt", label: "Marketplace", group: "Go to", icon: Store, href: "/marketplace" },
  { id: "r-reps", label: "Team", group: "Go to", icon: Users, href: "/reps" },
  { id: "r-fb", label: "Feedback", group: "Go to", icon: MessageSquare, href: "/feedback" },
  { id: "r-set", label: "Settings", group: "Go to", icon: Cog, href: "/settings" },
];

const REP_ROUTES: Item[] = [
  { id: "r-my", label: "My leads", group: "Go to", icon: LayoutGrid, href: "/my" },
  { id: "r-mkt", label: "Marketplace", group: "Go to", icon: Store, href: "/marketplace" },
  { id: "r-fb", label: "Feedback", group: "Go to", icon: MessageSquare, href: "/feedback" },
  { id: "r-acc", label: "Account", group: "Go to", icon: UserCog, href: "/my/account" },
];

export function CommandPaletteProvider({
  role,
  children,
}: {
  role: "admin" | "rep";
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [data, setData] = useState<{ leads: SearchLead[]; reps: SearchRep[] } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  // ⌘K / Ctrl-K from anywhere, and "/" when not already typing somewhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load the index lazily, once, the first time the palette is opened.
  useEffect(() => {
    if (!isOpen || data || loading) return;
    setLoading(true);
    fetch("/api/search")
      .then((r) => (r.ok ? r.json() : { leads: [], reps: [] }))
      .then((d) => setData(d))
      .catch(() => setData({ leads: [], reps: [] }))
      .finally(() => setLoading(false));
  }, [isOpen, data, loading]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const routes = role === "admin" ? ADMIN_ROUTES : REP_ROUTES;

  const items = useMemo<Item[]>(() => {
    const leadItems: Item[] = (data?.leads ?? []).map((l) => ({
      id: `l-${l.id}`,
      label: l.company,
      hint: [l.statusLabel, l.location, l.rep].filter(Boolean).join(" · "),
      group: "Leads",
      icon: Building2,
      href: `/leads/${l.id}`,
      score: l.score,
    }));
    const repItems: Item[] = (data?.reps ?? []).map((r) => ({
      id: `p-${r.id}`,
      label: r.name,
      hint: r.territory || "Sales rep",
      group: "Team",
      icon: Users,
      href: `/reps/${r.id}`,
    }));
    return [...routes, ...leadItems, ...repItems];
  }, [data, routes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 30);
    const scored = items
      .map((it) => {
        const label = it.label.toLowerCase();
        const hint = (it.hint ?? "").toLowerCase();
        let rank = -1;
        if (label.startsWith(q)) rank = 0;
        else if (label.includes(q)) rank = 1;
        else if (hint.includes(q)) rank = 2;
        return { it, rank };
      })
      .filter((r) => r.rank >= 0)
      .sort((a, b) => a.rank - b.rank);
    return scored.slice(0, 40).map((r) => r.it);
  }, [items, query]);

  useEffect(() => setCursor(0), [query]);

  const go = useCallback(
    (item: Item) => {
      close();
      router.push(item.href);
    },
    [close, router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[cursor];
      if (item) go(item);
    }
  }

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, results.length]);

  let lastGroup = "";

  return (
    <CommandPaletteContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search and navigate"
        >
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-ink/25 dark:bg-black/60"
            onClick={close}
            tabIndex={-1}
          />
          <div className="relative w-full max-w-xl border border-line-strong bg-surface lift-3">
            <div className="flex items-center gap-2.5 border-b border-line px-3.5">
              <Search className="h-4 w-4 text-ink-faint shrink-0" strokeWidth={1.75} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search leads, people and pages…"
                aria-label="Search leads, people and pages"
                className="flex-1 bg-transparent py-3 text-[14px] text-ink placeholder:text-ink-faint outline-none"
              />
              <kbd className="mono text-[10px] text-ink-faint border border-line px-1.5 py-0.5 shrink-0">
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[52vh] overflow-y-auto scrollbar-thin py-1"
            >
              {loading && !data && (
                <p className="px-3.5 py-6 text-[13px] text-ink-dim">Loading…</p>
              )}

              {!loading && results.length === 0 && (
                <div className="px-3.5 py-8 text-center">
                  <p className="text-[13px] text-ink-2 font-semibold">No matches</p>
                  <p className="text-[12px] text-ink-dim mt-1">
                    Try a company, a person, or a page name.
                  </p>
                </div>
              )}

              {results.map((item, i) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;
                const Icon = item.icon;
                const active = i === cursor;
                const tier =
                  typeof item.score === "number" ? scoreTier(item.score) : null;
                return (
                  <div key={item.id}>
                    {showGroup && (
                      <div className="label-xs px-3.5 pt-3 pb-1.5">{item.group}</div>
                    )}
                    <button
                      type="button"
                      data-active={active}
                      onMouseMove={() => setCursor(i)}
                      onClick={() => go(item)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3.5 py-2 text-left",
                        active ? "bg-brand-bg" : "hover:bg-surface-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-brand" : "text-ink-faint"
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="text-[13px] text-ink truncate flex-1 min-w-0">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="text-[11px] text-ink-dim truncate max-w-[45%] hidden sm:block">
                          {item.hint}
                        </span>
                      )}
                      {tier && (
                        <span
                          className={cn(
                            "mono text-[11px] font-bold shrink-0 tabular",
                            tier === "hot" && "text-signal-hot",
                            tier === "warm" && "text-signal-warm",
                            tier === "cold" && "text-signal-cold"
                          )}
                        >
                          {item.score}
                        </span>
                      )}
                      {active && (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 text-brand shrink-0"
                          strokeWidth={1.75}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line px-3.5 py-2 flex items-center gap-4 text-[10.5px] text-ink-faint">
              <span className="flex items-center gap-1.5">
                <kbd className="mono border border-line px-1">↑</kbd>
                <kbd className="mono border border-line px-1">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="mono border border-line px-1">↵</kbd>
                open
              </span>
              <span className="ml-auto hidden sm:flex items-center gap-1.5">
                <kbd className="mono border border-line px-1">/</kbd>
                anywhere
              </span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}
