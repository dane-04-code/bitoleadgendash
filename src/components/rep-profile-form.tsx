"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyProfile } from "@/app/actions";

export function RepProfileForm({
  fullName,
  email,
  telegramUsername,
  speciality,
  territory,
}: {
  fullName: string;
  email: string;
  telegramUsername: string | null;
  speciality: string | null;
  territory: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const result = await updateMyProfile(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not save profile.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2400);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Full name</Label>
          <Input value={fullName} disabled />
          <p className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            Locked · ask admin to change
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Email</Label>
          <Input value={email} disabled />
          <p className="mono text-[10px] uppercase tracking-wider text-ink-faint">
            Locked · this is your sign-in
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telegram_username">Telegram</Label>
          <Input
            id="telegram_username"
            name="telegram_username"
            placeholder="@yourhandle"
            defaultValue={telegramUsername ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="territory">Territory</Label>
          <Input
            id="territory"
            name="territory"
            placeholder="UAE / KSA"
            defaultValue={territory ?? ""}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="speciality">Speciality</Label>
          <Input
            id="speciality"
            name="speciality"
            placeholder="Pallet racking, cold storage…"
            defaultValue={speciality ?? ""}
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
              Saved
            </span>
          )}
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {submitting ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
