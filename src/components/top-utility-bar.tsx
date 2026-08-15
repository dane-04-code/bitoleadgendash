"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, { code: string; label: string }> = {
  "/dashboard": { code: "01", label: "Inbox" },
  "/pipeline": { code: "02", label: "Pipeline" },
  "/marketplace": { code: "03", label: "Marketplace" },
  "/reps": { code: "04", label: "Team" },
  "/feedback": { code: "05", label: "Feedback" },
  "/settings": { code: "06", label: "Settings" },
  "/my": { code: "01", label: "My leads" },
};

export function TopUtilityBar({ role }: { role: "admin" | "rep" }) {
  const pathname = usePathname();
  const matched =
    Object.entries(PAGE_LABELS).find(([k]) =>
      pathname === k || pathname.startsWith(`${k}/`)
    )?.[1] ||
    (pathname.startsWith("/leads")
      ? { code: role === "admin" ? "01" : "01", label: "Lead detail" }
      : null);

  // The clock only renders after mount. Rendering it on the server produces a
  // different minute than the client and breaks hydration.
  const [time, setTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tick = () => setTime(formatTime(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mono hidden lg:flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint mb-[26px]">
      {matched && (
        <span className="text-brand">
          {matched.code} {matched.label}
        </span>
      )}
      <span>Region · GCC</span>
      <span>Currency · AED</span>
      <span className="ml-auto">
        {role === "admin" ? "Role · Admin" : "Role · Sales rep"}
      </span>
      <span>
        Asia / Dubai
        {time && <span className="tabular"> · {time}</span>}
      </span>
      <span className="flex items-center gap-1.5 text-brand">
        <span className="dot bg-brand" />
        Online
      </span>
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
