import { cn } from "@/utils/cn";
import { phoneUrl } from "../utils/rideHelpers";

/** A tel: link for a member's number, or a muted "No phone on file". */
export const PhoneLink = ({
  phone,
  className,
}: {
  phone: string | null | undefined;
  className?: string;
}) =>
  phone ? (
    <a
      href={phoneUrl("tel", phone)}
      className={cn(
        "whitespace-nowrap text-xs text-primaryGray underline-offset-2 hover:text-primary hover:underline",
        className
      )}
    >
      {phone}
    </a>
  ) : (
    <span className={cn("text-xs text-mainGray", className)}>
      No phone on file
    </span>
  );
