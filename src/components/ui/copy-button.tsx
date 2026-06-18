"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  /** Render just the copy icon (no label) — for inline use next to fields. */
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  size = "sm",
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : label}
        title={copied ? "Copied" : label}
        className={cn(
          "inline-flex items-center text-ink-faint hover:text-brand-ink transition-colors",
          className
        )}
      >
        {copied ? (
          <Check className="h-3 w-3 text-signal-good" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn("text-ink-dim hover:text-ink", className)}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-signal-good" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="mono uppercase tracking-wider text-[10px]">
        {copied ? "Copied" : label}
      </span>
    </Button>
  );
}
