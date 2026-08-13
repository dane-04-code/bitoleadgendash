import Link from "next/link";
import { AuthClock } from "@/components/auth-clock";
import { cn } from "@/lib/utils";

/**
 * The shell both auth screens share: a teal brand field on the left, and the
 * terminal column on the right carrying the status line, the mode toggle, the
 * card, and the footer.
 *
 * The toggle is two links rather than client state — /login and /signup stay
 * real, linkable, server-rendered routes, and the `next` param survives the
 * switch.
 */
export function AuthShell({
  mode,
  chips,
  next,
  children,
}: {
  mode: "signin" | "signup";
  chips: string[];
  next?: string;
  children: React.ReactNode;
}) {
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
      {/* LEFT — the brand field. The one region the hue owns outright. */}
      <aside className="relative hidden overflow-hidden bg-brand-ink lg:flex lg:flex-col lg:justify-end lg:p-14">
        {/* Ruled grid, then a soft lift in the upper right so the field reads
            as lit rather than flat. Both stay inside the teal ramp. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 47px, hsl(0 0% 100% / 0.5) 47px 48px), repeating-linear-gradient(90deg, transparent 0 47px, hsl(0 0% 100% / 0.5) 47px 48px)",
          }}
        />
        <div
          aria-hidden
          className="absolute -right-[18%] -top-[28%] h-[80%] w-[80%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.55) 0%, transparent 68%)",
          }}
        />

        <div className="relative z-10">
          <h2 className="display-serif max-w-[14ch] text-[clamp(56px,7vw,104px)] uppercase leading-[0.9] text-rail-ink">
            Catch the <span className="text-rail-mark">signal</span> before the
            warehouse is built.
          </h2>

          <p className="mt-8 max-w-md text-[14px] leading-relaxed text-rail-2">
            Real-time intelligence on warehouse expansion across the GCC.
            <br />
            Triage, assign, and close — from one terminal.
          </p>

          <div className="mono mt-12 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.14em] text-rail-3">
            BITO UAE · GCC Region
          </div>
        </div>
      </aside>

      {/* RIGHT — the terminal column */}
      <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <AuthClock />
          <span className="mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            <span className="dot bg-signal-good" />
            Service online
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            {/* Mode toggle */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
            >
              <ModeLink href={loginHref} active={mode === "signin"}>
                Sign in
              </ModeLink>
              <ModeLink href="/signup" active={mode === "signup"}>
                Create account
              </ModeLink>
            </div>

            <div className="panel lift-1 p-6 sm:p-7">{children}</div>

            {chips.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <li
                    key={c}
                    className="mono rounded-md bg-surface px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-dim"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mono flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          <span className="tabular">v0.1.0</span>
          <span>BITO UAE · Internal use only</span>
        </div>
      </main>
    </div>
  );
}

function ModeLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        "mono rounded-md px-3 py-2.5 text-center text-[10.5px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "lift-1 bg-surface text-ink"
          : "text-ink-dim hover:text-ink"
      )}
    >
      {children}
    </Link>
  );
}

/**
 * The card's closing line: the cross-link on the left, a help disclosure on
 * the right. Help is a native <details> so it works with no JavaScript, and it
 * points at the admin rather than inventing a support address.
 */
export function AuthCardFooter({
  question,
  linkLabel,
  href,
}: {
  question: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="text-[12.5px] text-ink-dim">
        {question}{" "}
        <Link
          href={href}
          className="font-medium text-brand-ink underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      </p>
      <details className="group">
        <summary className="mono cursor-pointer list-none text-[10px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
          Help
        </summary>
        <p className="mt-2 max-w-[38ch] text-[11.5px] leading-relaxed text-ink-dim">
          Your BITO admin issues sign-up codes and resets passwords. Accounts are
          created for reps only — there is no self-serve admin access.
        </p>
      </details>
    </div>
  );
}
