import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { encodeQuery } from "@/pages/HomePage/utils";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import {
  FilterToggleButton,
  KpiCard,
  PageHeading,
  PillTabs,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import { SoulWonListType } from "@/utils/api/lifeCenter/interfaces";

import {
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  resolveFiltersDateRange,
  toDateTime,
} from "../../Analytics/utils";
import {
  ChartCard,
  ChartNote,
  ColumnChart,
  FollowUpList,
  HorizontalBarList,
} from "../components/analytics/AnalyticsCharts";
import { AnalyticsFilterPanel } from "../components/analytics/AnalyticsFilterPanel";
import {
  countActiveAnalyticsFilters,
  describeAnalyticsRange,
  MembershipAnalyticsFilterState,
} from "../components/analytics/analyticsFilterState";
import {
  ANALYTICS_SECTIONS,
  AnalyticsSectionKey,
  buildSection,
  ChartSpec,
} from "../components/analytics/analyticsSections";
import { JoinedTrendChart } from "../components/analytics/JoinedTrendChart";
import {
  extractVisitors,
  getMemberDepartments,
  getMemberJoinDate,
  MemberRecord,
  safeString,
} from "../components/analytics/memberAnalyticsData";

const createDefaultFilterState = (): MembershipAnalyticsFilterState => ({
  period: createDefaultAnalyticsFilters(),
  membershipType: "",
  department: "",
  scope: "active",
});

export const MembershipAnalytics = () => {
  const navigate = useNavigate();
  const { activeBranchId } = useBranchStore();
  const storeDepartments = useSettingsStore((state) => state.departments);

  const [filterState, setFilterState] = useState<MembershipAnalyticsFilterState>(
    createDefaultFilterState
  );
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<AnalyticsSectionKey>("growth");

  const {
    data: membersResponse,
    loading: membersLoading,
    error: membersError,
  } = useFetch(api.fetch.fetchAllMembers, { take: 5000 });
  const { data: visitorsResponse } = useFetch(api.fetch.fetchAllVisitors, {
    limit: 5000,
  });
  const {
    data: soulsWonResponse,
    loading: soulsWonLoading,
    error: soulsWonError,
  } = useFetch(api.fetch.fetchSoulsWon);

  const joinRequestQuery = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), status: "PENDING" }),
    [activeBranchId]
  );
  const { data: joinRequestsResponse } = useFetch(
    api.fetch.fetchJoinRequests,
    joinRequestQuery
  );

  const members = useMemo(() => {
    if (!Array.isArray(membersResponse?.data)) return [];
    return membersResponse.data as MemberRecord[];
  }, [membersResponse]);

  const visitors = useMemo(
    () => extractVisitors(visitorsResponse?.data),
    [visitorsResponse]
  );

  const soulsWon = useMemo(() => {
    if (!Array.isArray(soulsWonResponse?.data)) return [];
    return soulsWonResponse.data as SoulWonListType[];
  }, [soulsWonResponse]);

  const departmentOptions = useMemo(() => {
    const names = storeDepartments.length
      ? storeDepartments.map((department) => department.name)
      : members.flatMap((member) => getMemberDepartments(member));
    return Array.from(new Set(names.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [members, storeDepartments]);

  const earliestMemberJoinDate = useMemo(
    () => getEarliestIsoDate(members.map((member) => getMemberJoinDate(member))),
    [members]
  );

  const effectiveDateRange = useMemo(() => {
    const range = resolveFiltersDateRange(filterState.period, earliestMemberJoinDate);
    if (range.from && range.to && range.from > range.to) {
      return { from: range.to, to: range.from };
    }
    return range;
  }, [earliestMemberJoinDate, filterState.period]);

  const { membershipType, department, scope } = filterState;

  // Type + department filters, ignoring date and active scope.
  const typeDeptMembers = useMemo(
    () =>
      members.filter((member) => {
        if (
          membershipType &&
          safeString(member.membership_type).toUpperCase() !== membershipType
        ) {
          return false;
        }
        if (department && !getMemberDepartments(member).includes(department)) return false;
        return true;
      }),
    [department, members, membershipType]
  );

  const inScope = useCallback(
    (member: MemberRecord) => scope === "all" || member.is_active !== false,
    [scope]
  );
  const inRange = useCallback(
    (member: MemberRecord) => {
      const joinDate = getMemberJoinDate(member);
      return Boolean(joinDate) && isWithinRange(joinDate, effectiveDateRange);
    },
    [effectiveDateRange]
  );

  const membersAnyScope = useMemo(
    () => typeDeptMembers.filter(inRange),
    [inRange, typeDeptMembers]
  );
  const filteredMembers = useMemo(
    () => membersAnyScope.filter(inScope),
    [inScope, membersAnyScope]
  );
  const baseMembers = useMemo(
    () => typeDeptMembers.filter(inScope),
    [inScope, typeDeptMembers]
  );
  const allOfType = useMemo(
    () =>
      members.filter(
        (member) =>
          !membershipType ||
          safeString(member.membership_type).toUpperCase() === membershipType
      ),
    [members, membershipType]
  );

  const filteredVisitors = useMemo(
    () => visitors.filter((visitor) => isWithinRange(visitor.createdAt, effectiveDateRange)),
    [visitors, effectiveDateRange]
  );
  const filteredSoulsWon = useMemo(
    () =>
      soulsWon.filter((soul) => isWithinRange(safeString(soul.date_won), effectiveDateRange)),
    [effectiveDateRange, soulsWon]
  );

  const pendingJoinRequests = Array.isArray(joinRequestsResponse?.data)
    ? joinRequestsResponse.data.length
    : null;

  const openMember = useCallback(
    (id: number | string) => navigate(`/home/members/${encodeQuery(id)}`),
    [navigate]
  );

  const section = ANALYTICS_SECTIONS.find((entry) => entry.key === activeSection)!;
  const periodYear = toDateTime(effectiveDateRange.to)?.year ?? new Date().getFullYear();

  const { kpis, charts } = useMemo(
    () =>
      buildSection(activeSection, {
        members: filteredMembers,
        baseMembers,
        membersAnyScope,
        allOfType,
        scope,
        visitors: filteredVisitors,
        soulsWon: filteredSoulsWon,
        departments: storeDepartments,
        pendingJoinRequests,
        year: periodYear,
        openMember,
      }),
    [
      activeSection,
      allOfType,
      baseMembers,
      filteredMembers,
      filteredSoulsWon,
      filteredVisitors,
      membersAnyScope,
      openMember,
      pendingJoinRequests,
      periodYear,
      scope,
      storeDepartments,
    ]
  );

  const rangeNote = describeAnalyticsRange(filterState.period, effectiveDateRange);

  const activeFilterCount = countActiveAnalyticsFilters(filterState);
  const memberCount = filteredMembers.length;

  const renderChart = (chart: ChartSpec, index: number) => {
    if (chart.kind === "trend") {
      return (
        <JoinedTrendChart
          key="trend"
          // Kept as before the redesign: ignores the "Members included" scope.
          members={membersAnyScope}
          effectiveDateRange={effectiveDateRange}
        />
      );
    }
    return (
      <ChartCard key={`${chart.title}-${index}`} title={chart.title} sub={chart.sub}>
        {chart.kind === "bar" && <HorizontalBarList items={chart.items} />}
        {chart.kind === "col" && <ColumnChart items={chart.items} />}
        {chart.kind === "list" && <FollowUpList items={chart.items} />}
        {chart.kind === "missing" && <ChartNote>{chart.note}</ChartNote>}
      </ChartCard>
    );
  };

  return (
    <PageOutline
      crumbs={[
        { label: "Home", link: "/home" },
        { label: "Membership", link: "/home/membership" },
        { label: "Analytics" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Membership Analytics"
          subtitle="How the church family is growing, serving and settling in."
          actions={
            <FilterToggleButton
              open={showFilters}
              count={activeFilterCount}
              onClick={() => setShowFilters((open) => !open)}
            />
          }
        />

        {showFilters && (
          <AnalyticsFilterPanel
            value={filterState}
            onChange={setFilterState}
            onReset={() => setFilterState(createDefaultFilterState())}
            effectiveRange={effectiveDateRange}
            departmentOptions={departmentOptions}
          />
        )}

        <PillTabs
          ariaLabel="Analytics sections"
          tabs={ANALYTICS_SECTIONS.map((entry) => ({ key: entry.key, label: entry.label }))}
          value={activeSection}
          onChange={setActiveSection}
        />

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold leading-7 text-[#1F2937]">{section.label}</h2>
          <p className="text-sm text-[#4B5563]">
            {section.desc} · {memberCount} {memberCount === 1 ? "member" : "members"} in this
            view
          </p>
          <p className="text-xs text-[#6B7280]">{rangeNote}</p>
        </div>

        {membersError || soulsWonError ? (
          <div
            role="alert"
            className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
          >
            Failed to load one or more membership datasets. Some charts may be partial.
          </div>
        ) : null}
        {membersLoading || soulsWonLoading ? (
          <p role="status" className="text-sm text-[#6B7280]">
            Loading membership analytics…
          </p>
        ) : null}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} />
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
          {charts.map(renderChart)}
        </div>
      </div>
    </PageOutline>
  );
};

export default MembershipAnalytics;
