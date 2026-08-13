import { LogOut } from "lucide-react";
import { StatStrip, Stat } from "@/components/stat-strip";
import { ThemeChoice } from "@/components/theme-toggle";
import { isMockMode } from "@/lib/mock-data";
import { SESSION_MAX_AGE_SECONDS, SESSION_COOKIE } from "@/lib/auth-edge";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).host : "Not configured";
    } catch {
      return "Invalid URL";
    }
  })();

  const mock = isMockMode();
  const anonKeySet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const passwordSet = Boolean(process.env.DASHBOARD_PASSWORD);
  const signupCodeSet = Boolean(process.env.REP_SIGNUP_CODE);
  const sessionDays = Math.round(SESSION_MAX_AGE_SECONDS / 86400);

  return (
    <div>
      <h1 className="sr-only">Settings — environment, access and appearance</h1>

      <StatStrip number="06" className="mb-5">
        <Stat
          label="Data source"
          value={mock ? "Mock" : "Live"}
          tone={mock ? "warn" : "brand"}
        />
        <Stat label="Build" value="0.1.0" />
        <Stat label="Region" value="GCC" />
      </StatStrip>

      <div className="mb-4 h-px bg-line" />

      {/* One panel of headed sections rather than a grid of equal cards: this
          screen is a list of facts to scan, and the label column keeps the
          values in a single readable measure. */}
      <div className="panel divide-y divide-line-soft">
        <Section
          title="Session"
          hint="Who this browser is signed in as, and for how long."
        >
          <Row label="Signed in as" value={session?.role === "rep" ? "Sales rep" : "Admin"} />
          <Row label="Stays signed in" value={`${sessionDays} days`} />
          <Row label="Cookie" value={`${SESSION_COOKIE} · HMAC-signed`} />
          <Action>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-surface-3 hover:text-brand-deep"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Sign out of this device
              </button>
            </form>
          </Action>
        </Section>

        <Section title="Appearance" hint="Applies to this browser only.">
          <Row label="Theme" control={<ThemeChoice />} />
        </Section>

        <Section
          title="Data source"
          hint="Where the dashboard reads leads from. Set in .env.local."
        >
          <Row
            label="Mode"
            value={mock ? "Mock data — no database" : "Live database"}
            status={mock ? "warn" : "ok"}
          />
          {/* In mock mode these values exist but are placeholders, so a green
              "ok" would read as a working database connection. */}
          <Row
            label="Project host"
            value={supabaseHost}
            status={mock ? "warn" : supabaseUrl ? "ok" : "missing"}
          />
          <Row
            label="Anon key"
            value={
              anonKeySet ? (mock ? "Placeholder value" : "Configured") : "Missing"
            }
            status={mock ? "warn" : anonKeySet ? "ok" : "missing"}
          />
          {mock && (
            <Note>
              Placeholder Supabase values keep the app on the fixture set in{" "}
              <code className="mono text-brand-ink">src/lib/mock-data.ts</code>.
              This is the intended local demo path — every screen renders without
              a database.
            </Note>
          )}
        </Section>

        <Section
          title="Access"
          hint="This app does not use Supabase Auth. Credentials live in the environment."
        >
          <Row
            label="Admin password"
            value={passwordSet ? "Set" : "Not set — login disabled"}
            status={passwordSet ? "ok" : "missing"}
          />
          <Row
            label="Rep signup code"
            value={signupCodeSet ? "Set" : "Not set — rep signup closed"}
            status={signupCodeSet ? "ok" : "missing"}
          />
        </Section>

        <Section title="About" hint="LeadIntelligence — lead terminal for BITO UAE.">
          <Row label="Version" value="0.1.0" />
          <Row label="Stack" value="Next.js 14 · Supabase" />
          <Row label="Owner" value="BITO UAE" />
          <Row label="Region" value="GCC" />
        </Section>
      </div>
    </div>
  );
}

/**
 * A headed group. The title column holds still on the left while the values
 * run down the right, so the eye scans one column of facts rather than
 * re-finding the value position in every card.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 p-[18px] lg:flex-row lg:gap-8 lg:p-6">
      <div className="lg:w-[220px] lg:shrink-0">
        <h2 className="text-[13.5px] font-bold text-ink">{title}</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{hint}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
    </section>
  );
}

const STATUS_DOT = {
  ok: "bg-signal-good",
  warn: "bg-stage-assigned",
  missing: "bg-stage-dead",
} as const;

/**
 * The dot is redundant emphasis — the value already says "Configured" or
 * "Missing" in words, so the state never rests on colour.
 */
function Row({
  label,
  value,
  status,
  control,
}: {
  label: string;
  value?: string;
  status?: keyof typeof STATUS_DOT;
  control?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <span className="text-[12.5px] text-ink-faint">{label}</span>
      {control ?? (
        <span className="flex min-w-0 items-center gap-2">
          {status && <span className={cn("dot shrink-0", STATUS_DOT[status])} />}
          <span className="mono truncate text-[12px] text-ink-2">{value}</span>
        </span>
      )}
    </div>
  );
}

function Action({ children }: { children: React.ReactNode }) {
  return <div className="pt-1">{children}</div>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-surface-2 px-3.5 py-3 text-[12px] leading-relaxed text-ink-dim">
      {children}
    </p>
  );
}

