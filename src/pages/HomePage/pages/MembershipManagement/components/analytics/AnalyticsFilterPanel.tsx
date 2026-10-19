import { DateTime } from "luxon";

import {
  Field,
  FilterPanel,
  SelectInput,
  SelectOption,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  AnalyticsFilters,
  AnalyticsPeriodType,
  AnalyticsRange,
} from "@/pages/HomePage/pages/Analytics/types";
import {
  getCurrentYear,
  getGroupByForPeriod,
  getMonthOptions,
  getWeeksInMonth,
  getYearOptions,
} from "@/pages/HomePage/pages/Analytics/utils";

import { MembersScope, MembershipAnalyticsFilterState } from "./analyticsFilterState";

const PERIOD_OPTIONS: SelectOption[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "specific_date_range", label: "Specific date range" },
];

const MODE_OPTIONS: SelectOption[] = [
  { value: "cumulative", label: "Cumulative" },
  { value: "point_in_time", label: "Point in time" },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "All membership types" },
  { value: "IN_HOUSE", label: "In person" },
  { value: "ONLINE", label: "Online" },
];

const SCOPE_OPTIONS: SelectOption[] = [
  { value: "active", label: "Active members" },
  { value: "all", label: "Include inactive" },
];

const weekOptionsFor = (year: string, month: string): SelectOption[] => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return [{ value: "1", label: "Week 1" }];
  const days = DateTime.local(y, m).daysInMonth || 28;
  return Array.from({ length: getWeeksInMonth(y, m) }).map((_, index) => {
    const start = index * 7 + 1;
    return {
      value: String(index + 1),
      label: `Week ${index + 1} (${start}–${Math.min(start + 6, days)})`,
    };
  });
};

export const AnalyticsFilterPanel = ({
  value,
  onChange,
  onReset,
  effectiveRange,
  departmentOptions,
}: {
  value: MembershipAnalyticsFilterState;
  onChange: (next: MembershipAnalyticsFilterState) => void;
  onReset: () => void;
  /** Range currently applied (resolveFiltersDateRange), shown in From/To. */
  effectiveRange: AnalyticsRange;
  departmentOptions: string[];
}) => {
  const { period } = value;
  const periodType = period.periodType ?? "year";
  const isRange = periodType === "specific_date_range";
  const selectedYear = period.selectedYear ?? String(getCurrentYear());
  const selectedMonth = period.selectedMonth ?? "1";
  const weekOptions = weekOptionsFor(selectedYear, selectedMonth);
  const selectedWeek = weekOptions.some((week) => week.value === period.selectedWeek)
    ? (period.selectedWeek as string)
    : weekOptions[0].value;

  const setPeriod = (next: Partial<AnalyticsFilters>) => {
    const merged: AnalyticsFilters = { ...period, ...next };
    const nextType = (merged.periodType ?? "year") as AnalyticsPeriodType;
    const validWeeks = weekOptionsFor(
      merged.selectedYear ?? selectedYear,
      merged.selectedMonth ?? selectedMonth
    ).map((week) => week.value);
    if (!validWeeks.includes(merged.selectedWeek ?? "")) merged.selectedWeek = validWeeks[0];
    merged.groupBy = nextType === "specific_date_range" ? "day" : getGroupByForPeriod(nextType);
    // Entering a specific range starts from whatever range is in view now.
    if (nextType === "specific_date_range" && periodType !== "specific_date_range" && !next.dateRange) {
      merged.dateRange = effectiveRange;
    }
    onChange({ ...value, period: merged });
  };

  const showYear = ["year", "month", "week"].includes(periodType);
  const showMonth = ["month", "week"].includes(periodType);
  const showWeek = periodType === "week";

  return (
    <FilterPanel
      title="Refine analytics"
      helper="Choose the period and who to include."
      onReset={onReset}
    >
      <Field label="Filter by">
        <SelectInput
          options={PERIOD_OPTIONS}
          value={periodType}
          onChange={(event) =>
            setPeriod({ periodType: event.target.value as AnalyticsPeriodType })
          }
        />
      </Field>
      <Field label="Analysis mode">
        <SelectInput
          options={MODE_OPTIONS}
          value={isRange ? "point_in_time" : period.analysisMode ?? "cumulative"}
          disabled={isRange}
          onChange={(event) =>
            setPeriod({
              analysisMode: event.target.value as AnalyticsFilters["analysisMode"],
            })
          }
        />
      </Field>
      {showYear && (
        <Field label="Year">
          <SelectInput
            options={getYearOptions(10)}
            value={selectedYear}
            onChange={(event) => setPeriod({ selectedYear: event.target.value })}
          />
        </Field>
      )}
      {showMonth && (
        <Field label="Month">
          <SelectInput
            options={getMonthOptions()}
            value={selectedMonth}
            onChange={(event) => setPeriod({ selectedMonth: event.target.value })}
          />
        </Field>
      )}
      {showWeek && (
        <Field label="Week">
          <SelectInput
            options={weekOptions}
            value={selectedWeek}
            onChange={(event) => setPeriod({ selectedWeek: event.target.value })}
          />
        </Field>
      )}
      <Field label="From">
        <TextInput
          type="date"
          value={isRange ? period.dateRange.from : effectiveRange.from}
          disabled={!isRange}
          onChange={(event) =>
            setPeriod({ dateRange: { ...period.dateRange, from: event.target.value } })
          }
        />
      </Field>
      <Field label="To">
        <TextInput
          type="date"
          value={isRange ? period.dateRange.to : effectiveRange.to}
          disabled={!isRange}
          onChange={(event) =>
            setPeriod({ dateRange: { ...period.dateRange, to: event.target.value } })
          }
        />
      </Field>
      <Field label="Membership type">
        <SelectInput
          options={TYPE_OPTIONS}
          value={value.membershipType}
          onChange={(event) => onChange({ ...value, membershipType: event.target.value })}
        />
      </Field>
      <Field label="Department">
        <SelectInput
          options={[
            { value: "", label: "All departments" },
            ...departmentOptions.map((name) => ({ value: name, label: name })),
          ]}
          value={value.department}
          onChange={(event) => onChange({ ...value, department: event.target.value })}
        />
      </Field>
      <Field label="Members included">
        <SelectInput
          options={SCOPE_OPTIONS}
          value={value.scope}
          onChange={(event) =>
            onChange({ ...value, scope: event.target.value as MembersScope })
          }
        />
      </Field>
    </FilterPanel>
  );
};
