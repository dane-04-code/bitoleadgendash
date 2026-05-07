"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRep } from "@/app/actions";
import { Loader2, Plus, Check } from "lucide-react";

export function AddRepForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const result = await createRep(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not add rep.");
      return;
    }
    setSuccess(true);
    formRef.current?.reset();
    router.refresh();
    setTimeout(() => setSuccess(false), 2400);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" name="full_name" placeholder="Jane Doe" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="jane@bito.ae" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telegram_username">Telegram</Label>
          <Input id="telegram_username" name="telegram_username" placeholder="@janedoe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="territory">Territory</Label>
          <Input id="territory" name="territory" placeholder="UAE / KSA" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="speciality">Speciality</Label>
          <Input id="speciality" name="speciality" placeholder="Pallet racking, Cold storage…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="password">
            Login password{" "}
            <span className="text-ink-faint normal-case tracking-normal">
              (optional · 8+ chars)
            </span>
          </Label>
          <Input
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            placeholder="Leave blank to set later"
            minLength={8}
          />
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line">
        <div className="min-h-[28px] flex items-center">
          {success && (
            <span className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider text-signal-good">
              <Check className="h-3 w-3" />
              Rep added
            </span>
          )}
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {submitting ? "Adding…" : "Add rep"}
        </Button>
      </div>
    </form>
  );
}
