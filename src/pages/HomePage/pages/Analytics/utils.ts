import { DateTime } from "luxon";
import {
  AnalyticsAnalysisMode,
  AnalyticsFilters,
  AnalyticsGroupBy,
  AnalyticsPeriodType,
  AnalyticsRange,
} from "./types";

export const toDateTime = (value: unknown): DateTime | null => {
  if (typeof value === "string" && value.trim()) {
    const iso = DateTime.fromISO(value.trim());
    if (iso.isValid) return iso;

    const js = DateTime.fromJSDate(new Date(value));
    return js.isValid ? js : null;
  }

  if (typeof value === "number") {
    const js = DateTime.fromJSDate(new Date(value));
    return js.isValid ? js : null;
  }

  if (value instanceof Date) {
    const js = DateTime.fromJSDate(value);
    return js.isValid ? js : null;
  }

  return null;
};

export const isWithinRange = (value: unknown, range: AnalyticsRange) => {
  const date = toDateTime(value);
  if (!date) return false;

  const from = DateTime.fromISO(range.from).startOf("day");
  const to = DateTime.fromISO(range.to).endOf("day");

  if (!from.isValid || !to.isValid) return true;

  return date >= from && date <= to;
};

export const getBucketKey = (date: DateTime, groupBy: AnalyticsGroupBy) => {
  if (groupBy === "day") return date.toFormat("yyyy-LL-dd");
  if (groupBy === "week") return `${date.weekYear}-W${String(date.weekNumber).padStart(2, "0")}`;
  return date.toFormat("yyyy-LL");
};

export const getBucketLabel = (key: string, groupBy: AnalyticsGroupBy) => {
  if (groupBy === "day") {
    const date = DateTime.fromFormat(key, "yyyy-LL-dd");
    return date.isValid ? date.toFormat("dd LLL") : key;
  }

  if (groupBy === "week") {
    return key;
  }

  const date = DateTime.fromFormat(key, "yyyy-LL");
  return date.isValid ? date.toFormat("LLL yyyy") : key;
};

interface SeriesResult {
  labels: string[];
  values: number[];
  total: number;
}

export const buildSeries = <T,>(
  items: T[],
  getDate: (item: T) => unknown,
  getValue: (item: T) => number,
  groupBy: AnalyticsGroupBy,
  range: AnalyticsRange
): SeriesResult => {
  const buckets = new Map<string, number>();

  items.forEach((item) => {
    const rawDate = getDate(item);

    if (!isWithinRange(rawDate, range)) return;

    const parsed = toDateTime(rawDate);
    if (!parsed) return;

    const key = getBucketKey(parsed, groupBy);
    const value = getValue(item);
    const current = buckets.get(key) ?? 0;
    buckets.set(key, current + value);
  });

  const sortedKeys = Array.from(buckets.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  const labels = sortedKeys.map((key) => getBucketLabel(key, groupBy));
  const values = sortedKeys.map((key) => buckets.get(key) ?? 0);
  const total = values.reduce((acc, val) => acc + val, 0);

  return { labels, values, total };
};

export const sumNumbers = (values: Array<number | string | null | undefined>): number =>
  values.reduce((acc, current) => {
    const parsed = Number(current ?? 0);
    if (!Number.isFinite(parsed)) return acc;
    return acc + parsed;
  }, 0);

export const toPercent = (numerator: number, denominator: number) => {
  if (!denominator || denominator <= 0) return 0;
  return (numerator / denominator) * 100;
};

export const defaultDateRange = (): AnalyticsRange => {
  const to = DateTime.now().toFormat("yyyy-LL-dd");
  const from = DateTime.now().minus({ months: 12 }).startOf("month").toFormat("yyyy-LL-dd");

  return { from, to };
};

export const getCurrentYear = () => DateTime.now().year;

export const getYearOptions = (count = 10) => {
  const currentYear = getCurrentYear();
  return Array.from({ length: count }).map((_, index) => {
    const year = String(currentYear - index);
    return { label: year, value: year };
  });
};

export const getMonthOptions = () => [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export const getWeeksInMonth = (year: number, month: number) => {
  const daysInMonth = DateTime.local(year, month).daysInMonth || 28;
  return Math.ceil(daysInMonth / 7);
};

export const getWeekOptions = (year: string, month: string) => {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth)) {
    return [{ label: "Week 1", value: "1" }];
  }

  const totalWeeks = getWeeksInMonth(parsedYear, parsedMonth);

  return Array.from({ length: totalWeeks }).map((_, index) => {
    const week = String(index + 1);
    return { label: `Week ${week}`, value: week };
  });
};

const toIsoDate = (value: DateTime) => value.toFormat("yyyy-LL-dd");

const PERIODS_WITH_ANALYSIS_MODE: AnalyticsPeriodType[] = [
  "year",
  "month",
  "week",
];

export const resolvePeriodDateRange = (
  periodType: AnalyticsPeriodType,
  selectedYear: string,
  selectedMonth: string,
  selectedWeek: string,
  fallbackRange: AnalyticsRange
): AnalyticsRange => {
  const year = Number(selectedYear);
  const month = Number(selectedMonth);
  const week = Number(selectedWeek);

  if (periodType === "year" && Number.isFinite(year)) {
    const from = DateTime.local(year, 1, 1).startOf("day");
    const to = DateTime.local(year, 12, 31).endOf("day");
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }

  if (periodType === "month" && Number.isFinite(year) && Number.isFinite(month)) {
    const from = DateTime.local(year, month, 1).startOf("day");
    const to = from.endOf("month");
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }

  if (
    periodType === "week" &&
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(week)
  ) {
    const startDay = (week - 1) * 7 + 1;
    const monthStart = DateTime.local(year, month, startDay).startOf("day");
    const monthEnd = DateTime.local(year, month).endOf("month");
    const weekEnd = monthStart.plus({ days: 6 }).endOf("day");
    const to = weekEnd > monthEnd ? monthEnd : weekEnd;

    return { from: toIsoDate(monthStart), to: toIsoDate(to) };
  }

  return fallbackRange;
};

export const resolveFiltersDateRange = (
  filters: AnalyticsFilters,
  cumulativeFrom?: unknown
): AnalyticsRange => {
  const periodType = filters.periodType ?? "year";
  const selectedYear = filters.selectedYear ?? String(getCurrentYear());
  const selectedMonth = filters.selectedMonth ?? "1";
  const selectedWeek = filters.selectedWeek ?? "1";
  const analysisMode: AnalyticsAnalysisMode =
    filters.analysisMode ?? "cumulative";

  if (periodType === "specific_date_range") {
    return filters.dateRange;
  }

  const periodRange = resolvePeriodDateRange(
    periodType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    filters.dateRange
  );

  const shouldApplyCumulative =
    analysisMode === "cumulative" &&
    PERIODS_WITH_ANALYSIS_MODE.includes(periodType);

  if (!shouldApplyCumulative) {
    return periodRange;
  }

  const earliest = toDateTime(cumulativeFrom);
  if (!earliest) {
    return periodRange;
  }

  const periodTo = DateTime.fromISO(periodRange.to).endOf("day");
  if (!periodTo.isValid) {
    return periodRange;
  }

  const cumulativeFromDate = earliest.startOf("day");
  const normalizedFrom =
    cumulativeFromDate > periodTo ? periodTo.startOf("day") : cumulativeFromDate;

  return {
    from: toIsoDate(normalizedFrom),
    to: toIsoDate(periodTo),
  };
};

export const getGroupByForPeriod = (periodType: AnalyticsPeriodType): AnalyticsGroupBy => {
  if (periodType === "year") return "month";
  if (periodType === "month") return "week";
  return "day";
};

export const createDefaultAnalyticsFilters = (): AnalyticsFilters => {
  const currentYear = String(getCurrentYear());

  return {
    periodType: "year",
    analysisMode: "cumulative",
    selectedYear: currentYear,
    selectedMonth: "1",
    selectedWeek: "1",
    groupBy: "month",
    dateRange: resolvePeriodDateRange(
      "year",
      currentYear,
      "1",
      "1",
      defaultDateRange()
    ),
  };
};

export const getEarliestIsoDate = (values: unknown[]): string | undefined => {
  const parsedDates = values
    .map((value) => toDateTime(value))
    .filter((value): value is DateTime => Boolean(value));

  if (!parsedDates.length) return undefined;

  return parsedDates
    .reduce((earliest, current) => {
      return current.toMillis() < earliest.toMillis() ? current : earliest;
    })
    .startOf("day")
    .toFormat("yyyy-LL-dd");
};

export const numberFormatter = new Intl.NumberFormat("en-US");

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 2,
});
