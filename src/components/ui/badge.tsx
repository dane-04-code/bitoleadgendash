import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors mono",
  {
    variants: {
      variant: {
        default: "border-line text-ink-2 bg-transparent",
        outline: "border-line-strong text-ink-2 bg-transparent",
        hot: "border-signal-hot/40 text-signal-hot bg-signal-hot/[0.07]",
        warm: "border-signal-warm/40 text-signal-warm bg-signal-warm/[0.07]",
        cold: "border-signal-cold/40 text-signal-cold bg-signal-cold/[0.07]",
        success: "border-signal-good/40 text-signal-good bg-signal-good/[0.07]",
        muted: "border-line text-ink-faint bg-transparent",
        accent: "border-brand/45 text-brand-ink bg-brand/[0.06]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
