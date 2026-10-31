import { useState } from "react";

import { cn } from "@/utils/cn";
import { useAssistantStore } from "@/store/assistantStore";

// Phase 1: local-only reminder settings. Persistence via /ai/preferences
// lands in Phase 2 (mirrors notification_preference upsert).
interface ToggleState {
  brief: boolean;
  nudges: boolean;
  quiet: boolean;
  email: boolean;
}

const TOGGLES: { key: keyof ToggleState; label: string; desc: string }[] = [
  { key: "brief", label: "Morning briefing", desc: "A summary of what needs you, every day at 07:00." },
  { key: "nudges", label: "Nudges", desc: "Pop up when something becomes overdue." },
  { key: "quiet", label: "Quiet hours", desc: "No nudges between 21:00 and 07:00." },
  { key: "email", label: "Email copy", desc: "Also email me overdue items." },
];

const SELECTS: { key: string; label: string; options: string[] }[] = [
  { key: "approvalAfter", label: "Remind me about approvals after", options: ["12 hours", "24 hours", "48 hours"] },
  { key: "reportLead", label: "Remind me about report deadlines", options: ["1 day before", "2 days before", "1 week before"] },
  { key: "visitorAfter", label: "Flag uncontacted visitors after", options: ["24 hours", "48 hours", "72 hours"] },
];

export const SettingsView = () => {
  const setView = useAssistantStore((state) => state.setView);
  const [toggles, setToggles] = useState<ToggleState>({ brief: true, nudges: true, quiet: true, email: false });
  const [selects, setSelects] = useState<Record<string, string>>({
    approvalAfter: "24 hours",
    reportLead: "2 days before",
    visitorAfter: "48 hours",
  });

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <button
        type="button"
        onClick={() => setView("main")}
        className="self-start text-sm text-gray-600 hover:text-[#080D2D]"
      >
        ← Back
      </button>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[#080D2D]">Reminder settings</h3>
        <p className="text-sm text-gray-600">Choose when I remind you and how loudly. These apply to you only.</p>
      </div>

      <div className="rounded-xl border border-[#D8DAE5]">
        {TOGGLES.map((row, index) => {
          const on = toggles[row.key];
          return (
            <div
              key={row.key}
              className={cn("flex items-center gap-4 p-4", index > 0 && "border-t border-gray-200")}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-[#080D2D]">{row.label}</p>
                <p className="text-xs text-gray-500">{row.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={row.label}
                onClick={() => setToggles((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
                className={cn(
                  "relative h-6 w-10 flex-shrink-0 rounded-full transition-colors",
                  on ? "bg-[#080D2D]" : "bg-[#D8DAE5]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]",
                    on ? "left-[18px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {SELECTS.map((row) => (
          <label key={row.key} className="flex flex-col gap-1 text-sm font-medium text-[#080D2D]">
            {row.label}
            <select
              value={selects[row.key]}
              onChange={(event) => setSelects((prev) => ({ ...prev, [row.key]: event.target.value }))}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-normal text-[#080D2D]"
            >
              {row.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
};
