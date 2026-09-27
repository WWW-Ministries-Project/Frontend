import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
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

type ApplyScopeStep = "scope" | "range";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DEFAULT_LOOKBACK_MONTHS = 3;
const SELECTABLE_YEARS = 10;

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
  effective_from: null,
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

/** Month (0-11) and year `monthsBack` months before today. */
const getMonthsAgo = (monthsBack: number) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - monthsBack);
  return { month: date.getMonth(), year: date.getFullYear() };
};

const toApplyFromValue = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

/** The baseline rules carry an epoch start, meaning they cover all history. */
const describeEffectiveFrom = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (parsed.getUTCFullYear() <= 1970) {
    return "All recorded attendance";
  }

  return `Attendance recorded from ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)}`;
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
  const [applyScopeStep, setApplyScopeStep] = useState<ApplyScopeStep | null>(
    null
  );
  const [applyFromMonth, setApplyFromMonth] = useState(
    () => getMonthsAgo(DEFAULT_LOOKBACK_MONTHS).month
  );
  const [applyFromYear, setApplyFromYear] = useState(
    () => getMonthsAgo(DEFAULT_LOOKBACK_MONTHS).year
  );

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
  const effectiveFromLabel = describeEffectiveFrom(config?.effective_from);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const yearOptions = Array.from(
    { length: SELECTABLE_YEARS },
    (_, index) => currentYear - index
  );
  const monthOptions = MONTH_NAMES.map((name, index) => ({
    name,
    index,
  })).filter(
    (option) => applyFromYear < currentYear || option.index <= currentMonth
  );

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

  const handleSaveClick = () => {
    if (hasInvalidDraft) {
      const message = "Each attendance timing rule must be a positive whole number.";
      setError(message);
      showNotification(message, "error", { title: "Attendance" });
      return;
    }

    const defaultStart = getMonthsAgo(DEFAULT_LOOKBACK_MONTHS);
    setApplyFromMonth(defaultStart.month);
    setApplyFromYear(defaultStart.year);
    setApplyScopeStep("scope");
  };

  const handleApplyFromYearChange = (year: number) => {
    setApplyFromYear(year);
    if (year === currentYear && applyFromMonth > currentMonth) {
      setApplyFromMonth(currentMonth);
    }
  };

  const handleSave = async (applyToExisting: boolean) => {
    if (hasInvalidDraft) {
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
      apply_to_existing: applyToExisting,
      ...(applyToExisting
        ? { apply_from: toApplyFromValue(applyFromYear, applyFromMonth) }
        : {}),
    };

    try {
      const response = await api.post.upsertAttendanceTimingConfig(payload);
      const nextConfig = response.data || DEFAULT_CONFIG;
      setConfig(nextConfig);
      setDraft(buildDraftFromConfig(nextConfig));
      setApplyScopeStep(null);

      showNotification(
        applyToExisting
          ? `Attendance timing rules saved and applied from ${MONTH_NAMES[applyFromMonth]} ${applyFromYear}.`
          : "Attendance timing rules saved for new attendance entries.",
        "success",
        { title: "Attendance" }
      );
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

          {effectiveFromLabel && (
            <div className="rounded-lg border border-lightGray bg-white px-4 py-3">
              <h5 className="text-sm font-semibold text-primary">
                Current rules apply to
              </h5>
              <p className="mt-1 text-sm text-primaryGray">
                {effectiveFromLabel}
              </p>
            </div>
          )}

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
              onClick={handleSaveClick}
              disabled={loading || saving || hasInvalidDraft || !hasChanges}
              loading={saving}
            />
          </div>
        </>
      )}

      <Modal
        open={applyScopeStep !== null}
        onClose={() => {
          if (!saving) setApplyScopeStep(null);
        }}
        className="max-w-lg"
        title="Apply attendance timing rules"
        description="Choose whether the new rules also apply to attendance already recorded."
      >
        <div className="space-y-4 p-5">
          {applyScopeStep === "scope" ? (
            <>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-primary">
                  Apply to previous attendance?
                </h4>
                <p className="text-sm text-primaryGray">
                  Should these rules also reclassify attendance that has
                  already been recorded? If not, they apply only to new
                  attendance entries.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  value="No, new entries only"
                  variant="secondary"
                  onClick={() => void handleSave(false)}
                  disabled={saving}
                  loading={saving}
                />
                <Button
                  value="Yes, apply to previous data"
                  onClick={() => setApplyScopeStep("range")}
                  disabled={saving}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-primary">
                  How far back?
                </h4>
                <p className="text-sm text-primaryGray">
                  Attendance recorded from the start of this month onwards
                  will be reclassified with the new rules.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-primaryGray">
                    Month
                  </span>
                  <select
                    className="app-input w-full"
                    value={applyFromMonth}
                    onChange={(event) =>
                      setApplyFromMonth(Number(event.target.value))
                    }
                    disabled={saving}
                  >
                    {monthOptions.map((option) => (
                      <option key={option.index} value={option.index}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-primaryGray">
                    Year
                  </span>
                  <select
                    className="app-input w-full"
                    value={applyFromYear}
                    onChange={(event) =>
                      handleApplyFromYearChange(Number(event.target.value))
                    }
                    disabled={saving}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  value="Back"
                  variant="secondary"
                  onClick={() => setApplyScopeStep("scope")}
                  disabled={saving}
                />
                <Button
                  value={`Apply from ${MONTH_NAMES[applyFromMonth]} ${applyFromYear}`}
                  onClick={() => void handleSave(true)}
                  disabled={saving}
                  loading={saving}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </section>
  );
}
