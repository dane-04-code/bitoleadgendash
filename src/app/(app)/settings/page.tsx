import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, MetaItem } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).host : "Not configured";
    } catch {
      return "Invalid URL";
    }
  })();
  const passwordSet = Boolean(process.env.DASHBOARD_PASSWORD);

  return (
    <div className="animate-fade-in">
      <PageHeader
        number="04"
        eyebrow="Lead Intelligence Terminal / Settings"
        title={
          <>
            Configuration &amp; <em className="text-brand-ink">control</em>.
          </>
        }
        subtitle="Environment health, branding, and session controls."
        meta={
          <>
            <MetaItem label="Build" value="0.1.0" />
            <MetaItem label="Region" value="GCC" />
            <MetaItem label="Owner" value="BITO UAE" />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-line border border-line">
        <Panel code="A" title="Supabase" hint="Database connection used by the dashboard.">
          <Row label="Project host" value={supabaseHost} status={supabaseUrl ? "ok" : "missing"} />
          <Row
            label="Anon key"
            value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configured" : "Missing"}
            status={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "missing"}
          />
          <p className="mono text-[11px] text-ink-faint pt-3 mt-3 border-t border-line">
            Manage these in your{" "}
            <code className="text-brand-ink">.env.local</code> file.
          </p>
        </Panel>

        <Panel code="B" title="Access" hint="Single shared password protects the dashboard.">
          <Row
            label="DASHBOARD_PASSWORD"
            value={passwordSet ? "Set" : "Not set — login disabled"}
            status={passwordSet ? "ok" : "missing"}
          />
          <Row label="Session" value="HMAC-signed cookie · 14 days" status="ok" />
          <form action="/api/auth/logout" method="post" className="pt-3 mt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="submit">
              <LogOut className="h-3 w-3" strokeWidth={1.75} />
              Sign out of this device
            </Button>
          </form>
        </Panel>

        <Panel code="C" title="Brand palette" hint="Tuned to operational, considered green.">
          <div className="grid grid-cols-2 gap-2">
            <Swatch hex="#FAF8F3" name="Paper" />
            <Swatch hex="#FFFFFF" name="Surface" />
            <Swatch hex="#1A6B3A" name="Accent" />
            <Swatch hex="#1A1F23" name="Ink" />
          </div>
        </Panel>

        <Panel code="D" title="About" hint="LeadIntelligence — sales lead terminal for BITO UAE.">
          <Row label="Version" value="0.1.0" />
          <Row label="Region" value="GCC" />
          <Row label="Owner" value="BITO UAE" />
          <Row label="Stack" value="Next.js 14 · Supabase" />
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  code,
  title,
  hint,
  children,
}: {
  code: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface p-6">
      <header className="mb-5 pb-3 border-b border-line">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            {code}
          </span>
          <h2 className="display-serif text-xl text-ink leading-none">{title}</h2>
        </div>
        <p className="text-[12px] text-ink-dim leading-relaxed">{hint}</p>
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "ok" | "missing";
}) {
  return (
    <div className="flex items-center justify-between gap-3 mono text-[11px]">
      <span className="text-ink-faint uppercase tracking-wider">{label}</span>
      <span className="flex items-center gap-2 text-ink-2">
        {status && (
          <span
            className={`dot ${
              status === "ok" ? "bg-signal-good" : "bg-signal-hot"
            }`}
          />
        )}
        <span className="truncate max-w-[220px] text-right">{value}</span>
      </span>
    </div>
  );
}

function Swatch({ hex, name }: { hex: string; name: string }) {
  return (
    <div className="border border-line p-2.5 flex items-center gap-2.5">
      <div
        className="h-9 w-9 border border-line shrink-0"
        style={{ background: hex }}
      />
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-ink truncate">{name}</div>
        <div className="mono text-[10px] uppercase tracking-wider text-ink-faint">
          {hex}
        </div>
      </div>
    </div>
  );
}
