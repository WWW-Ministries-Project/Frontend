import { PhoneIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/Skeleton";
import { cn } from "@/utils/cn";
import { phoneUrl } from "../utils/rideHelpers";

/** Shared input look for the ride admin filters and modals. */
export const inputClass =
  "h-10 w-full rounded-lg border border-lightGray bg-white px-3 text-sm text-primary placeholder:text-primaryGray/70 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass =
  "min-h-[96px] w-full rounded-lg border border-lightGray bg-white px-3 py-2 text-sm text-primary placeholder:text-primaryGray/70 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const outlineButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-lightGray bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-lightGray/40 disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/40 dark:text-rose-200 dark:hover:bg-rose-400/10";

/** "6 Oct 2026, 09:14" for an ISO timestamp; empty when unparseable. */
export const formatWhen = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/** "6 Oct 2026" for an ISO timestamp; empty when unparseable. */
export const formatDay = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

/** A tel: link for a member's number, or a muted "No phone" note. */
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
        "inline-flex items-center gap-1 whitespace-nowrap text-sm text-primary underline-offset-2 hover:underline",
        className
      )}
    >
      <PhoneIcon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
      {phone}
    </a>
  ) : (
    <span className={cn("text-xs text-primaryGray", className)}>
      No phone on file
    </span>
  );

/** Inline load failure with a retry button. */
export const PanelError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div
    role="alert"
    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error"
  >
    <span>{message}</span>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-lg border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10"
    >
      Try again
    </button>
  </div>
);

/** Pulsing placeholder rows while a panel loads. */
export const PanelSkeleton = ({
  rows = 3,
  rowClassName = "h-24",
}: {
  rows?: number;
  rowClassName?: string;
}) => (
  <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading…</span>
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} className={cn("w-full rounded-2xl", rowClassName)} />
    ))}
  </div>
);

interface FilterChipsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

/** Pill-style single-choice filter, as in the Community moderation queue. */
export const FilterChips = <T extends string>({
  value,
  options,
  onChange,
  label,
}: FilterChipsProps<T>) => (
  <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          "rounded-full border px-4 py-1.5 text-sm",
          value === option.value
            ? "border-primary bg-primary/10 font-semibold text-primary"
            : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/40"
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/** Accessible on/off switch for table rows. */
export const ActiveSwitch = ({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  /** What the switch controls, for screen readers, e.g. "Accra Mall active". */
  label: string;
  onChange: (next: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation();
      onChange(!checked);
    }}
    className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span
      className={cn(
        "relative inline-flex h-6 w-11 flex-none rounded-full transition-colors",
        checked ? "bg-primary" : "bg-lightGray"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full border border-lightGray bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </span>
    <span className="text-sm text-primaryGray">
      {checked ? "Active" : "Hidden"}
    </span>
  </button>
);
