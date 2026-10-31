import { useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { useAssistantStore } from "@/store/assistantStore";
import { api } from "@/utils";
import type { AiPreferences, AiPreferencesPatch } from "@/utils/api/ai/preferencesInterfaces";
import { cn } from "@/utils/cn";

const DEFAULTS: AiPreferences = {
  brief: true,
  nudges: true,
  quiet: true,
  emailCopy: false,
  approvalAfter: "24 hours",
  reportLead: "2 days before",
  visitorAfter: "48 hours",
};

type ToggleKey = "brief" | "nudges" | "quiet" | "emailCopy";

const TOGGLES: { key: ToggleKey; label: string; desc: string }[] = [
  { key: "brief", label: "Morning briefing", desc: "A summary of what needs you, every day at 07:00." },
  { key: "nudges", label: "Nudges", desc: "Pop up when something becomes overdue." },
  { key: "quiet", label: "Quiet hours", desc: "No nudges between 21:00 and 07:00." },
  { key: "emailCopy", label: "Email copy", desc: "Also email me overdue items." },
];

type SelectKey = "approvalAfter" | "reportLead" | "visitorAfter";

const SELECTS: { key: SelectKey; label: string; options: string[] }[] = [
  { key: "approvalAfter", label: "Remind me about approvals after", options: ["12 hours", "24 hours", "48 hours"] },
  { key: "reportLead", label: "Remind me about report deadlines", options: ["1 day before", "2 days before", "1 week before"] },
  { key: "visitorAfter", label: "Flag uncontacted visitors after", options: ["24 hours", "48 hours", "72 hours"] },
];

export const SettingsView = () => {
  const setView = useAssistantStore((state) => state.setView);
  const [prefs, setPrefs] = useState<AiPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.fetch
      .fetchAiPreferences()
      .then((res) => {
        if (active && res.data) setPrefs(res.data);
      })
      .catch(() => {
        /* fall back to defaults; user can still edit */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Optimistic: apply locally, persist the single changed field, roll back on error.
  const persist = async (patch: AiPreferencesPatch) => {
    const previous = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const res = await api.put.updateAiPreferences(patch);
      if (res.data) setPrefs(res.data);
    } catch {
      setPrefs(previous);
      notify.error({ title: "Couldn't save", message: "Your reminder setting didn't save. Try again." });
    }
  };

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

      <fieldset disabled={loading} className="contents">
        <div className={cn("rounded-xl border border-[#D8DAE5]", loading && "opacity-60")}>
          {TOGGLES.map((row, index) => {
            const on = prefs[row.key];
            return (
              <div key={row.key} className={cn("flex items-center gap-4 p-4", index > 0 && "border-t border-gray-200")}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-sm font-medium text-[#080D2D]">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={row.label}
                  onClick={() => void persist({ [row.key]: !on } as AiPreferencesPatch)}
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

        <div className={cn("flex flex-col gap-4", loading && "opacity-60")}>
          {SELECTS.map((row) => (
            <label key={row.key} className="flex flex-col gap-1 text-sm font-medium text-[#080D2D]">
              {row.label}
              <select
                value={prefs[row.key]}
                onChange={(event) => void persist({ [row.key]: event.target.value } as AiPreferencesPatch)}
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
      </fieldset>
    </div>
  );
};
