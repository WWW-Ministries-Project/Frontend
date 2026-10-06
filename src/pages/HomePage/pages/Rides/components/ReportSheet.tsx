import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { RideMember } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { ReasonRadio } from "./ReasonRadio";
import { RideSheet } from "./RideSheet";
import { goldCta, quietButton, textInput } from "./rideStyles";

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
   *  to join; passengers always report the driver, so this is empty. */
  members: Pick<RideMember, "id" | "first_name">[];
  onClose: () => void;
  /** Resolves true once the report is filed. */
  onSubmit: (input: ReportInput) => Promise<boolean>;
}

/** "Report a safety concern" — goes to the church safety team. */
export const ReportSheet = ({
  open,
  reasons,
  members,
  onClose,
  onSubmit,
}: ReportSheetProps) => {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [block, setBlock] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(null);
    setDetails("");
    setBlock(false);
    setMemberId(null);
    setSent(false);
  }, [open]);

  const needsMember = members.length > 1;
  const ready = Boolean(reason) && (!needsMember || memberId !== null);

  const submit = async () => {
    if (!reason || !ready) return;
    setSubmitting(true);
    const ok = await onSubmit({
      reason,
      details: details.trim() || undefined,
      block,
      reported_user_id: needsMember
        ? (memberId ?? undefined)
        : members[0]?.id,
    });
    setSubmitting(false);
    if (ok) setSent(true);
  };

  if (sent) {
    return (
      <RideSheet open={open} onClose={onClose} title="Thank you for telling us" hideHeader>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300">
            <ShieldCheckIcon className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold text-primary">
            Thank you for telling us
          </h2>
          <p className="max-w-xs text-sm text-primaryGray">
            The safety team will contact you within 24 hours. If you're in
            danger, call 112.
          </p>
          <button
            type="button"
            onClick={onClose}
            className={cn(quietButton, "mt-2 w-full flex-none")}
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
      title="Report a safety concern"
      subtitle="This goes to the church safety team, never to the other member."
      footer={
        <button
          type="button"
          disabled={!ready || submitting}
          onClick={submit}
          className={goldCta}
        >
          {submitting ? "Sending…" : "Send report"}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {needsMember ? (
          <div
            role="radiogroup"
            aria-label="Which member is this about?"
            className="flex flex-col gap-2"
          >
            <p className="text-sm font-medium text-primary">
              Which member is this about?
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const on = member.id === memberId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMemberId(member.id)}
                    className={cn(
                      "min-h-[40px] rounded-xl border px-3.5 text-sm transition-colors",
                      on
                        ? "border-amber-300 bg-amber-50 font-bold text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300"
                        : "border-lightGray bg-lightGray/10 font-medium text-primary hover:bg-lightGray/30"
                    )}
                  >
                    {member.first_name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <ReasonRadio
          label="What happened"
          reasons={reasons}
          value={reason}
          onChange={setReason}
        />
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Tell us more (optional)"
          aria-label="Tell us more (optional)"
          rows={3}
          maxLength={2000}
          className={cn(textInput, "resize-none")}
        />
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={block}
            onChange={(event) => setBlock(event.target.checked)}
            className="h-5 w-5 flex-none rounded border-primaryGray/60 text-amber-600 focus:ring-amber-400"
          />
          <span className="text-sm font-medium text-primary">
            Also block this member from my rides
          </span>
        </label>
      </div>
    </RideSheet>
  );
};
