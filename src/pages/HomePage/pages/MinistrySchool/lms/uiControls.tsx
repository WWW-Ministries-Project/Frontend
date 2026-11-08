/** SoM form controls — matched to the design prototype, theme-aware. */
import { cn } from "@/utils/cn";
import { ReactNode } from "react";

/** Toggle switch (40×22 track, 16px knob). */
export const Toggle = ({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-primary" : "bg-gray-300"
    )}
  >
    <span
      className={cn(
        "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-[21px]" : "translate-x-[3px]"
      )}
    />
  </button>
);

/** Labeled toggle row (label/description left, switch right). */
export const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
  disabled,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-between gap-4", className)}>
    <div className="min-w-0">
      <p className="text-sm font-medium text-primary">{title}</p>
      {description && <p className="text-xs text-mainGray">{description}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} />
  </div>
);

/** Custom checkbox (16px, navy when checked). */
export const Checkbox = ({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  className?: string;
}) => (
  <label className={cn("inline-flex items-center gap-2 text-sm text-primary", disabled && "opacity-50", className)}>
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "inline-flex size-[18px] flex-shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
        checked ? "border-primary bg-primary text-white" : "border-gray-300 bg-white",
        disabled && "cursor-not-allowed"
      )}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12 5 5L20 6" />
        </svg>
      )}
    </span>
    {label}
  </label>
);

export type ChipOption<T extends string = string> = { value: T; label: ReactNode; count?: number };

/** Pill filter chips (single-select). */
export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[13px] font-medium transition-colors",
              on
                ? "border-primary bg-primary text-white"
                : "border-lightGray bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn("text-xs", on ? "text-white/80" : "text-mainGray")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Range slider (weights, pass mark) with navy accent. */
export const RangeSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  label,
  suffix = "%",
  id,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: ReactNode;
  suffix?: string;
  id?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    {label != null && (
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-primary">
          {value}
          {suffix}
        </span>
      </div>
    )}
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary"
    />
  </div>
);

/** Compact search input. */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <div className={cn("relative", className)}>
    <svg
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mainGray"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-[rgba(107,114,128,0.35)] bg-white pl-9 pr-3 text-sm text-primary placeholder:text-mainGray focus:border-primary focus:outline-none"
    />
  </div>
);
