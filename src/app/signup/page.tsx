import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AuthShell, AuthCardFooter } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  if (await isAuthenticated()) {
    redirect("/my");
  }

  return (
    <AuthShell
      mode="signup"
      chips={["Code from admin", "Work email only", "GCC coverage"]}
    >
      <div className="eyebrow text-brand-ink">New rep sign-up</div>
      <h1 className="display-serif mt-2.5 text-[30px] leading-none text-ink">
        Create your account.
      </h1>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-dim">
        Enter your details and the sign-up code from your admin. You&apos;ll be
        signed in straight away.
      </p>

      <div className="mt-5">
        <SignupForm />
      </div>

      <AuthCardFooter
        question="Already have an account?"
        linkLabel="Sign in"
        href="/login"
      />
    </AuthShell>
  );
}
