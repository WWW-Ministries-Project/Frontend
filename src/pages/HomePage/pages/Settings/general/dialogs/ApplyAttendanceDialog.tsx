import { useEffect, useMemo, useState } from "react";

import { CommDialog } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import { Field, SelectInput } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { cn } from "@/utils/cn";

import { recentMonths } from "../generalModel";
import type { AttendanceApply } from "../useRulesDraft";

type Mode = "new" | "past";

const MODES: { key: Mode; label: string; description: string }[] = [
  { key: "new", label: "Only new attendance", description: "Past records keep their current status." },
  {
    key: "past",
    label: "Also reclassify past attendance",
    description: "Records from the month below onwards are recalculated.",
  },
];

/** Asked before saving changed attendance timing. */
export const ApplyAttendanceDialog = ({
  open,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (apply: AttendanceApply, monthLabel: string) => void;
}) => {
  const months = useMemo(() => recentMonths(), []);
  const [mode, setMode] = useState<Mode>("new");
  const [from, setFrom] = useState(months[0].value);

  useEffect(() => {
    if (open) {
      setMode("new");
      setFrom(months[0].value);
    }
  }, [open, months]);

  const submit = () => {
    const label = months.find((month) => month.value === from)?.label ?? from;
    onConfirm(mode === "past" ? { applyToExisting: true, applyFrom: from } : { applyToExisting: false }, label);
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      title="Apply to past attendance?"
      subtitle="Should the new timing rules also reclassify attendance that’s already recorded?"
      busy={busy}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Save rules", tone: "primary", onClick: submit },
      ]}
    >
      <div role="radiogroup" aria-label="Apply to" className="flex flex-col gap-2">
        {MODES.map((option) => {
          const on = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(option.key)}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border bg-white px-4 py-3 text-left text-primary",
                on ? "border-primary shadow-[0_0_0_1px_#080D2D]" : "border-lightGray"
              )}
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs text-[#4B5563]">{option.description}</span>
            </button>
          );
        })}
      </div>
      {mode === "past" && (
        <Field label="Reclassify from">
          <SelectInput value={from} options={months} onChange={(event) => setFrom(event.target.value)} />
        </Field>
      )}
    </CommDialog>
  );
};
