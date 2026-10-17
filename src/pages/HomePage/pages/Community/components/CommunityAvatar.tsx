import { EyeSlashIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";
import type { CommunityPerson } from "@/utils/api/community/interfaces";
import { initialsOf } from "../utils/communityHelpers";

interface CommunityAvatarProps {
  person?: Pick<CommunityPerson, "name" | "initials" | "avatarUrl"> | null;
  anonymous?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
};

/** Member avatar. Anonymous authors get a dashed ring with an eye-off icon,
 *  never initials, so nothing about them leaks into the UI. */
export const CommunityAvatar = ({
  person,
  anonymous,
  size = "md",
  className,
}: CommunityAvatarProps) => {
  if (anonymous || !person) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex flex-none items-center justify-center rounded-full border border-dashed border-primaryGray/60 text-primaryGray",
          SIZE_CLASS[size],
          className
        )}
      >
        <EyeSlashIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </span>
    );
  }

  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        className={cn(
          "flex-none rounded-full object-cover",
          SIZE_CLASS[size],
          className
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-amber-500 font-bold text-white",
        SIZE_CLASS[size],
        className
      )}
    >
      {person.initials || initialsOf(person.name)}
    </span>
  );
};
