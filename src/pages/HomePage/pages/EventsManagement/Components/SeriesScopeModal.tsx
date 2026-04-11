import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

export type SeriesScope = "this" | "following" | "all";

export interface SeriesScopeModalProps {
  /** "edit" or "delete" — changes wording */
  action: "edit" | "delete";
  eventName?: string;
  onConfirm: (scope: SeriesScope) => void;
  onCancel: () => void;
}

const SCOPE_OPTIONS: {
  value: SeriesScope;
  label: string;
  description: string;
}[] = [
  {
    value: "this",
    label: "This event",
    description: "Only this occurrence is affected.",
  },
  {
    value: "following",
    label: "This and following events",
    description: "This occurrence and every one after it in the series.",
  },
  {
    value: "all",
    label: "All events in this series",
    description: "Every past and future occurrence in the series.",
  },
];

const SeriesScopeModal: React.FC<SeriesScopeModalProps> = ({
  action,
  eventName,
  onConfirm,
  onCancel,
}) => {
  const [selected, setSelected] = useState<SeriesScope>("this");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const isDelete = action === "delete";

  const confirmLabel = isDelete ? "Delete" : "Edit";
  const confirmClass = isDelete
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-primary hover:bg-primary/90 text-white";

  const title = isDelete
    ? "Delete recurring event"
    : "Edit recurring event";

  const subtitle = eventName
    ? `"${eventName}" is part of a recurring series.`
    : "This event is part of a recurring series.";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-scope-title"
      >
        {/* Header */}
        <div className="border-b border-lightGray px-6 py-5">
          <h2
            id="series-scope-title"
            className="text-base font-semibold text-primary"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-primaryGray">{subtitle}</p>
        </div>

        {/* Options */}
        <div className="space-y-2 px-6 py-5">
          <p className="mb-3 text-sm font-medium text-primary">
            Which events would you like to {action}?
          </p>
          {SCOPE_OPTIONS.map((option) => {
            const isActive = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3.5 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-lightGray hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Radio dot */}
                  <span
                    className={clsx(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary"
                        : "border-gray-300"
                    )}
                  >
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <div>
                    <p
                      className={clsx(
                        "text-sm font-medium",
                        isActive ? "text-primary" : "text-gray-800"
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-primaryGray">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-lightGray px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-lightGray px-4 py-2 text-sm font-medium text-primaryGray hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              confirmClass
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeriesScopeModal;
