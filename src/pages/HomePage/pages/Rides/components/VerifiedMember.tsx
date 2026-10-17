import { CheckCircleIcon } from "@heroicons/react/24/solid";

/** Every ride member is an approved church member — the backend enforces it. */
export const VerifiedMember = () => (
  <span className="flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-300">
    <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
    Verified church member
  </span>
);
