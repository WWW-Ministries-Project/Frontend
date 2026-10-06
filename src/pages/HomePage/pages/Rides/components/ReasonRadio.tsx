import { cn } from "@/utils/cn";
import { selectedRow, unselectedRow } from "./rideStyles";

interface ReasonRadioProps {
  label: string;
  reasons: string[];
  value: string | null;
  /** Clicking the selected reason again clears it. */
  allowClear?: boolean;
  onChange: (value: string | null) => void;
}

/** The decline / report reason list (design: radio-button rows). */
export const ReasonRadio = ({
  label,
  reasons,
  value,
  allowClear = false,
  onChange,
}: ReasonRadioProps) => (
  <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
    {reasons.map((reason) => {
      const on = reason === value;
      return (
        <button
          key={reason}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(on && allowClear ? null : reason)}
          className={cn(
            "flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-colors",
            on ? selectedRow : unselectedRow
          )}
        >
          <span className="flex-1 text-sm font-medium text-primary">
            {reason}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border-2",
              on
                ? "border-amber-600 dark:border-amber-300"
                : "border-primaryGray/50"
            )}
          >
            {on ? (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600 dark:bg-amber-300" />
            ) : null}
          </span>
        </button>
      );
    })}
  </div>
);
