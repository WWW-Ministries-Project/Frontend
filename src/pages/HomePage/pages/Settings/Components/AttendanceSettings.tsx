import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  AttendanceTimingSettingsConfig,
  AttendanceTimingSettingsPayload,
  AttendanceTimingUnit,
} from "@/utils/api/settings/attendanceTimingInterfaces";

type TimingRuleDraft = {
  value: string;
  unit: AttendanceTimingUnit;
};

type TimingDraftState = {
  early: TimingRuleDraft;
  on_time: TimingRuleDraft;
  late: TimingRuleDraft;
};

const DEFAULT_CONFIG: AttendanceTimingSettingsConfig = {
  early: {
    value: 15,
    unit: "MINUTES",
    minutes: 15,
  },
  on_time: {
    value: 15,
    unit: "MINUTES",
    minutes: 15,
  },
  late: {
    value: 15,
    unit: "MINUTES",
    minutes: 15,
  },
  updated_at: null,
  updated_by: null,
};

const RULE_COPY = [
  {
    key: "early",
    title: "Early",
    description:
      "Members are marked early once they report at least this much before the event start.",
  },
  {
    key: "on_time",
    title: "On Time",
    description:
      "This is the grace window around the event start for on-time reporting.",
  },
  {
    key: "late",
    title: "Late",
    description:
      "Members are marked late once they report at least this much after the event start.",
  },
] as const;

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const formatUpdatedAt = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsed));
};

const buildDraftFromConfig = (
  config: AttendanceTimingSettingsConfig | null
): TimingDraftState => {
  const source = config || DEFAULT_CONFIG;

  return {
    early: {
      value: String(source.early.value),
      unit: source.early.unit,
    },
    on_time: {
      value: String(source.on_time.value),
      unit: source.on_time.unit,
    },
    late: {
      value: String(source.late.value),
      unit: source.late.unit,
    },
  };
};

const toMinutes = (value: number, unit: AttendanceTimingUnit) =>
  unit === "HOURS" ? value * 60 : value;

const parsePositiveInteger = (value: string) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export function AttendanceSettings() {
  const [reloadKey, setReloadKey] = useState(0);
  const [config, setConfig] = useState<AttendanceTimingSettingsConfig | null>(
    null
  );
  const [draft, setDraft] = useState<TimingDraftState>(
    buildDraftFromConfig(null)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.fetch.fetchAttendanceTimingConfig();
        if (cancelled) {
          return;
        }

        const nextConfig = response.data || DEFAULT_CONFIG;
        setConfig(nextConfig);
        setDraft(buildDraftFromConfig(nextConfig));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            toErrorMessage(loadError, "Unable to load attendance timing settings.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const parsedDraft = useMemo(() => {
    return {
      early: parsePositiveInteger(draft.early.value),
      on_time: parsePositiveInteger(draft.on_time.value),
      late: parsePositiveInteger(draft.late.value),
    };
  }, [draft]);

  const hasInvalidDraft =
    !parsedDraft.early || !parsedDraft.on_time || !parsedDraft.late;

  const currentConfig = config || DEFAULT_CONFIG;
  const hasChanges =
    String(currentConfig.early.value) !== draft.early.value.trim() ||
    currentConfig.early.unit !== draft.early.unit ||
    String(currentConfig.on_time.value) !== draft.on_time.value.trim() ||
    currentConfig.on_time.unit !== draft.on_time.unit ||
    String(currentConfig.late.value) !== draft.late.value.trim() ||
    currentConfig.late.unit !== draft.late.unit;

  const formattedUpdatedAt = formatUpdatedAt(config?.updated_at);

  const handleRuleChange = (
    ruleKey: keyof TimingDraftState,
    field: keyof TimingRuleDraft,
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [ruleKey]: {
        ...current[ruleKey],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (hasInvalidDraft) {
      const message = "Each attendance timing rule must be a positive whole number.";
      setError(message);
      showNotification(message, "error", { title: "Attendance" });
      return;
    }

    setSaving(true);
    setError(null);

    const payload: AttendanceTimingSettingsPayload = {
      early: {
        value: parsedDraft.early as number,
        unit: draft.early.unit,
      },
      on_time: {
        value: parsedDraft.on_time as number,
        unit: draft.on_time.unit,
      },
      late: {
        value: parsedDraft.late as number,
        unit: draft.late.unit,
      },
    };

    try {
      const response = await api.post.upsertAttendanceTimingConfig(payload);
      const nextConfig = response.data || DEFAULT_CONFIG;
      setConfig(nextConfig);
      setDraft(buildDraftFromConfig(nextConfig));

      showNotification("Attendance timing rules saved.", "success", {
        title: "Attendance",
      });
    } catch (saveError) {
      const message = toErrorMessage(
        saveError,
        "Unable to save attendance timing settings."
      );
      setError(message);
      showNotification(message, "error", { title: "Attendance" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="app-card max-w-5xl space-y-4 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            Attendance timing rules
          </h4>
          <p className="text-sm text-primaryGray">
            Configure how member report times are classified as early, on time,
            or late on attendance-driven reports.
          </p>
        </div>

        <Button
          value="Refresh"
          variant="secondary"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading || saving}
        />
      </div>

      {error && (
        <div className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-dashed border-lightGray bg-white px-4 py-6 text-sm text-primaryGray">
          Loading attendance timing settings...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {RULE_COPY.map((rule) => {
              const ruleDraft = draft[rule.key];
              const parsedValue = parsePositiveInteger(ruleDraft.value);
              const computedMinutes = parsedValue
                ? toMinutes(parsedValue, ruleDraft.unit)
                : null;

              return (
                <article
                  key={rule.key}
                  className="rounded-lg border border-lightGray bg-white p-4"
                >
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-primary">
                      {rule.title}
                    </h5>
                    <p className="text-sm text-primaryGray">{rule.description}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                    <label className="space-y-1">
                      <span className="block text-xs font-medium text-primaryGray">
                        Value
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="app-input w-full"
                        value={ruleDraft.value}
                        onChange={(event) =>
                          handleRuleChange(rule.key, "value", event.target.value)
                        }
                        placeholder="e.g. 15"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="block text-xs font-medium text-primaryGray">
                        Unit
                      </span>
                      <select
                        className="app-input w-full"
                        value={ruleDraft.unit}
                        onChange={(event) =>
                          handleRuleChange(
                            rule.key,
                            "unit",
                            event.target.value as AttendanceTimingUnit
                          )
                        }
                      >
                        <option value="MINUTES">Minutes</option>
                        <option value="HOURS">Hours</option>
                      </select>
                    </label>
                  </div>

                  {!parsedValue ? (
                    <p className="mt-2 text-xs text-error">
                      Enter a positive whole number.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-primaryGray">
                      Equivalent to {computedMinutes} minutes.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          <div className="rounded-lg border border-lightGray bg-gray-50 px-4 py-3 text-sm text-primaryGray">
            Early and Late thresholds take priority when a report time lands in an
            overlapping range. The report page uses these saved values when
            classifying member attendance.
          </div>

          {(config?.updated_by || formattedUpdatedAt) && (
            <div className="rounded-lg border border-lightGray bg-white px-4 py-3">
              <h5 className="text-sm font-semibold text-primary">Last update</h5>
              <p className="mt-1 text-sm text-primaryGray">
                {config?.updated_by
                  ? `Updated by ${config.updated_by.name}`
                  : "Updated"}
                {formattedUpdatedAt ? ` on ${formattedUpdatedAt}` : ""}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              value="Save Changes"
              onClick={handleSave}
              disabled={loading || saving || hasInvalidDraft || !hasChanges}
              loading={saving}
            />
          </div>
        </>
      )}
    </section>
  );
}
