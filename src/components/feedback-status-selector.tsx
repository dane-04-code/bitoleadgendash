"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  type FeedbackStatus,
} from "@/lib/supabase/types";
import { updateFeedbackStatus } from "@/app/actions";

export function FeedbackStatusSelector({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: FeedbackStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [value, setValue] = React.useState<FeedbackStatus>(currentStatus);

  async function onChange(next: string) {
    const status = next as FeedbackStatus;
    if (status === value) return;
    setValue(status);
    setPending(true);
    await updateFeedbackStatus(id, status);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FEEDBACK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {FEEDBACK_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
