"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode tabs */}
      <div
        role="tablist"
        aria-label="Sign in as"
        className="inline-flex border border-line bg-surface-2 p-0.5 rounded-sm"
      >
        <ModeTab
          active={mode === "rep"}
          onClick={() => {
            setMode("rep");
            setErrMsg(null);
          }}
        >
          Sales rep
        </ModeTab>
        <ModeTab
          active={mode === "admin"}
          onClick={() => {
            setMode("admin");
            setErrMsg(null);
          }}
        >
          Admin
        </ModeTab>
      </div>

      {mode === "rep" && (
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@bito.ae"
            className="h-11 text-[14px]"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">
          {mode === "admin" ? "Admin password" : "Password"}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus={mode === "admin"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 text-[14px]"
        />
      </div>

      {errMsg && (
        <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
          {errMsg}
        </div>
      )}

      <Button type="submit" className="w-full h-11" disabled={submitting}>
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

      <p className="mono text-[10px] uppercase tracking-wider text-ink-faint text-center">
        {mode === "rep"
          ? "Reps · sign in with your work email"
          : "Admin · single shared password"}
      </p>
    </form>
  );
}

function ModeTab({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-sm transition-colors ${
        active
          ? "bg-ink text-bg"
          : "text-ink-dim hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
