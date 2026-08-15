import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AuthShell, AuthCardFooter } from "@/components/auth-shell";
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
    <AuthShell
      mode="signin"
      next={searchParams.next}
      chips={["07 channels live", "GCC coverage", "SSO soon"]}
    >
      <div className="eyebrow text-brand-ink">Rep access</div>
      <h1 className="display-serif mt-2.5 text-[30px] leading-none text-ink">
        Sign in.
      </h1>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-dim">
        Reps sign in with their work email and password.
      </p>

      <div className="mt-5">
        <LoginForm next={searchParams.next} error={searchParams.error} />
      </div>

      <AuthCardFooter
        question="New rep?"
        linkLabel="Create your account"
        href="/signup"
      />
    </AuthShell>
  );
}
