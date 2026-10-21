import { useEffect, useState } from "react";
import type { DeclineRequestDto } from "@/utils/api/rides/interfaces";
import { RideSheet, SheetActions, SheetError } from "./RideSheet";
import {
  ChoiceChip,
} from "./rideUi";
import {
  textareaClass,
} from "./rideClasses";

const MESSAGE_MAX = 200;

interface DeclineSheetProps {
  /** The passenger being declined; null closes the sheet. */
  firstName: string | null;
  reasons: string[];
  submitting: boolean;
  onClose: () => void;
  onDecline: (payload: DeclineRequestDto) => void;
}

/** "Decline {first}?" — a preset reason and/or a short message. */
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason(null);
      setMessage("");
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const trimmed = message.trim();
    // The backend needs one of the two, so the passenger learns why.
    if (!reason && !trimmed) {
      setError("Choose a reason or add a message.");
      return;
    }
    onDecline({ reason: reason ?? undefined, message: trimmed || undefined });
  };

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      locked={submitting}
      title={`Decline ${firstName ?? ""}?`}
      subtitle="They’ll be told so they can find another ride."
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel="Decline request"
          submittingLabel="Declining…"
          submitting={submitting}
          danger
        />
      }
    >
      <div role="radiogroup" aria-label="Reason" className="flex flex-col gap-2">
        <p className="font-medium">Reason</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((item) => (
            <ChoiceChip
              key={item}
              on={item === reason}
              onClick={() => {
                setReason(item === reason ? null : item);
                setError(null);
              }}
            >
              {item}
            </ChoiceChip>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 font-medium">
        <span>
          Message <span className="font-normal text-mainGray">(optional)</span>
        </span>
        <textarea
          value={message}
          rows={3}
          maxLength={MESSAGE_MAX}
          onChange={(event) => {
            setMessage(event.target.value);
            setError(null);
          }}
          placeholder="e.g. Sorry, I’m picking up family this week."
          className={textareaClass}
        />
      </label>
      <SheetError message={error} />
    </RideSheet>
  );
};
