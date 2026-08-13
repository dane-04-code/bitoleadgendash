"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Loader2, Save } from "lucide-react";
import { saveConfirmedOrder } from "@/app/actions";
import type { DealSale } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * The confirmed-order record for a won lead.
 *
 * This replaced a 30-plus field discovery/tender/risk form on 2026-08-13. Reps
 * were never going to keep that current, and everything it asked for before the
 * deal closed is already covered by notes and the pipeline stage. What the
 * business actually needs from a closed deal is the commercial result, so this
 * captures that and nothing else.
 */
export function OrderProfileDialog({
  leadId,
  sale,
}: {
  leadId: string;
  sale: DealSale | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveConfirmedOrder(formData);
      if (!result.ok) {
        setError(result.error || "Could not save the order.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={sale ? "secondary" : "outline"} size="sm">
          <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={1.75} />
          {sale ? "Order details" : "Add order details"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order confirmed</DialogTitle>
          <DialogDescription>
            Record the commercial result of this sale. Order date and value are
            required; everything else is optional.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input type="hidden" name="leadId" value={leadId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Order / PO reference"
              name="orderReference"
              value={sale?.project_reference}
              placeholder="Customer PO or project number"
            />
            <Field
              label="Order date"
              name="orderDate"
              value={sale?.sale_date}
              type="date"
              required
            />
            <Field
              label="Order value"
              name="orderValue"
              value={sale?.sale_value}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
            <Field
              label="Currency"
              name="currency"
              value={sale?.currency || "AED"}
              placeholder="AED"
              maxLength={3}
            />
            <Field
              label="Gross profit"
              name="grossProfit"
              value={sale?.gross_profit}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <Field
              label="Margin (%)"
              name="profitMarginPercent"
              value={sale?.profit_margin_percent}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Auto"
              hint="Left blank, this is worked out from profit ÷ order value."
            />
          </div>

          <Field
            label="Notes"
            name="notes"
            value={sale?.notes}
            textarea
            placeholder="What was sold, delivery commitments, anything worth knowing later."
          />

          {error && (
            <p className="border-l-2 border-signal-hot bg-signal-hot/[0.06] px-3 py-2 mono text-[12px] text-signal-hot">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {pending ? "Saving…" : "Save order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  type = "text",
  textarea = false,
  hint,
  ...inputProps
}: {
  label: string;
  name: string;
  value?: string | number | null;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "defaultValue" | "type"
>) {
  const valueString = value == null ? "" : String(value);
  return (
    <label className={textarea ? "block" : "block min-w-0"}>
      <span className="eyebrow mb-2 block">{label}</span>
      {textarea ? (
        <Textarea name={name} defaultValue={valueString} rows={3} placeholder={placeholder} />
      ) : (
        <Input
          name={name}
          type={type}
          defaultValue={valueString}
          placeholder={placeholder}
          {...inputProps}
        />
      )}
      {hint && <span className="mt-1.5 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}
