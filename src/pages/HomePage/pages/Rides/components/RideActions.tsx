import {
  ChatBubbleLeftIcon,
  FlagIcon,
  PhoneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { phoneUrl } from "../utils/rideHelpers";
import { coralButton, quietButton, rideCard } from "./rideStyles";

export interface MessageTarget {
  id: number;
  name: string;
  phone: string;
}

interface RideActionsProps {
  /** Members whose number has unlocked (accepted rides only). */
  messageTargets: MessageTarget[];
  cancelVerb: string;
  cancelQuestion: string;
  cancelling: boolean;
  onCancel: () => void;
  onReport: () => void;
}

/** Message, Cancel (with an inline confirm) and Report a safety concern.
 *  The web has no ride inbox, so Message opens the phone's SMS app with the
 *  number the backend unlocked. */
export const RideActions = ({
  messageTargets,
  cancelVerb,
  cancelQuestion,
  cancelling,
  onCancel,
  onReport,
}: RideActionsProps) => {
  const [confirming, setConfirming] = useState(false);
  const [messageListOpen, setMessageListOpen] = useState(false);
  const single = messageTargets.length === 1 ? messageTargets[0] : null;

  return (
    <div className="flex flex-col gap-3.5">
      {confirming ? (
        <div
          role="alertdialog"
          aria-label={cancelVerb}
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3.5 dark:border-rose-400/30 dark:bg-rose-400/10"
        >
          <p className="text-sm font-semibold text-primary">{cancelQuestion}</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={cancelling}
              className={quietButton}
            >
              Keep ride
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className={coralButton}
            >
              {cancelling ? "Cancelling…" : cancelVerb}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2.5">
          {single ? (
            <a href={phoneUrl("sms", single.phone)} className={quietButton}>
              <ChatBubbleLeftIcon className="h-5 w-5" aria-hidden="true" />
              Message
            </a>
          ) : messageTargets.length > 1 ? (
            <button
              type="button"
              aria-expanded={messageListOpen}
              onClick={() => setMessageListOpen((open) => !open)}
              className={quietButton}
            >
              <ChatBubbleLeftIcon className="h-5 w-5" aria-hidden="true" />
              Message
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setMessageListOpen(false);
              setConfirming(true);
            }}
            className={cn(quietButton, "text-rose-700 dark:text-rose-300")}
          >
            <XCircleIcon className="h-5 w-5" aria-hidden="true" />
            {cancelVerb}
          </button>
        </div>
      )}

      {messageListOpen && !confirming && messageTargets.length > 1 ? (
        <ul className={cn(rideCard, "divide-y divide-lightGray")}>
          {messageTargets.map((target) => (
            <li key={target.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                {target.name}
              </span>
              <a
                href={phoneUrl("sms", target.phone)}
                aria-label={`Message ${target.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-lightGray/30"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
              </a>
              <a
                href={phoneUrl("tel", target.phone)}
                aria-label={`Call ${target.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-lightGray/30"
              >
                <PhoneIcon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={onReport}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 text-sm font-semibold text-primaryGray underline underline-offset-4 hover:text-primary"
      >
        <FlagIcon className="h-4 w-4" aria-hidden="true" />
        Report a safety concern
      </button>
    </div>
  );
};
