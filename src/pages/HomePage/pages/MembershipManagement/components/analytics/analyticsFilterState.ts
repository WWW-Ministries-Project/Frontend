import { AnalyticsFilters } from "@/pages/HomePage/pages/Analytics/types";
import { getCurrentYear } from "@/pages/HomePage/pages/Analytics/utils";

export type MembersScope = "active" | "all";

export interface MembershipAnalyticsFilterState {
  period: AnalyticsFilters;
  membershipType: string;
  department: string;
  scope: MembersScope;
}

export const countActiveAnalyticsFilters = (state: MembershipAnalyticsFilterState) => {
  const periodType = state.period.periodType ?? "year";
  const isRange = periodType === "specific_date_range";
  return [
    periodType !== "year",
    !isRange && (state.period.analysisMode ?? "cumulative") !== "cumulative",
    !isRange && (state.period.selectedYear ?? String(getCurrentYear())) !== String(getCurrentYear()),
    Boolean(state.membershipType),
    Boolean(state.department),
    state.scope !== "active",
  ].filter(Boolean).length;
};

