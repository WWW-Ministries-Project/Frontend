import { useEffect, useState } from "react";
import type { DeclineRequestDto } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { ReasonRadio } from "./ReasonRadio";
import { RideSheet } from "./RideSheet";
import { textInput } from "./rideStyles";

interface DeclineSheetProps {
  /** The passenger being declined; null closes the sheet. */
  firstName: string | null;
  reasons: string[];
  submitting: boolean;
  onClose: () => void;
  onDecline: (payload: DeclineRequestDto) => void;
}

/** "Decline {first}'s request" — a preset reason and/or a short note. */
export const DeclineSheet = ({
  firstName,
  reasons,
  submitting,
  onClose,
  onDecline,
}: DeclineSheetProps) => {
  const open = firstName !== null;
  const [reason, setReason] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setReason(null);
      setMessage("");
    }
  }, [open]);

  const ready = Boolean(reason || message.trim());

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      title={`Decline ${firstName ?? ""}'s request`}
      subtitle={`${firstName ?? ""} will see your reason, so they can find another ride.`}
      footer={
        <button
          type="button"
          disabled={!ready || submitting}
          onClick={() =>
            onDecline({
              reason: reason ?? undefined,
              message: message.trim() || undefined,
            })
          }
          className={cn(
            "inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-base font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45",
            "dark:border-rose-400/35 dark:bg-rose-400/15 dark:text-rose-300 dark:hover:bg-rose-400/25"
          )}
        >
          {submitting ? "Declining…" : "Decline request"}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <ReasonRadio
          label="Reason"
          reasons={reasons}
          value={reason}
          allowClear
          onChange={setReason}
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add a message (optional)"
          aria-label="Add a message (optional)"
          rows={2}
          maxLength={500}
          className={cn(textInput, "resize-none")}
        />
      </div>
    </RideSheet>
  );
};
