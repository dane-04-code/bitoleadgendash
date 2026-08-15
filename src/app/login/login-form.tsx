"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "rep" | "admin";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("rep");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(
    error === "invalid" ? "Incorrect credentials. Please try again." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          email: mode === "rep" ? email : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrMsg(data?.error || "Login failed.");
        setSubmitting(false);
        return;
      }
      const fallback = data?.role === "rep" ? "/my" : "/dashboard";
      router.replace(next || fallback);
      router.refresh();
    } catch {
      setErrMsg("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <span className="eyebrow" id="role-label">
          Role
        </span>
        <div
          role="radiogroup"
          aria-labelledby="role-label"
          className="grid grid-cols-2 gap-2"
        >
          <RoleOption
            active={mode === "rep"}
            onClick={() => {
              setMode("rep");
              setErrMsg(null);
            }}
          >
            Sales rep
          </RoleOption>
          <RoleOption
            active={mode === "admin"}
            onClick={() => {
              setMode("admin");
              setErrMsg(null);
            }}
          >
            Admin
          </RoleOption>
        </div>
      </div>

      {/* Admins authenticate on a single shared password, so the email field is
          not merely hidden — it is absent, and unset in the request body. */}
      {mode === "rep" && (
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@bito.ae"
            className="h-11 rounded-md px-3.5 text-[13.5px]"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {mode === "admin" ? "Admin password" : "Password"}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 rounded-md px-3.5 text-[13.5px]"
        />
      </div>

      {errMsg && (
        <p
          role="alert"
          className="rounded-md bg-signal-hot/[0.08] px-3 py-2 text-[12px] text-signal-hot"
        >
          {errMsg}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Authenticating
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

function RoleOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "mono h-10 rounded-md text-[10.5px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "bg-brand-ink text-white"
          : "bg-surface-2 text-ink-dim hover:bg-surface-3 hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
