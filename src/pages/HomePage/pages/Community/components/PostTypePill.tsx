import { cn } from "@/utils/cn";
import type { CommunityPostType } from "@/utils/api/community/interfaces";
import { POST_TYPES } from "../utils/communityConstants";

export const PostTypePill = ({
  type,
  className,
}: {
  type: CommunityPostType;
  className?: string;
}) => {
  const meta = POST_TYPES[type] ?? POST_TYPES.GENERAL;
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        meta.pillClass,
        className
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.short}
    </span>
  );
};
