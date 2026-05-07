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
}

export function CopyButton({ value, label = "Copy", className, size = "sm" }: CopyButtonProps) {
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
