import { useEffect, useState } from "react";
import type { RideMember } from "@/utils/api/rides/interfaces";
import { RideSheet, SheetActions, SheetError } from "./RideSheet";
import {
  ChoiceChip,
} from "./rideUi";
import {
  btnPrimary,
  textareaClass,
} from "./rideClasses";

const DETAILS_MAX = 2000;

export interface ReportInput {
  reason: string;
  details?: string;
  block: boolean;
  reported_user_id?: number;
}

interface ReportSheetProps {
  open: boolean;
  reasons: string[];
  /** Drivers pick which member they're reporting when more than one asked
   *  to join; passengers always report the driver. */
  members: Pick<RideMember, "id" | "first_name">[];
  /** Name for "Also block {name} from my rides" when there's no choice. */
  defaultName?: string;
  onClose: () => void;
  /** Resolves true once the report is filed. */
  onSubmit: (input: ReportInput) => Promise<boolean>;
}

/** "Report a safety concern" — goes to the church safety team, then
 *  "Thank you for telling us". */
export const ReportSheet = ({
  open,
  reasons,
  members,
  defaultName,
  onClose,
  onSubmit,
}: ReportSheetProps) => {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [block, setBlock] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason(null);
    setDetails("");
    setBlock(false);
    setMemberId(null);
    setSent(false);
    setError(null);
  }, [open]);

  const needsMember = members.length > 1;
  const chosen = members.find((member) => member.id === memberId);
  const blockName = needsMember
    ? (chosen?.first_name ?? "this member")
    : (members[0]?.first_name ?? defaultName ?? "this member");

  const submit = async () => {
    if (needsMember && memberId === null) {
      setError("Choose who this is about.");
      return;
    }
    if (!reason) {
      setError("Choose what happened.");
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit({
      reason,
      details: details.trim() || undefined,
      block,
      reported_user_id: needsMember ? (memberId ?? undefined) : members[0]?.id,
    });
    setSubmitting(false);
    if (ok) setSent(true);
  };

  if (sent) {
    return (
      <RideSheet
        open={open}
        onClose={onClose}
        title="Thank you for telling us"
        hideHeader
      >
        <div className="flex flex-col items-center gap-3 px-2 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h2 className="text-xl font-semibold leading-7 text-primary">
            Thank you for telling us
          </h2>
          <p className="max-w-[360px] text-primaryGray">
            The safety team will contact you within 24 hours. If you’re in
            danger, call 112.
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`${btnPrimary} min-h-[44px]`}
          >
            Done
          </button>
        </div>
      </RideSheet>
    );
  }

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      locked={submitting}
      title="Report a safety concern"
      subtitle="This goes to the church safety team, never to the other member."
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel="Send report"
          submittingLabel="Sending…"
          submitting={submitting}
        />
      }
    >
      {needsMember ? (
        <div
          role="radiogroup"
          aria-label="Which member is this about?"
          className="flex flex-col gap-2"
        >
          <p className="font-medium">Which member is this about?</p>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <ChoiceChip
                key={member.id}
                on={member.id === memberId}
                onClick={() => {
                  setMemberId(member.id);
                  setError(null);
                }}
              >
                {member.first_name}
              </ChoiceChip>
            ))}
          </div>
        </div>
      ) : null}
      <div role="radiogroup" aria-label="What happened?" className="flex flex-col gap-2">
        <p className="font-medium">What happened?</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((item) => (
            <ChoiceChip
              key={item}
              on={item === reason}
              onClick={() => {
                setReason(item);
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
          Tell us more <span className="font-normal text-mainGray">(optional)</span>
        </span>
        <textarea
          value={details}
          rows={3}
          maxLength={DETAILS_MAX}
          onChange={(event) => setDetails(event.target.value)}
          className={textareaClass}
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={block}
          onChange={(event) => setBlock(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Also block {blockName} from my rides
      </label>
      <SheetError message={error} />
    </RideSheet>
  );
};
