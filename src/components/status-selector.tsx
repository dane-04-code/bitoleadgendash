"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";
import { updateLeadStatus } from "@/app/actions";
import { Loader2 } from "lucide-react";

export function StatusSelector({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [value, setValue] = React.useState<LeadStatus>(currentStatus);

  async function onChange(next: string) {
    const newStatus = next as LeadStatus;
    if (newStatus === value) return;
    setValue(newStatus);
    setPending(true);
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("status", newStatus);
    await updateLeadStatus(fd);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
