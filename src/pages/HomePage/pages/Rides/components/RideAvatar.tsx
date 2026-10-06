import { cn } from "@/utils/cn";

/** The design's four avatar gradients (teal, lilac, gold, sky). */
const GRADIENTS = [
  "from-[#2E6F67] to-[#4DD8C5]",
  "from-[#4B3F9E] to-[#A99CFF]",
  "from-[#9A5D1A] to-[#F0BD5C]",
  "from-[#2C4F8F] to-[#7BAEFA]",
] as const;

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
} as const;

interface RideAvatarProps {
  /** Member id — picks the same gradient for the same member every time. */
  id: number;
  initials: string;
  size?: keyof typeof SIZES;
}

export const RideAvatar = ({ id, initials, size = "md" }: RideAvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex flex-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-[#0E1330]",
      GRADIENTS[Math.abs(id) % GRADIENTS.length],
      SIZES[size]
    )}
  >
    {initials}
  </span>
);
