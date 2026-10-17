import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type {
  RideOfferStatus,
  RideReportStatus,
  RideRequestStatus,
} from "@/utils/api/rides/interfaces";

export type RidePillTone = "gold" | "teal" | "rose" | "gray";

const TONE_CLASS: Record<RidePillTone, string> = {
  gold: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-200",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
  gray: "bg-lightGray/50 text-primaryGray",
};

interface RidePillProps {
  tone: RidePillTone;
  children: ReactNode;
  className?: string;
}

/** Small rounded status / tag pill in the ride palette (gold, teal, rose, gray). */
export const RidePill = ({ tone, children, className }: RidePillProps) => (
  <span
    className={cn(
      "inline-flex w-fit items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
      TONE_CLASS[tone],
      className
    )}
  >
    {children}
  </span>
);

const REQUEST_STATUS: Record<
  RideRequestStatus,
  { label: string; tone: RidePillTone }
> = {
  PENDING: { label: "Pending", tone: "gold" },
  ACCEPTED: { label: "Accepted", tone: "teal" },
  DECLINED: { label: "Declined", tone: "rose" },
  WITHDRAWN: { label: "Withdrawn", tone: "gray" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};

const OFFER_STATUS: Record<
  RideOfferStatus,
  { label: string; tone: RidePillTone }
> = {
  ACTIVE: { label: "Active", tone: "teal" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};

const REPORT_STATUS: Record<
  RideReportStatus,
  { label: string; tone: RidePillTone }
> = {
  OPEN: { label: "Open", tone: "gold" },
  RESOLVED: { label: "Resolved", tone: "teal" },
};

export const RideRequestStatusBadge = ({
  status,
}: {
  status: RideRequestStatus;
}) => {
  const pill = REQUEST_STATUS[status] ?? { label: status, tone: "gray" };
  return <RidePill tone={pill.tone}>{pill.label}</RidePill>;
};

export const RideOfferStatusBadge = ({
  status,
}: {
  status: RideOfferStatus;
}) => {
  const pill = OFFER_STATUS[status] ?? { label: status, tone: "gray" };
  return <RidePill tone={pill.tone}>{pill.label}</RidePill>;
};

export const RideReportStatusBadge = ({
  status,
}: {
  status: RideReportStatus;
}) => {
  const pill = REPORT_STATUS[status] ?? { label: status, tone: "gray" };
  return <RidePill tone={pill.tone}>{pill.label}</RidePill>;
};
