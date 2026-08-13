"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/supabase/types";

const ANY = "__any__";

const SCORE_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "50", label: "50+" },
  { value: "70", label: "70+" },
  { value: "80", label: "Hot · 80+" },
  { value: "90", label: "90+" },
];

/** The comp's filter control: a soft white pill on the mint ground. */
const PILL =
  "h-auto w-auto gap-2.5 rounded-lg border-0 bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-2 " +
  "transition-colors hover:bg-surface-3 hover:text-brand-deep focus:bg-surface-3 focus:text-brand-deep " +
  "data-[state=open]:bg-surface-3 data-[state=open]:text-brand-deep";

export function LeadFilters({ industries }: { industries: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") || "";
  const q0 = searchParams.get("q") || "";
  const status0 = searchParams.get("status") || "";
  const industry0 = searchParams.get("industry") || "";
  const minScore0 = searchParams.get("minScore") || "0";

  const [q, setQ] = React.useState(q0);

  // Keep the text box in sync if the URL changes elsewhere (e.g. clear).
  React.useEffect(() => setQ(q0), [q0]);

  const push = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === ANY || value === "0") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams]
  );

  // Debounce the free-text search.
  React.useEffect(() => {
    if (q === q0) return;
    const t = setTimeout(() => push({ q: q || null }), 300);
    return () => clearTimeout(t);
  }, [q, q0, push]);

  const active =
    Boolean(q0) ||
    Boolean(status0) ||
    Boolean(industry0) ||
    (minScore0 !== "0" && minScore0 !== "");

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-[18px]">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-ghost"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company or signal…"
          aria-label="Search leads by company or signal"
          className="w-full rounded-lg border-0 bg-surface py-2.5 pl-10 pr-3 text-[13px] font-medium text-ink placeholder:font-normal placeholder:text-ink-faint transition-colors focus:bg-surface-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-brand"
        />
      </div>

      <Select value={status0 || ANY} onValueChange={(v) => push({ status: v })}>
        <SelectTrigger className={PILL} aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All statuses</SelectItem>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {industries.length > 0 && (
        <Select
          value={industry0 || ANY}
          onValueChange={(v) => push({ industry: v })}
        >
          <SelectTrigger className={PILL} aria-label="Filter by industry">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={minScore0 || "0"}
        onValueChange={(v) => push({ minScore: v })}
      >
        <SelectTrigger className={PILL} aria-label="Filter by minimum score">
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

      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.replace(view ? `/dashboard?view=${view}` : "/dashboard", {
              scroll: false,
            });
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-faint transition-colors hover:bg-surface hover:text-brand-deep"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear
        </button>
      )}
    </div>
  );
}
