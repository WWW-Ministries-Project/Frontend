import { cn } from "@/utils/cn";
import type { RideTone } from "../utils/rideHelpers";
import { toneText, toneTint } from "./rideStyles";

interface RideStatusPillProps {
  label: string;
  tone: RideTone | "neutral";
  className?: string;
}

/** "Pending" / "Confirmed" / "Declined" / "Published" / "N seats left". */
export const RideStatusPill = ({
  label,
  tone,
  className,
}: RideStatusPillProps) => (
  <span
    className={cn(
      "inline-flex flex-none items-center rounded-full px-2.5 py-1 text-xs font-bold",
      tone === "neutral"
        ? "bg-lightGray/40 text-primaryGray"
        : `${toneTint[tone]} ${toneText[tone]}`,
      className
    )}
  >
    {label}
  </span>
);
