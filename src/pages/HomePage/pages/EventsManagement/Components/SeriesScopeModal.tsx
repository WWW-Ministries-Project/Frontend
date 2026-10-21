import React, { useState } from "react";

import { cn } from "@/utils/cn";

import { DialogShell } from "./eventsUi";

export type SeriesScope = "this" | "following" | "all";

export interface SeriesScopeModalProps {
  /** "edit" or "delete" — changes wording */
  action: "edit" | "delete";
  eventName?: string;
  onConfirm: (scope: SeriesScope) => void;
  onCancel: () => void;
  /** Keeps the dialog open with a spinner while the change runs. */
  loading?: boolean;
}

const SCOPE_OPTIONS: { value: SeriesScope; label: string }[] = [
  { value: "this", label: "Only this date" },
  { value: "following", label: "This and later dates" },
  { value: "all", label: "Every date in the series" },
];

const SeriesScopeModal: React.FC<SeriesScopeModalProps> = ({
  action,
  eventName,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [selected, setSelected] = useState<SeriesScope>("this");
  const isDelete = action === "delete";

  return (
    <DialogShell
      open
      onClose={onCancel}
      title={isDelete ? "Delete which dates?" : "Update which dates?"}
      subtitle={eventName ? `${eventName} repeats.` : "This event repeats."}
      ctaLabel={isDelete ? "Delete" : "Save changes"}
      ctaTone={isDelete ? "danger" : "primary"}
      onConfirm={() => onConfirm(selected)}
      loading={loading}
    >
      <div role="radiogroup" aria-label="Dates" className="flex flex-col gap-2">
        {SCOPE_OPTIONS.map((option) => {
          const on = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(option.value)}
              className={cn(
                "min-h-12 rounded-lg border bg-white px-4 py-3 text-left text-sm text-primary transition-colors",
                on ? "border-primary font-semibold shadow-[0_0_0_1px_#080D2D]" : "border-lightGray hover:bg-[#F8F9FC]"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </DialogShell>
  );
};

export default SeriesScopeModal;
