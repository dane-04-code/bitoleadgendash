"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, { code: string; label: string }> = {
  "/dashboard": { code: "01", label: "Inbox" },
  "/pipeline": { code: "02", label: "Pipeline" },
  "/reps": { code: "03", label: "Team" },
  "/feedback": { code: "·", label: "Feedback" },
  "/settings": { code: "04", label: "Settings" },
  "/my": { code: "A", label: "My leads" },
};

export function TopUtilityBar({ role }: { role: "admin" | "rep" }) {
  const pathname = usePathname();
  const matched =
    Object.entries(PAGE_LABELS).find(([k]) =>
      pathname === k || pathname.startsWith(`${k}/`)
    )?.[1] ||
    (pathname.startsWith("/leads")
      ? { code: role === "admin" ? "01" : "A", label: "Lead Detail" }
      : null);

  const [time, setTime] = React.useState<string>(() => formatTime(new Date()));

  React.useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden lg:flex h-9 items-center justify-between border-b border-line bg-surface px-5 sm:px-8 lg:px-10 mono text-[10px] uppercase tracking-wider text-ink-faint">
      <div className="flex items-center gap-5">
        {matched && (
          <span className="flex items-center gap-2">
            <span className="text-ink-faint">{matched.code}</span>
            <span className="text-ink-2">{matched.label}</span>
          </span>
        )}
        <span className="hidden md:inline">Region · GCC</span>
        <span className="hidden md:inline">Currency · AED</span>
      </div>
      <div className="flex items-center gap-5">
        <span className="hidden md:inline">
          {role === "admin" ? "Role · Admin" : "Role · Sales rep"}
        </span>
        <span className="hidden md:inline">UTC+04 / Asia · Dubai</span>
        <span className="text-ink-2 tabular">{time}</span>
        <span className="flex items-center gap-1.5 text-signal-good">
          <span className="dot bg-signal-good" />
          Online
        </span>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dubai",
  });
}
