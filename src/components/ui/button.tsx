import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[13px] font-medium transition-[background,color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white hover:bg-brand-ink border border-brand",
        secondary:
          "bg-surface-2 text-ink hover:bg-surface-3 border border-line",
        ghost:
          "text-ink-dim hover:text-ink hover:bg-surface-2 border border-transparent",
        outline:
          "border border-line text-ink-2 hover:text-ink hover:border-line-strong bg-transparent",
        destructive:
          "bg-signal-hot/10 text-signal-hot border border-signal-hot/30 hover:bg-signal-hot/20",
        link: "text-brand-ink underline-offset-4 hover:underline border border-transparent",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-7 px-2.5 text-[12px]",
        lg: "h-11 px-5 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
