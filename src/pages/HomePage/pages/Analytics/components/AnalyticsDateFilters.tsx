import { useMemo } from "react";
import { AnalyticsFilters } from "../types";
import {
  defaultDateRange,
  getGroupByForPeriod,
  getMonthOptions,
  getWeekOptions,
  getYearOptions,
  resolvePeriodDateRange,
} from "../utils";

interface Props {
  value: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  onReset: () => void;
  extra?: React.ReactNode;
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
}: Props) => {
  const periodType = value.periodType ?? "year";
  const selectedYear = value.selectedYear ?? getYearOptions(1)[0].value;
  const selectedMonth = value.selectedMonth ?? "1";
  const selectedWeek = value.selectedWeek ?? "1";

  const weekOptions = useMemo(
    () => getWeekOptions(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const dateRange = useMemo(() => {
    return resolvePeriodDateRange(
      periodType,
      selectedYear,
      selectedMonth,
      selectedWeek,
      value.dateRange ?? defaultDateRange()
    );
  }, [periodType, selectedYear, selectedMonth, selectedWeek, value.dateRange]);

  const commit = (next: Partial<AnalyticsFilters>) => {
    const nextPeriodType = (next.periodType ?? periodType) as AnalyticsFilters["periodType"];
    const nextYear = next.selectedYear ?? selectedYear;
    const nextMonth = next.selectedMonth ?? selectedMonth;

    const baseWeek = next.selectedWeek ?? selectedWeek;
    const validWeeks = getWeekOptions(nextYear, nextMonth).map((week) => week.value);
    const nextWeek = validWeeks.includes(baseWeek || "")
      ? baseWeek
      : validWeeks[0] || "1";

    const nextRange =
      nextPeriodType === "specific_date_range"
        ? {
            from: next.dateRange?.from ?? value.dateRange.from,
            to: next.dateRange?.to ?? value.dateRange.to,
          }
        : resolvePeriodDateRange(
            (nextPeriodType ?? "year") as NonNullable<AnalyticsFilters["periodType"]>,
            nextYear,
            nextMonth,
            nextWeek,
            value.dateRange
          );

    const nextGroupBy =
      nextPeriodType === "specific_date_range"
        ? "day"
        : getGroupByForPeriod(
            (nextPeriodType ?? "year") as NonNullable<AnalyticsFilters["periodType"]>
          );

    onChange({
      ...value,
      ...next,
      periodType: nextPeriodType,
      selectedYear: nextYear,
      selectedMonth: nextMonth,
      selectedWeek: nextWeek,
      groupBy: nextGroupBy,
      dateRange: nextRange,
    });
  };

  const showYear = ["year", "month", "week"].includes(periodType);
  const showMonth = ["month", "week"].includes(periodType);
  const showWeek = periodType === "week";
  const disableDateInputs = periodType !== "specific_date_range";

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <button
          type="button"
          className="h-10 border rounded px-3 text-sm hover:bg-gray-50"
          onClick={onReset}
        >
          Reset Filters
        </button>

        {extra ? <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">{extra}</div> : null}
      </div>
    </div>
  );
};
