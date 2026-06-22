"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Columns3,
  Users,
  Cog,
  LogOut,
  User,
  UserCog,
  MessageSquare,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const ADMIN_NAV = [
  { href: "/dashboard", label: "Inbox", code: "01", icon: LayoutGrid },
  { href: "/pipeline",  label: "Pipeline", code: "02", icon: Columns3 },
  { href: "/reps",      label: "Team", code: "03", icon: Users },
  { href: "/feedback",  label: "Feedback", code: "04", icon: MessageSquare },
  { href: "/settings",  label: "Settings", code: "05", icon: Cog },
];

const REP_NAV = [
  { href: "/my", label: "My leads", code: "01", icon: LayoutGrid },
  { href: "/my/account", label: "Account", code: "02", icon: UserCog },
  { href: "/feedback", label: "Feedback", code: "03", icon: MessageSquare },
];

export type SidebarUser =
  | { role: "admin"; label: string }
  | { role: "rep"; label: string; email?: string | null; territory?: string | null };

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const nav = user.role === "admin" ? ADMIN_NAV : REP_NAV;

  return (
    <aside className="hidden lg:flex h-screen w-[232px] shrink-0 flex-col border-r border-line bg-surface sticky top-0">
      <div className="px-5 pt-6 pb-5 border-b border-line">
        <Link href={user.role === "admin" ? "/dashboard" : "/my"} className="flex items-start gap-3 group">
          <div className="relative h-9 w-9 shrink-0 border border-line-strong flex items-center justify-center bg-bg">
            <span className="display-serif text-ink text-lg leading-none">Li</span>
            <span className="absolute -top-px -right-px w-1.5 h-1.5 bg-brand" />
          </div>
          <div className="leading-tight pt-0.5">
            <div className="text-[13px] font-semibold tracking-tight text-ink">
              LeadIntelligence
            </div>
            <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
              BITO UAE · GCC
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2.5 py-4">
        <div className="px-2 pb-2 mono text-[10px] uppercase tracking-wider text-ink-faint">
          {user.role === "admin" ? "Navigation" : "Workspace"}
        </div>
        <ul className="space-y-px">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/my" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-sm px-2.5 py-2 text-[13px] transition-colors relative",
                    active
                      ? "bg-surface-3 text-ink"
                      : "text-ink-dim hover:text-ink hover:bg-surface-2"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-px bg-brand" />
                  )}
                  <span className="mono text-[10px] text-ink-faint w-5 shrink-0">
                    {item.code}
                  </span>
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3 space-y-3">
        {user.role === "rep" ? (
          <div className="px-1.5 flex items-center gap-2.5">
            <div className="display-serif text-sm text-ink-2 w-8 h-8 border border-line-strong flex items-center justify-center shrink-0 bg-surface-2">
              {initials(user.label)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-ink truncate">
                {user.label}
              </div>
              <div className="mono text-[10px] uppercase tracking-wider text-ink-faint truncate">
                {user.territory ? user.territory : "Sales rep"}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-1.5 flex items-center gap-2.5">
            <div className="w-8 h-8 border border-line-strong flex items-center justify-center shrink-0 bg-surface-2">
              <User className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-ink truncate">
                Admin
              </div>
              <div className="mono text-[10px] uppercase tracking-wider text-signal-good flex items-center gap-1.5">
                <span className="dot bg-signal-good" />
                Active
              </div>
            </div>
          </div>
        )}

        <ThemeToggle />

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[12px] text-ink-dim hover:text-ink hover:bg-surface-2 transition-colors"
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
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
      <Link href={home} className="flex items-center gap-2.5">
        <div className="relative h-7 w-7 border border-line-strong flex items-center justify-center bg-bg">
          <span className="display-serif text-ink text-sm leading-none">Li</span>
          <span className="absolute -top-px -right-px w-1 h-1 bg-brand" />
        </div>
        <span className="font-semibold text-[13px] tracking-tight">LeadIntelligence</span>
      </Link>
      <nav className="flex items-center gap-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                active
                  ? "bg-surface-3 text-ink border border-line"
                  : "text-ink-dim hover:text-ink"
              )}
              aria-label={item.label}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          );
        })}
        <ThemeToggle compact />
        <form action="/api/auth/logout" method="post" className="ml-1">
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-dim hover:text-ink transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </form>
      </nav>
    </header>
  );
}
