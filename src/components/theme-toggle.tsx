"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Toggles the `dark` class on <html> and persists the choice to localStorage.
 * The initial class is applied pre-paint by the inline script in the root
 * layout, so there's no flash. `mounted` guards against hydration mismatch:
 * we only reflect the real theme after the component mounts on the client.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
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
        className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-dim hover:text-ink transition-colors"
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
      className="w-full flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[12px] text-ink-dim hover:text-ink hover:bg-surface-2 transition-colors"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {mounted ? label : "Theme"}
    </button>
  );
}
