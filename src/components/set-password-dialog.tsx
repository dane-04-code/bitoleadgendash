"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setRepPassword, clearRepPassword } from "@/app/actions";
import { Loader2, KeyRound, Check, Copy } from "lucide-react";

interface Props {
  repId: string;
  repName: string;
  repEmail: string;
  hasPassword: boolean;
}

export function SetPasswordDialog({ repId, repName, repEmail, hasPassword }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedPassword, setSavedPassword] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  function reset() {
    setPassword("");
    setError(null);
    setSavedPassword(null);
    setCopied(false);
  }

  function generate() {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const buf = new Uint32Array(14);
    crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    setPassword(out);
    setError(null);
  }

  async function handleSubmit() {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("repId", repId);
    fd.set("password", password);
    const result = await setRepPassword(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Could not set password.");
      return;
    }
    // Hold the dialog open so the admin can copy the new password
    setSavedPassword(password);
    router.refresh();
  }

  async function handleClear() {
    setClearing(true);
    const fd = new FormData();
    fd.set("repId", repId);
    await clearRepPassword(fd);
    setClearing(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  async function copyPassword() {
    if (!savedPassword) return;
    try {
      await navigator.clipboard.writeText(savedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-3 w-3" strokeWidth={1.75} />
          {hasPassword ? "Reset password" : "Set password"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="eyebrow text-brand-ink mb-1">
            {hasPassword ? "Reset access" : "Grant access"}
          </div>
          <DialogTitle>{repName}</DialogTitle>
          <DialogDescription>
            <span className="mono text-[11px]">{repEmail}</span>
            <br />
            {savedPassword
              ? "Password set. Copy it and send it to the rep — you won't see it again."
              : hasPassword
              ? "Replace this rep's existing password with a new one."
              : "Set a password so this rep can sign in to their personal lead inbox."}
          </DialogDescription>
        </DialogHeader>

        {savedPassword ? (
          <div className="space-y-3">
            <div className="border border-line bg-surface-2 p-3 flex items-center gap-3">
              <code className="mono text-[14px] text-ink flex-1 break-all select-all">
                {savedPassword}
              </code>
              <Button variant="secondary" size="sm" onClick={copyPassword}>
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-signal-good" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mono text-[10px] uppercase tracking-wider text-ink-faint">
              Send via Telegram or in-person — never email.
            </p>
            <p className="text-[11px] text-ink-dim leading-relaxed">
              This is temporary — the rep will be asked to set their own password
              the first time they sign in.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPwd">New password</Label>
                <button
                  type="button"
                  onClick={generate}
                  className="mono text-[10px] uppercase tracking-wider text-brand-ink hover:underline"
                >
                  Generate
                </button>
              </div>
              <Input
                id="newPwd"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoFocus
              />
              <p className="mono text-[10px] uppercase tracking-wider text-ink-faint">
                Stored as a PBKDF2 hash · 100k iterations
              </p>
            </div>

            {error && (
              <div className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 text-[12px] text-signal-hot mono">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {savedPassword ? (
            <Button onClick={() => { setOpen(false); reset(); }}>
              Done
            </Button>
          ) : (
            <>
              {hasPassword && (
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  disabled={submitting || clearing}
                  className="mr-auto text-signal-hot hover:text-signal-hot"
                >
                  {clearing && <Loader2 className="h-3 w-3 animate-spin" />}
                  Revoke access
                </Button>
              )}
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? "Saving…" : "Set password"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
