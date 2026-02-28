import { useEffect, useMemo } from "react";
import { AnalyticsFilters } from "../types";
import {
  defaultDateRange,
  getGroupByForPeriod,
  getMonthOptions,
  getWeekOptions,
  getYearOptions,
  resolveFiltersDateRange,
} from "../utils";

interface Props {
  value: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  onReset: () => void;
  extra?: React.ReactNode;
  cumulativeFrom?: string;
}

const periodOptions = [
  { label: "Year", value: "year" },
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "Specific date range", value: "specific_date_range" },
] as const;

export const AnalyticsDateFilters = ({
  value,
  onChange,
  onReset,
  extra,
  cumulativeFrom,
}: Props) => {
  const periodType = value.periodType ?? "year";
  const analysisMode = value.analysisMode ?? "cumulative";
  const selectedYear = value.selectedYear ?? getYearOptions(1)[0].value;
  const selectedMonth = value.selectedMonth ?? "1";
  const selectedWeek = value.selectedWeek ?? "1";

  const weekOptions = useMemo(
    () => getWeekOptions(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const dateRange = useMemo(
    () =>
      resolveFiltersDateRange(
        {
          ...value,
          periodType,
          analysisMode,
          selectedYear,
          selectedMonth,
          selectedWeek,
          dateRange: value.dateRange ?? defaultDateRange(),
        },
        cumulativeFrom
      ),
    [
      analysisMode,
      cumulativeFrom,
      periodType,
      selectedMonth,
      selectedWeek,
      selectedYear,
      value,
    ]
  );

  const commit = (next: Partial<AnalyticsFilters>) => {
    const nextPeriodType = (next.periodType ?? periodType) as AnalyticsFilters["periodType"];
    const nextAnalysisMode =
      (next.analysisMode ?? analysisMode) as NonNullable<AnalyticsFilters["analysisMode"]>;
    const nextYear = next.selectedYear ?? selectedYear;
    const nextMonth = next.selectedMonth ?? selectedMonth;

    const baseWeek = next.selectedWeek ?? selectedWeek;
    const validWeeks = getWeekOptions(nextYear, nextMonth).map((week) => week.value);
    const nextWeek = validWeeks.includes(baseWeek || "")
      ? baseWeek
      : validWeeks[0] || "1";

    const resolvedNextFilters: AnalyticsFilters = {
      ...value,
      ...next,
      periodType: nextPeriodType,
      analysisMode: nextAnalysisMode,
      selectedYear: nextYear,
      selectedMonth: nextMonth,
      selectedWeek: nextWeek,
      groupBy:
        nextPeriodType === "specific_date_range"
          ? "day"
          : getGroupByForPeriod(
              (nextPeriodType ?? "year") as NonNullable<AnalyticsFilters["periodType"]>
            ),
      dateRange:
        nextPeriodType === "specific_date_range"
          ? {
              from: next.dateRange?.from ?? value.dateRange.from,
              to: next.dateRange?.to ?? value.dateRange.to,
            }
          : value.dateRange,
    };

    const nextRange = resolveFiltersDateRange(resolvedNextFilters, cumulativeFrom);

    onChange({
      ...resolvedNextFilters,
      dateRange: nextRange,
    });
  };

  useEffect(() => {
    const expectedGroupBy =
      periodType === "specific_date_range" ? "day" : getGroupByForPeriod(periodType);
    const expectedDateRange = resolveFiltersDateRange(
      {
        ...value,
        periodType,
        analysisMode,
        selectedYear,
        selectedMonth,
        selectedWeek,
      },
      cumulativeFrom
    );

    const needsSync =
      (value.analysisMode ?? "cumulative") !== analysisMode ||
      value.selectedYear !== selectedYear ||
      value.selectedMonth !== selectedMonth ||
      value.selectedWeek !== selectedWeek ||
      value.groupBy !== expectedGroupBy ||
      value.dateRange.from !== expectedDateRange.from ||
      value.dateRange.to !== expectedDateRange.to;

    if (!needsSync) return;

    onChange({
      ...value,
      periodType,
      analysisMode,
      selectedYear,
      selectedMonth,
      selectedWeek,
      groupBy: expectedGroupBy,
      dateRange: expectedDateRange,
    });
  }, [
    analysisMode,
    cumulativeFrom,
    onChange,
    periodType,
    selectedMonth,
    selectedWeek,
    selectedYear,
    value,
  ]);

  const showYear = ["year", "month", "week"].includes(periodType);
  const showMonth = ["month", "week"].includes(periodType);
  const showWeek = periodType === "week";
  const disableDateInputs = periodType !== "specific_date_range";

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Filter by</label>
          <select
            className="h-10 border rounded px-3 w-full"
            value={periodType}
            onChange={(event) =>
              commit({
                periodType: event.target.value as AnalyticsFilters["periodType"],
              })
            }
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-600">Analysis mode</label>
          <select
            className="h-10 border rounded px-3 w-full disabled:bg-gray-100"
            value={analysisMode}
            disabled={periodType === "specific_date_range"}
            onChange={(event) =>
              commit({
                analysisMode: event.target.value as AnalyticsFilters["analysisMode"],
              })
            }
          >
            <option value="cumulative">Cumulative</option>
            <option value="point_in_time">Point in time</option>
          </select>
        </div>

        {showYear ? (
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Year</label>
            <select
              className="h-10 border rounded px-3 w-full"
              value={selectedYear}
              onChange={(event) => commit({ selectedYear: event.target.value })}
            >
              {getYearOptions(10).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showMonth ? (
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Month</label>
            <select
              className="h-10 border rounded px-3 w-full"
              value={selectedMonth}
              onChange={(event) => commit({ selectedMonth: event.target.value })}
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showWeek ? (
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Week</label>
            <select
              className="h-10 border rounded px-3 w-full"
              value={selectedWeek}
              onChange={(event) => commit({ selectedWeek: event.target.value })}
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="text-xs text-gray-600">From</label>
          <input
            type="date"
            className="h-10 border rounded px-3 w-full disabled:bg-gray-100"
            value={disableDateInputs ? dateRange.from : value.dateRange.from}
            disabled={disableDateInputs}
            onChange={(event) =>
              commit({
                dateRange: {
                  ...value.dateRange,
                  from: event.target.value,
                },
              })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-600">To</label>
          <input
            type="date"
            className="h-10 border rounded px-3 w-full disabled:bg-gray-100"
            value={disableDateInputs ? dateRange.to : value.dateRange.to}
            disabled={disableDateInputs}
            onChange={(event) =>
              commit({
                dateRange: {
                  ...value.dateRange,
                  to: event.target.value,
                },
              })
            }
          />
        </div>

        {extra}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-gray-500">
          {periodType === "specific_date_range"
            ? "Specific date range uses only the selected From and To dates."
            : analysisMode === "cumulative"
            ? `Cumulative mode starts from the first available record and runs to ${dateRange.to}.`
            : "Point in time mode shows only the selected period."}
        </p>

        <button
          type="button"
          className="h-10 border rounded px-3 text-sm hover:bg-gray-50"
          onClick={onReset}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
