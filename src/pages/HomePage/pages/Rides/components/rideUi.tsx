import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

import {
  btnSecondary,
  sectionTitle,
  pillTone,
  type PillTone,
} from "./rideClasses";

export type { PillTone };

export const Pill = ({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex w-fit flex-none items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      pillTone[tone],
      className
    )}
  >
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

export const Avatar = ({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700",
      className
    )}
  >
    {initials}
  </span>
);

/** Green "Member" tick under a driver's name. */
export const MemberTick = () => (
  <span className="inline-flex items-center gap-1 text-xs text-green-700">
    <ShieldTick className="h-3.5 w-3.5" strokeWidth={2.5} />
    Member
  </span>
);

export const ShieldTick = ({
  className,
  strokeWidth = 2.2,
}: {
  className?: string;
  strokeWidth?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    aria-hidden="true"
    className={className}
  >
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const LockIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    className={className}
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** "2 of 3 seats taken" bar. */
export const SeatBar = ({
  taken,
  total,
  label,
}: {
  taken: number;
  total: number;
  label: string;
}) => {
  const width = total > 0 ? Math.min(100, Math.max(0, (taken / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={taken}
        aria-label={label}
      >
        <div className="h-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-primaryGray">{label}</span>
    </div>
  );
};

/** Joined search icon cell + input. */
export const SearchField = ({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) => (
  <div className={cn("flex w-full", className)}>
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-l-lg border border-r-0 border-lightGray bg-lightGray/30">
      <MagnifyingGlassIcon className="h-4 w-4 text-primaryGray" aria-hidden="true" />
    </span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="h-10 min-w-0 flex-1 rounded-r-lg border border-lightGray bg-white px-3 text-sm text-primary placeholder:text-mainGray focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
    />
  </div>
);

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** The design's TabSelection look, as a radio group (filters, sub-tabs). */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedProps<T>) => (
  <div className={cn("max-w-full overflow-x-auto", className)}>
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-nowrap gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-primary transition-colors",
              on
                ? "bg-white font-semibold shadow-sm"
                : "hover:bg-white/70"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

/** A radio chip (departure time, reason, member). */
export const ChoiceChip = ({
  on,
  onClick,
  children,
  className,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={on}
    onClick={onClick}
    className={cn(
      "min-h-[40px] rounded-lg border bg-white px-3.5 py-2 text-sm text-primary transition-colors",
      on
        ? "border-primary font-semibold shadow-sm"
        : "border-lightGray hover:bg-lightGray/20",
      className
    )}
  >
    {children}
  </button>
);

export const Switch = ({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
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
    className={cn(
      "flex h-6 w-11 flex-none rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "justify-end bg-primary" : "justify-start bg-lightGray"
    )}
  >
    <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
  </button>
);

/** Info banner: "You're driving to Midweek Service on Wednesday." + View my ride. */
export const NoticeBanner = ({
  title,
  description,
  action,
  tone = "info",
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: PillTone;
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3",
      pillTone[tone]
    )}
  >
    <div className="flex min-w-0 flex-col">
      <p className="font-semibold">{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
    {action}
  </div>
);

/** Dashed empty state with a title, a line and optional actions. */
export const DashedEmpty = ({
  title,
  description,
  children,
  large = false,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  large?: boolean;
}) => (
  <div
    className={cn(
      "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lightGray px-4 text-center",
      large ? "py-10" : "py-8"
    )}
  >
    <p
      className={cn(
        "font-semibold text-primary",
        large ? "text-xl leading-7" : "text-base"
      )}
    >
      {title}
    </p>
    {description ? (
      <p className="max-w-[380px] text-sm text-primaryGray">{description}</p>
    ) : null}
    {children}
  </div>
);

export interface TimelineStop {
  key: string | number;
  time: string;
  label: string;
  sub?: string;
  /** primary = a stop, here = the rider gets on, muted = another stop,
   *  church = the destination. */
  dot: "primary" | "here" | "muted" | "church";
  weight?: "normal" | "medium" | "semibold";
  subTone?: "muted" | "success";
}

const DOT: Record<TimelineStop["dot"], string> = {
  primary: "bg-primary",
  here: "bg-green-700",
  muted: "bg-lightGray",
  church: "bg-secondary",
};

/** Vertical route: time, landmark, and who gets on there. */
export const RouteTimeline = ({ stops }: { stops: TimelineStop[] }) => (
  <ol className="ml-1.5 flex flex-col border-l-2 border-gray-200">
    {stops.map((stop) => (
      <li key={stop.key} className="relative flex gap-3 pb-4 pl-5 last:pb-0">
        <span
          aria-hidden="true"
          className={cn(
            "absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white",
            DOT[stop.dot]
          )}
        />
        <span className="w-[72px] flex-none text-sm font-semibold text-primary">
          {stop.time}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "text-sm text-primary",
              stop.weight === "normal"
                ? "font-normal"
                : stop.weight === "semibold"
                  ? "font-semibold"
                  : "font-medium"
            )}
          >
            {stop.label}
          </span>
          {stop.sub ? (
            <span
              className={cn(
                "text-xs",
                stop.subTone === "success"
                  ? "text-green-700"
                  : "text-mainGray"
              )}
            >
              {stop.sub}
            </span>
          ) : null}
        </span>
      </li>
    ))}
  </ol>
);

const SAFETY_RULES: Array<[string, string]> = [
  ["Members only", "Only approved church members can offer or ask for rides."],
  [
    "Areas, never addresses",
    "You share a neighbourhood or landmark, not where you live.",
  ],
  [
    "Details after acceptance",
    "Phone and car details unlock only once the driver accepts.",
  ],
  [
    "Report or block anytime",
    "Every ride has a direct line to the church safety team.",
  ],
];

export const SafetyCard = () => (
  <section
    aria-labelledby="ride-safety"
    className="flex flex-col gap-3 rounded-xl border border-lightGray bg-inputBackground p-4"
  >
    <h2 id="ride-safety" className={sectionTitle}>
      How it stays safe
    </h2>
    <ul className="flex flex-col gap-3">
      {SAFETY_RULES.map(([title, body]) => (
        <li key={title} className="flex items-start gap-3">
          <ShieldTick className="mt-px h-[18px] w-[18px] flex-none text-green-700" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-primary">{title}</span>
            <span className="text-xs text-primaryGray">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  </section>
);

/** Pulsing placeholder blocks while something loads. */
export const RideSkeleton = ({
  rows = 3,
  className = "h-28",
}: {
  rows?: number;
  className?: string;
}) => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className={cn(
          "animate-pulse rounded-2xl border border-lightGray bg-lightGray/20",
          className
        )}
      />
    ))}
  </div>
);

/** A load that failed, with a retry. */
export const LoadError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div
    role="alert"
    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    <span>{message}</span>
    <button type="button" onClick={onRetry} className={btnSecondary}>
      Try again
    </button>
  </div>
);
