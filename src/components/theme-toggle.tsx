"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Toggles the `dark` class on <html> and persists the choice to localStorage.
 * The initial class is applied pre-paint by the inline script in the root
 * layout, so there's no flash. `mounted` guards against hydration mismatch:
 * we only reflect the real theme after the component mounts on the client.
 */
export function ThemeToggle({
  compact = false,
  onRail = false,
}: {
  compact?: boolean;
  /** Rendered on the teal rail, which carries its own on-colour ink ramp. */
  onRail?: boolean;
}) {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode / storage disabled — fine, just won't persist */
    }
  }

  const Icon = dark ? Sun : Moon;
  const label = dark ? "Light mode" : "Dark mode";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={
          onRail
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-rail-2 hover:text-rail-ink transition-colors"
            : "flex h-8 w-8 items-center justify-center rounded-md text-ink-dim hover:text-ink transition-colors"
        }
      >
        {mounted ? (
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        ) : (
          <span className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={
        onRail
          ? "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-rail-2 hover:bg-rail-hover hover:text-rail-ink transition-colors"
          : "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-ink-dim hover:text-ink hover:bg-surface-2 transition-colors"
      }
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {mounted ? label : "Theme"}
    </button>
  );
}

/**
 * The explicit two-state control for the settings screen, where theme is a
 * setting to be read rather than a button to be flipped. Same storage and
 * same pre-paint script as ThemeToggle — only the affordance differs.
 *
 * Nothing is marked selected until after mount: the server cannot know which
 * theme the inline script applied, so claiming one would be a hydration lie.
 */
export function ThemeChoice() {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function choose(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode / storage disabled — fine, just won't persist */
    }
  }

  const options = [
    { value: false, label: "Light", Icon: Sun },
    { value: true, label: "Dark", Icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-lg bg-surface-2 p-1"
    >
      {options.map(({ value, label, Icon }) => {
        const selected = mounted && dark === value;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(value)}
            className={
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
              (selected
                ? "bg-surface text-brand-deep lift-1"
                : "text-ink-dim hover:text-ink")
            }
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
