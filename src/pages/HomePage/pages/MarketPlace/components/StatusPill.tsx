import { cn } from "@/utils/cn";
import { TONE_CLASSES, type StatusInfo } from "../utils/marketplaceModel";

interface IProps {
  status: StatusInfo;
  className?: string;
}

/** Status pill using the design-system tone sets (12px, 600, full radius). */
export const StatusPill = ({ status, className }: IProps) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      TONE_CLASSES[status.tone],
      className
    )}
  >
    {status.label}
  </span>
);
