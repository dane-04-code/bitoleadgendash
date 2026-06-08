"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword } from "@/app/actions";

export function ChangePasswordForm() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const result = await changeMyPassword(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not change password.");
      return;
    }
    setSaved(true);
    formRef.current?.reset();
    router.refresh();
    setTimeout(() => setSaved(false), 2400);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Current password</Label>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new_password">
            New password{" "}
            <span className="text-ink-faint normal-case tracking-normal">
              (8+ chars)
            </span>
          </Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-line">
        <div className="min-h-[28px] flex items-center">
          {saved && (
            <span className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider text-signal-good">
              <Check className="h-3 w-3" />
              Password updated
            </span>
          )}
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          {submitting ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
