import { AnalyticsFilters, AnalyticsRange } from "@/pages/HomePage/pages/Analytics/types";
import { getCurrentYear } from "@/pages/HomePage/pages/Analytics/utils";

import { formatDate } from "../membershipUiUtils";

export type MembersScope = "active" | "all";

export interface MembershipAnalyticsFilterState {
  period: AnalyticsFilters;
  membershipType: string;
  department: string;
  scope: MembersScope;
}

/** Period filters that differ from the default (year, cumulative, this year). */
export const countActivePeriodFilters = (period: AnalyticsFilters) => {
  const periodType = period.periodType ?? "year";
  const isRange = periodType === "specific_date_range";
  return [
    periodType !== "year",
    !isRange && (period.analysisMode ?? "cumulative") !== "cumulative",
    !isRange && (period.selectedYear ?? String(getCurrentYear())) !== String(getCurrentYear()),
  ].filter(Boolean).length;
};

export const countActiveAnalyticsFilters = (state: MembershipAnalyticsFilterState) => {
  return countActivePeriodFilters(state.period) + [
    Boolean(state.membershipType),
    Boolean(state.department),
    state.scope !== "active",
  ].filter(Boolean).length;
};


/** One-line explanation of the range the analytics page is showing. */
export const describeAnalyticsRange = (period: AnalyticsFilters, range: AnalyticsRange) => {
  if ((period.periodType ?? "year") === "specific_date_range") {
    return "Specific date range uses only the selected From and To dates.";
  }
  if ((period.analysisMode ?? "cumulative") === "cumulative") {
    return `Cumulative mode starts from the first record (${formatDate(
      range.from
    )}) and runs to ${formatDate(range.to)}.`;
  }
  return `Point in time shows only the selected period: ${formatDate(range.from)} to ${formatDate(
    range.to
  )}.`;
};
