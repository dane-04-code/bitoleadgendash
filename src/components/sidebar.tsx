"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Columns3,
  Users,
  Cog,
  LogOut,
  UserCog,
  MessageSquare,
  Store,
  Search,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCommandPalette } from "@/components/command-palette";

const ADMIN_NAV = [
  { href: "/dashboard",   label: "Inbox", code: "01", icon: LayoutGrid },
  { href: "/pipeline",    label: "Pipeline", code: "02", icon: Columns3 },
  { href: "/marketplace", label: "Marketplace", code: "03", icon: Store },
  { href: "/reps",        label: "Team", code: "04", icon: Users },
  { href: "/feedback",    label: "Feedback", code: "05", icon: MessageSquare },
  { href: "/settings",    label: "Settings", code: "06", icon: Cog },
];

const REP_NAV = [
  { href: "/my", label: "My leads", code: "01", icon: LayoutGrid },
  { href: "/marketplace", label: "Marketplace", code: "02", icon: Store },
  { href: "/feedback", label: "Feedback", code: "03", icon: MessageSquare },
  { href: "/my/account", label: "Account", code: "04", icon: UserCog },
];

export type SidebarUser =
  | { role: "admin"; label: string }
  | { role: "rep"; label: string; email?: string | null; territory?: string | null };

/** Live counts for the nav badges, keyed by href. Absent = no badge. */
export type NavCounts = Record<string, number>;

export function Sidebar({
  user,
  counts,
}: {
  user: SidebarUser;
  counts?: NavCounts;
}) {
  const pathname = usePathname();
  const nav = user.role === "admin" ? ADMIN_NAV : REP_NAV;
  const { open } = useCommandPalette();

  return (
    <aside className="hidden lg:flex h-screen w-[236px] shrink-0 flex-col bg-surface sticky top-0 px-4 pt-[22px] pb-[18px] gap-6">
      <Link
        href={user.role === "admin" ? "/dashboard" : "/my"}
        className="flex items-center gap-[11px] px-1.5 rounded-md"
      >
        {/* Reserved logo slot. BITO's mark is deliberately never placed — the
            space is held so it can be, without a relayout. */}
        <span aria-hidden className="block w-7 shrink-0" />
        <span className="block">
          <span className="block text-[14.5px] font-bold leading-tight text-ink">
            LeadIntelligence
          </span>
          <span className="mono block text-[9.5px] font-medium uppercase tracking-[0.13em] text-ink-faint mt-0.5">
            BITO UAE · GCC
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={open}
        className="flex items-center gap-2.5 rounded-md bg-surface-2 px-3 py-2.5 text-[12.5px] text-ink-dim transition-colors hover:bg-surface-3 hover:text-brand-deep"
      >
        <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="mono text-[10px] text-ink-faint">⌘K</kbd>
      </button>

      <nav className="flex flex-col gap-0.5">
        <div className="mono px-2.5 pb-2 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          {user.role === "admin" ? "Navigation" : "Workspace"}
        </div>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/my" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = counts?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-[11px] rounded-md px-2.5 py-2.5 transition-colors",
                active
                  ? "bg-surface-3 text-brand-deep"
                  : "text-ink-dim hover:bg-surface-2 hover:text-brand-deep"
              )}
            >
              <span
                className={cn(
                  "mono w-3.5 shrink-0 text-[9.5px] font-medium",
                  active ? "text-brand-soft" : "text-ink-ghost"
                )}
              >
                {item.code}
              </span>
              <Icon
                className="h-3.5 w-3.5 shrink-0 opacity-70"
                strokeWidth={1.75}
                aria-hidden
              />
              <span
                className={cn(
                  "flex-1 text-[13.5px]",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={cn(
                    "mono text-[10px] font-semibold tabular",
                    active ? "text-brand" : "text-ink-ghost"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-brand-deep">
            {user.role === "admin" ? "AD" : initials(user.label)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold leading-tight text-ink">
              {user.role === "admin" ? "Admin" : user.label}
            </span>
            <span className="mono mt-0.5 flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-brand-soft">
              {user.role === "admin"
                ? "Active"
                : user.territory || "Sales rep"}
            </span>
          </span>
        </div>

        <ThemeToggle />

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-ink-dim transition-colors hover:bg-surface-2 hover:text-brand-deep"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopbar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const nav = user.role === "admin" ? ADMIN_NAV : REP_NAV;
  const home = user.role === "admin" ? "/dashboard" : "/my";
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-surface px-4 py-3">
      <Link href={home} className="min-w-0 shrink rounded-md">
        <span className="block truncate text-[13.5px] font-bold tracking-tight text-ink">
          LeadIntelligence
        </span>
      </Link>
      {/* Eight targets do not fit a 390px bar. The rail scrolls rather than
          clipping sign-out off the right edge. */}
      <nav className="flex shrink-0 items-center gap-0.5 overflow-x-auto scrollbar-thin">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-surface-3 text-brand-deep"
                  : "text-ink-dim hover:text-brand-deep"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          );
        })}
        <ThemeToggle compact />
        <form action="/api/auth/logout" method="post" className="ml-1">
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-dim transition-colors hover:text-brand-deep"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </form>
      </nav>
    </header>
  );
}
