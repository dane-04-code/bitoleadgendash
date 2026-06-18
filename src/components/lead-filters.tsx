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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/supabase/types";

const ANY = "__any__";

const SCORE_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "50", label: "50+" },
  { value: "70", label: "70+" },
  { value: "80", label: "Hot · 80+" },
  { value: "90", label: "90+" },
];

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
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company or signal…"
          className="pl-8 h-9"
        />
      </div>

      {/* Status */}
      <Select
        value={status0 || ANY}
        onValueChange={(v) => push({ status: v })}
      >
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue placeholder="Status" />
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

      {/* Industry */}
      {industries.length > 0 && (
        <Select
          value={industry0 || ANY}
          onValueChange={(v) => push({ industry: v })}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Industry" />
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

      {/* Min score */}
      <Select
        value={minScore0 || "0"}
        onValueChange={(v) => push({ minScore: v })}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Score" />
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.replace(view ? `/dashboard?view=${view}` : "/dashboard", {
              scroll: false,
            });
          }}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
