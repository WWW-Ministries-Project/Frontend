import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import type { CommunityReportReason } from "@/utils/api/community/interfaces";
import { REPORT_REASONS } from "../utils/communityConstants";
import { CommunitySheet } from "./CommunitySheet";
import {
  sheetPrimaryButton,
  sheetSecondaryButton,
} from "../utils/communityStyles";

interface ReportModalProps {
  open: boolean;
  noun: "post" | "comment";
  submitting: boolean;
  /** Flips the sheet into the "Thanks for letting us know" state. */
  submitted: boolean;
  onSubmit: (reason: CommunityReportReason, details: string) => void;
  onClose: () => void;
}

export const ReportModal = ({
  open,
  noun,
  submitting,
  submitted,
  onSubmit,
  onClose,
}: ReportModalProps) => {
  const [reason, setReason] = useState<CommunityReportReason | null>(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (open) {
      setReason(null);
      setDetails("");
    }
  }, [open]);

  if (submitted) {
    return (
      <CommunitySheet
        open={open}
        onClose={onClose}
        title="Thanks for letting us know"
        footer={
          <button type="button" className={sheetPrimaryButton} onClick={onClose}>
            Done
          </button>
        }
      >
        <p className="text-sm text-primaryGray">
          A church moderator will review it within 24 hours. We&apos;ve hidden
          it from your feed in the meantime.
        </p>
      </CommunitySheet>
    );
  }

  return (
    <CommunitySheet
      open={open}
      onClose={onClose}
      title={`Report this ${noun}`}
      subtitle="Reports are confidential. The author won't know who reported it."
      footer={
        <>
          <button
            type="button"
            className={sheetSecondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={sheetPrimaryButton}
            disabled={!reason || submitting}
            onClick={() => reason && onSubmit(reason, details.trim())}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Reason</legend>
        {REPORT_REASONS.map((option) => {
          const selected = reason === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                selected
                  ? "border-amber-300 bg-amber-50 font-medium text-primary"
                  : "border-lightGray bg-white text-primary hover:bg-lightGray/30"
              )}
            >
              <input
                type="radio"
                name="community-report-reason"
                value={option.value}
                checked={selected}
                onChange={() => setReason(option.value)}
                className="h-4 w-4 accent-amber-600"
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>
      {reason ? (
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-primary">
            Anything else moderators should know? (optional)
          </span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-lightGray bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none"
          />
        </label>
      ) : null}
    </CommunitySheet>
  );
};
