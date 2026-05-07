import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  if (await isAuthenticated()) {
    redirect(searchParams.next || "/dashboard");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_460px]">
      {/* LEFT — editorial / brand */}
      <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-line bg-surface relative overflow-hidden">
        {/* subtle grid backdrop */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 31px, hsla(200,12%,10%,0.05) 31px 32px), repeating-linear-gradient(90deg, transparent 0 31px, hsla(200,12%,10%,0.05) 31px 32px)",
          }}
        />

        <header className="relative z-10 flex items-start gap-3">
          <div className="relative h-9 w-9 border border-line-strong flex items-center justify-center bg-bg shrink-0">
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
        </header>

        <div className="relative z-10 max-w-md">
          <div className="eyebrow mb-5 text-brand-ink">
            Lead Intelligence Terminal
          </div>
          <h1 className="text-[40px] font-medium leading-[1.1] tracking-tight text-ink">
            Catch the <em className="text-brand-ink not-italic font-semibold">signal</em> before the warehouse is built.
          </h1>
          <p className="text-[14px] text-ink-dim mt-6 leading-relaxed max-w-sm">
            Real-time intelligence on warehouse expansion across the GCC. Triage,
            assign, and close — from one terminal.
          </p>
        </div>

        <footer className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-line">
          <Stat label="Region" value="GCC" />
          <Stat label="Channels" value="07" />
          <Stat label="Latency" value="< 60s" />
        </footer>
      </aside>

      {/* RIGHT — sign in */}
      <main className="flex flex-col p-8 sm:p-12 lg:p-14 min-h-screen">
        {/* small mark for mobile */}
        <header className="lg:hidden flex items-center gap-3 mb-12">
          <div className="relative h-9 w-9 border border-line-strong flex items-center justify-center bg-bg">
            <span className="display-serif text-ink text-lg leading-none">Li</span>
            <span className="absolute -top-px -right-px w-1.5 h-1.5 bg-brand" />
          </div>
          <div className="leading-tight pt-0.5">
            <div className="text-[13px] font-semibold text-ink">LeadIntelligence</div>
            <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-0.5">
              BITO UAE
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="eyebrow text-brand-ink mb-3">Restricted Access</div>
            <h2 className="text-[28px] font-medium tracking-tight leading-[1.1] text-ink mb-3">
              Sign in.
            </h2>
            <p className="text-[13px] text-ink-dim mb-8 leading-relaxed">
              Reps sign in with their work email and password. Admins use the
              shared password.
            </p>

            <LoginForm next={searchParams.next} error={searchParams.error} />

            <div className="mt-10 pt-5 border-t border-line mono text-[10px] uppercase tracking-wider text-ink-faint flex items-center justify-between">
              <span>v0.1.0</span>
              <span className="flex items-center gap-1.5 text-signal-good">
                <span className="dot bg-signal-good" />
                Service online
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="display-serif text-2xl text-ink leading-none">{value}</div>
      <div className="mono text-[10px] uppercase tracking-wider text-ink-faint mt-2">
        {label}
      </div>
    </div>
  );
}
