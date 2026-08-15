"use client";

import * as React from "react";

/**
 * Region + local time for the terminal's status line.
 *
 * The time is rendered client-side only. A server-rendered clock is stale the
 * moment it ships and would mismatch on hydration, so the slot holds its width
 * with an em dash until the first tick lands.
 */
export function AuthClock() {
  const [time, setTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    const read = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      );

    read();
    // Tick on the minute boundary rather than every second — the display has
    // minute resolution, so a per-second interval is wasted work.
    const id = setInterval(read, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
      Asia / Dubai · <span className="tabular">{time ?? "—:—"}</span>
    </span>
  );
}
