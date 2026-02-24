import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api, MembersType } from "@/utils";
import { VisitorType } from "@/utils/api/visitors/interfaces";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { membershipContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  isWithinRange,
  numberFormatter,
  toDateTime,
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

type MemberRecord = MembersType & Record<string, unknown>;

type SectionKey =
  | "1. Membership Growth & Health"
  | "2. Church Engagement Indicators"
  | "3. Demographic Composition"
  | "4. Pastoral Care & Welfare Needs"
  | "5. Ministry Workforce Strength"
  | "6. Onboarding Effectiveness"
  | "7. Geographic & Outreach Insights"
  | "8. Data Quality & Admin Maturity"
  | "9. Member Lifecycle Analytics";

const sections: SectionKey[] = [
  "1. Membership Growth & Health",
  "2. Church Engagement Indicators",
  "3. Demographic Composition",
  "4. Pastoral Care & Welfare Needs",
  "5. Ministry Workforce Strength",
  "6. Onboarding Effectiveness",
  "7. Geographic & Outreach Insights",
  "8. Data Quality & Admin Maturity",
  "9. Member Lifecycle Analytics",
];

const safeString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const safeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    return ["true", "yes", "1"].includes(normalized);
  }
  return false;
};

const normalizeStatus = (value: unknown): "UNCONFIRMED" | "CONFIRMED" | "MEMBER" => {
  const normalized = safeString(value).toUpperCase();
  if (normalized === "MEMBER") return "MEMBER";
  if (normalized === "CONFIRMED") return "CONFIRMED";
  return "UNCONFIRMED";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractVisitors = (source: unknown): VisitorType[] => {
  if (Array.isArray(source)) return source as VisitorType[];

  if (isRecord(source)) {
    const level1 = source.data;

    if (Array.isArray(level1)) return level1 as VisitorType[];

    if (isRecord(level1) && Array.isArray(level1.data)) {
      return level1.data as VisitorType[];
    }
  }

  return [];
};

const getMemberJoinDate = (member: MemberRecord): string => {
  return (
    safeString(member.date_joined) ||
    safeString(member.member_since) ||
    safeString(member.created_at)
  );
};

const getMemberDepartments = (member: MemberRecord) => {
  const departments = new Set<string>();

  const primary = safeString(member.department_name);
  if (primary) departments.add(primary);

  if (Array.isArray(member.department_names)) {
    member.department_names.forEach((entry) => {
      const normalized = safeString(entry);
      if (normalized) departments.add(normalized);
    });
  }

  if (Array.isArray(member.department_positions)) {
    member.department_positions.forEach((entry) => {
      if (typeof entry === "string") {
        const normalized = safeString(entry);
        if (normalized) departments.add(normalized);
        return;
      }

      if (isRecord(entry)) {
        const normalized = safeString(entry.department_name);
        if (normalized) departments.add(normalized);
      }
    });
  }

  return Array.from(departments);
};

const hasDepartment = (member: MemberRecord) => {
  return getMemberDepartments(member).length > 0;
};

const isMinistryWorker = (member: MemberRecord) => {
  return (
    safeBoolean(member.ministry_worker) ||
    safeBoolean(member.isMinistryWorker) ||
    safeBoolean(member.ministry_worker === true) ||
    safeString(member.position).length > 0 ||
    (Array.isArray(member.department_positions) && member.department_positions.length > 0)
  );
};

const getEmploymentStatus = (member: MemberRecord) => {
  return safeString(member.employment_status || "Unknown").toLowerCase() || "unknown";
};

const getMaritalStatus = (member: MemberRecord) => {
  return safeString(member.marital_status || "Unknown").toUpperCase() || "UNKNOWN";
};

const getMemberBirthDate = (member: MemberRecord) => {
  return (
    safeString(member.date_of_birth) ||
    safeString(member.dob) ||
    safeString(member.birth_date)
  );
};

const getAgeFromBirthDate = (dateValue: string): number | null => {
  const birthDate = toDateTime(dateValue);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  if (age < 0 || age > 120) return null;
  return age;
};

const getGenderLabel = (member: MemberRecord) => {
  const normalized = safeString(member.gender).toUpperCase();
  if (!normalized) return "Unknown";
  if (normalized === "M" || normalized === "MALE") return "Male";
  if (normalized === "F" || normalized === "FEMALE") return "Female";
  return "Other";
};

const getNameKey = (value: string) => {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const requiredProfileFields = [
  "name",
  "email",
  "primary_number",
  "country",
  "membership_type",
  "status",
  "date_joined",
  "employment_status",
] as const;

export const MembershipAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [activeSection, setActiveSection] = useState<SectionKey>(sections[0]);

  const {
    data: membersResponse,
    loading: membersLoading,
    error: membersError,
  } = useFetch(api.fetch.fetchAllMembers, { take: 5000 });

  const { data: visitorsResponse } = useFetch(api.fetch.fetchAllVisitors, {

    limit: 5000,
  });

  const members = useMemo(() => {
    if (!Array.isArray(membersResponse?.data)) return [];
    return membersResponse.data as MemberRecord[];
  }, [membersResponse]);

  const visitors = useMemo(() => {
    return extractVisitors(visitorsResponse?.data);
  }, [visitorsResponse]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        members
          .flatMap((member) => getMemberDepartments(member))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const joinDate = getMemberJoinDate(member);
      if (!joinDate || !isWithinRange(joinDate, filters.dateRange)) return false;

      if (
        membershipTypeFilter !== "all" &&
        safeString(member.membership_type).toUpperCase() !== membershipTypeFilter
      ) {
        return false;
      }

      if (departmentFilter !== "all") {
        const allMemberDepartments = getMemberDepartments(member);

        if (!allMemberDepartments.includes(departmentFilter)) return false;
      }

      return true;
    });
  }, [members, filters.dateRange, membershipTypeFilter, departmentFilter]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => isWithinRange(visitor.createdAt, filters.dateRange));
  }, [visitors, filters.dateRange]);

  const statusCounts = useMemo(() => {
    return filteredMembers.reduce(
      (acc, member) => {
        const status = normalizeStatus(member.status);
        acc[status] += 1;
        return acc;
      },
      {
        UNCONFIRMED: 0,
        CONFIRMED: 0,
        MEMBER: 0,
      }
    );
  }, [filteredMembers]);

  const healthTotal = statusCounts.UNCONFIRMED + statusCounts.CONFIRMED + statusCounts.MEMBER;

  const joinedTrend = useMemo(
    () =>
      buildSeries(
        filteredMembers,
        (member) => getMemberJoinDate(member),
        () => 1,
        filters.groupBy,
        filters.dateRange
      ),
    [filteredMembers, filters.groupBy, filters.dateRange]
  );

  const recent90Range = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 90);

    return {
      from: start.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    };
  }, []);

  const joined90Series = useMemo(
    () =>
      buildSeries(
        filteredMembers,
        (member) => getMemberJoinDate(member),
        () => 1,
        "month",
        recent90Range
      ),
    [filteredMembers, recent90Range]
  );

  const recentJoinedMembers = useMemo(() => {
    return filteredMembers.filter((member) =>
      isWithinRange(getMemberJoinDate(member), recent90Range)
    );
  }, [filteredMembers, recent90Range]);

  const retainedNewMembers = useMemo(() => {
    return recentJoinedMembers.filter((member) => {
      const status = normalizeStatus(member.status);
      return status === "CONFIRMED" || status === "MEMBER";
    }).length;
  }, [recentJoinedMembers]);

  const onboardingRetentionRate = useMemo(() => {
    return toPercent(retainedNewMembers, recentJoinedMembers.length || 1);
  }, [retainedNewMembers, recentJoinedMembers.length]);

  const joinedMoMChange = useMemo(() => {
    const values = joined90Series.values;
    if (values.length < 2) return 0;

    const last = values[values.length - 1];
    const previous = values[values.length - 2];

    if (!previous) {
      return last > 0 ? 100 : 0;
    }

    return ((last - previous) / previous) * 100;
  }, [joined90Series.values]);

  const visitorFunnel = useMemo(() => {
    const totalVisitors = filteredVisitors.length;
    const interested = filteredVisitors.filter((visitor) => Boolean(visitor.membershipWish)).length;
    const converted = filteredVisitors.filter((visitor) => Boolean(visitor.is_member)).length;

    return { totalVisitors, interested, converted };
  }, [filteredVisitors]);

  const ministryWorkerCount = useMemo(
    () => filteredMembers.filter((member) => isMinistryWorker(member)).length,
    [filteredMembers]
  );

  const nonWorkerCount = Math.max(filteredMembers.length - ministryWorkerCount, 0);

  const churchEngagementRate = toPercent(ministryWorkerCount, filteredMembers.length || 1);

  const departmentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let unassigned = 0;

    filteredMembers.forEach((member) => {
      const memberDepartments = getMemberDepartments(member);
      if (!memberDepartments.length) {
        unassigned += 1;
        return;
      }

      memberDepartments.forEach((department) => {
        map.set(department, (map.get(department) ?? 0) + 1);
      });
    });

    const items = Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    if (unassigned > 0) {
      items.push({ label: "No department", value: unassigned });
    }

    return items.slice(0, 10);
  }, [filteredMembers]);

  const maritalStatusMix = useMemo(() => {
    const map = new Map<string, number>();

    filteredMembers.forEach((member) => {
      const marital = getMaritalStatus(member);
      map.set(marital, (map.get(marital) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  const pastoralCareSignals = useMemo(() => {
    const vulnerableMarital = filteredMembers.filter((member) => {
      const marital = getMaritalStatus(member);
      return ["SINGLE", "WIDOWED", "WIDOWER", "DIVORCED"].includes(marital);
    }).length;

    const unemployed = filteredMembers.filter(
      (member) => getEmploymentStatus(member) === "unemployed"
    ).length;

    return {
      vulnerableMarital,
      unemployed,
    };
  }, [filteredMembers]);

  const ageBandDistribution = useMemo(() => {
    const counts = {
      "0-12": 0,
      "13-17": 0,
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-59": 0,
      "60+": 0,
      Unknown: 0,
    };

    filteredMembers.forEach((member) => {
      const birthDate = getMemberBirthDate(member);
      const age = getAgeFromBirthDate(birthDate);

      if (age === null) {
        counts.Unknown += 1;
        return;
      }

      if (age <= 12) counts["0-12"] += 1;
      else if (age <= 17) counts["13-17"] += 1;
      else if (age <= 24) counts["18-24"] += 1;
      else if (age <= 34) counts["25-34"] += 1;
      else if (age <= 44) counts["35-44"] += 1;
      else if (age <= 59) counts["45-59"] += 1;
      else counts["60+"] += 1;
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [filteredMembers]);

  const genderDistribution = useMemo(() => {
    const map = new Map<string, number>();

    filteredMembers.forEach((member) => {
      const gender = getGenderLabel(member);
      map.set(gender, (map.get(gender) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  const departmentParticipation = useMemo(() => {
    const withDepartment = filteredMembers.filter((member) => hasDepartment(member)).length;
    const withoutDepartment = filteredMembers.length - withDepartment;

    return { withDepartment, withoutDepartment };
  }, [filteredMembers]);

  const onboardingStack = useMemo(() => {
    const rows = {
      UNCONFIRMED: {
        newWithDepartment: 0,
        newWithoutDepartment: 0,
        oldWithDepartment: 0,
        oldWithoutDepartment: 0,
      },
      CONFIRMED: {
        newWithDepartment: 0,
        newWithoutDepartment: 0,
        oldWithDepartment: 0,
        oldWithoutDepartment: 0,
      },
      MEMBER: {
        newWithDepartment: 0,
        newWithoutDepartment: 0,
        oldWithDepartment: 0,
        oldWithoutDepartment: 0,
      },
    };

    filteredMembers.forEach((member) => {
      const status = normalizeStatus(member.status);
      const isNew = isWithinRange(getMemberJoinDate(member), recent90Range);
      const inDepartment = hasDepartment(member);

      if (isNew && inDepartment) rows[status].newWithDepartment += 1;
      if (isNew && !inDepartment) rows[status].newWithoutDepartment += 1;
      if (!isNew && inDepartment) rows[status].oldWithDepartment += 1;
      if (!isNew && !inDepartment) rows[status].oldWithoutDepartment += 1;
    });

    return rows;
  }, [filteredMembers, recent90Range]);

  const locationBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredMembers.forEach((member) => {
      const country = safeString(member.country || "Unknown");
      map.set(country, (map.get(country) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredMembers]);

  const membershipTypeSplit = useMemo(() => {
    const online = filteredMembers.filter(
      (member) => safeString(member.membership_type).toUpperCase() === "ONLINE"
    ).length;
    const inHouse = filteredMembers.filter(
      (member) => safeString(member.membership_type).toUpperCase() === "IN_HOUSE"
    ).length;

    return { online, inHouse };
  }, [filteredMembers]);

  const profileCompletenessScore = useMemo(() => {
    if (!filteredMembers.length) return 0;

    const total = filteredMembers.reduce((acc, member) => {
      const available = requiredProfileFields.filter((field) => {
        if (field === "date_joined") return Boolean(getMemberJoinDate(member));
        return safeString(member[field]).length > 0;
      }).length;

      return acc + toPercent(available, requiredProfileFields.length);
    }, 0);

    return total / filteredMembers.length;
  }, [filteredMembers]);

  const dataCollisions = useMemo(() => {
    const emailMap = new Map<string, number>();
    const phoneMap = new Map<string, number>();
    const nameMap = new Map<string, number>();

    filteredMembers.forEach((member) => {
      const email = safeString(member.email).toLowerCase();
      const phone = `${safeString(member.country_code)}${safeString(member.primary_number)}`;
      const name = getNameKey(safeString(member.name));

      if (email) emailMap.set(email, (emailMap.get(email) ?? 0) + 1);
      if (phone) phoneMap.set(phone, (phoneMap.get(phone) ?? 0) + 1);
      if (name) nameMap.set(name, (nameMap.get(name) ?? 0) + 1);
    });

    return {
      email: Array.from(emailMap.values()).filter((count) => count > 1).length,
      phone: Array.from(phoneMap.values()).filter((count) => count > 1).length,
      name: Array.from(nameMap.values()).filter((count) => count > 1).length,
    };
  }, [filteredMembers]);

  const lifecycleRateSummary = useMemo(() => {
    return {
      unconfirmedToConfirmed: toPercent(statusCounts.CONFIRMED, statusCounts.UNCONFIRMED || 1),
      confirmedToFunctional: toPercent(statusCounts.MEMBER, statusCounts.CONFIRMED || 1),
    };
  }, [statusCounts]);

  const statItems = useMemo(
    () => [
      {
        label: "Members in filter",
        value: numberFormatter.format(filteredMembers.length),
      },
      {
        label: "Health (Confirmed + Functional)",
        value: `${toPercent(statusCounts.CONFIRMED + statusCounts.MEMBER, healthTotal || 1).toFixed(1)}%`,
      },
      {
        label: "Onboarding retention (90 days)",
        value: `${onboardingRetentionRate.toFixed(1)}%`,
      },
      {
        label: "90-day join trend",
        value: `${joinedMoMChange >= 0 ? "+" : ""}${joinedMoMChange.toFixed(1)}%`,
        hint: "Month-over-month in last 90 days",
      },
    ],
    [filteredMembers.length, healthTotal, joinedMoMChange, onboardingRetentionRate, statusCounts.CONFIRMED, statusCounts.MEMBER]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setMembershipTypeFilter("all");
    setDepartmentFilter("all");
  };

  const sectionContent = () => {
    if (activeSection === "1. Membership Growth & Health") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Members Joined Trend (using date joined)</h3>
            <p className="text-xs text-gray-600 mb-3">
              Growth is evaluated by member join date, with 90-day month-over-month comparison.
            </p>
            <div className="h-72">
              <Line
                data={{
                  labels: joinedTrend.labels,
                  datasets: [
                    {
                      label: "Members joined",
                      data: joinedTrend.values,
                      borderColor: "#2463EB",
                      backgroundColor: "rgba(36, 99, 235, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Visitor to Member</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: ["Visitors", "Interested", "Converted"],
                  datasets: [
                    {
                      label: "People",
                      data: [
                        visitorFunnel.totalVisitors,
                        visitorFunnel.interested,
                        visitorFunnel.converted,
                      ],
                      backgroundColor: ["#94A3B8", "#0EA5E9", "#16A34A"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Health Indicator (Status Mix)</h3>
            <p className="text-xs text-gray-600">Uses status: unconfirmed, confirmed, functional member.</p>
            <div className="h-64 mt-3">
              <Doughnut
                data={{
                  labels: ["Unconfirmed", "Confirmed", "Functional member"],
                  datasets: [
                    {
                      data: [statusCounts.UNCONFIRMED, statusCounts.CONFIRMED, statusCounts.MEMBER],
                      backgroundColor: ["#F59E0B", "#2563EB", "#16A34A"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Member to Ministry Worker</h3>
            <div className="h-64 mt-3">
              <Doughnut
                data={{
                  labels: ["Ministry workers", "Not yet workers"],
                  datasets: [
                    {
                      data: [ministryWorkerCount, nonWorkerCount],
                      backgroundColor: ["#16A34A", "#CBD5E1"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              Member growth in the last 90 days is{" "}
              <span className="font-semibold">
                {joinedMoMChange >= 0 ? "increasing" : "declining"}
              </span>{" "}
              ({joinedMoMChange >= 0 ? "+" : ""}
              {joinedMoMChange.toFixed(1)}% month-over-month).
            </p>
            <p>
              Retention after onboarding is{" "}
              <span className="font-semibold">{onboardingRetentionRate.toFixed(1)}%</span>; this
              should rise together with new joiners to confirm healthy assimilation.
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "2. Church Engagement Indicators") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Church Engagement Snapshot</h3>
            <p className="text-xs text-gray-600 mb-3">
              Based on ministry worker and department/position assignment signals.
            </p>
            <div className="h-72">
              <Bar
                data={{
                  labels: ["Engaged", "Not engaged"],
                  datasets: [
                    {
                      label: "Members",
                      data: [ministryWorkerCount, nonWorkerCount],
                      backgroundColor: ["#2463EB", "#CBD5E1"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Department Breakdown</h3>
            <div className="h-72 mt-3">
              <Bar
                data={{
                  labels: departmentBreakdown.length
                    ? departmentBreakdown.map((item) => item.label)
                    : ["No department data"],
                  datasets: [
                    {
                      label: "Members",
                      data: departmentBreakdown.length
                        ? departmentBreakdown.map((item) => item.value)
                        : [0],
                      backgroundColor: "#0EA5E9",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 lg:col-span-2 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              Church engagement rate is{" "}
              <span className="font-semibold">{churchEngagementRate.toFixed(1)}%</span> based on
              members serving in workforce roles.
            </p>
            <p>
              Department participation currently shows{" "}
              <span className="font-semibold">
                {numberFormatter.format(departmentParticipation.withDepartment)}
              </span>{" "}
              members assigned and{" "}
              <span className="font-semibold">
                {numberFormatter.format(departmentParticipation.withoutDepartment)}
              </span>{" "}
              without assignment.
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "3. Demographic Composition") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Age Distribution (from DOB)</h3>
            <div className="h-72 mt-3">
              <Bar
                data={{
                  labels: ageBandDistribution.map((item) => item.label),
                  datasets: [
                    {
                      label: "Members",
                      data: ageBandDistribution.map((item) => item.value),
                      backgroundColor: "#2563EB",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Gender Distribution</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: genderDistribution.map((item) => item.label),
                  datasets: [
                    {
                      data: genderDistribution.map((item) => item.value),
                      backgroundColor: ["#16A34A", "#F59E0B", "#DC2626", "#6B7280", "#8B5CF6"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Marital Status Distribution</h3>
            <div className="h-72 mt-3">
              <Bar
                data={{
                  labels: maritalStatusMix.map((item) => item.label),
                  datasets: [
                    {
                      label: "Members",
                      data: maritalStatusMix.map((item) => item.value),
                      backgroundColor: "#0EA5E9",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 lg:col-span-3 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              Demographic visibility is strongest when DOB and gender are complete; unknown entries
              indicate profile update needs.
            </p>
            <p>
              Use age and gender mix to tailor programs for youth, adults, families, and targeted
              discipleship tracks.
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "4. Pastoral Care & Welfare Needs") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Pastoral Care Signals</h3>
            <p className="text-xs text-gray-600 mb-3">
              Derived from marital status and employment status.
            </p>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: ["Vulnerable marital segment", "Unemployed"],
                  datasets: [
                    {
                      label: "Members",
                      data: [pastoralCareSignals.vulnerableMarital, pastoralCareSignals.unemployed],
                      backgroundColor: ["#F59E0B", "#DC2626"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              {numberFormatter.format(pastoralCareSignals.vulnerableMarital)} members are in marital categories that may need closer pastoral coverage.
            </p>
            <p>
              {numberFormatter.format(pastoralCareSignals.unemployed)} members report unemployment status, indicating welfare and support attention.
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "5. Ministry Workforce Strength") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Department Coverage</h3>
            <div className="h-64 mt-3">
              <Doughnut
                data={{
                  labels: ["With department", "Without department"],
                  datasets: [
                    {
                      data: [
                        departmentParticipation.withDepartment,
                        departmentParticipation.withoutDepartment,
                      ],
                      backgroundColor: ["#16A34A", "#CBD5E1"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Workforce Strength</h3>
            <p>
              Ministry workers: <span className="font-semibold">{numberFormatter.format(ministryWorkerCount)}</span>
            </p>
            <p>
              Worker-to-member ratio: <span className="font-semibold">{churchEngagementRate.toFixed(1)}%</span>
            </p>
            <p>
              Department gap count: <span className="font-semibold">{numberFormatter.format(departmentParticipation.withoutDepartment)}</span>
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "6. Onboarding Effectiveness") {
      return (
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Onboarding Pipeline (Date Joined + Status + Department)</h3>
            <p className="text-xs text-gray-600 mb-3">
              New members are based on `date_joined` in last 90 days. Retention uses status (confirmed + functional).
            </p>
            <div className="h-72">
              <Bar
                data={{
                  labels: ["Unconfirmed", "Confirmed", "Functional member"],
                  datasets: [
                    {
                      label: "New + department",
                      data: [
                        onboardingStack.UNCONFIRMED.newWithDepartment,
                        onboardingStack.CONFIRMED.newWithDepartment,
                        onboardingStack.MEMBER.newWithDepartment,
                      ],
                      backgroundColor: "#0EA5E9",
                      stack: "new",
                    },
                    {
                      label: "New + no department",
                      data: [
                        onboardingStack.UNCONFIRMED.newWithoutDepartment,
                        onboardingStack.CONFIRMED.newWithoutDepartment,
                        onboardingStack.MEMBER.newWithoutDepartment,
                      ],
                      backgroundColor: "#67E8F9",
                      stack: "new",
                    },
                    {
                      label: "Old + department",
                      data: [
                        onboardingStack.UNCONFIRMED.oldWithDepartment,
                        onboardingStack.CONFIRMED.oldWithDepartment,
                        onboardingStack.MEMBER.oldWithDepartment,
                      ],
                      backgroundColor: "#2563EB",
                      stack: "old",
                    },
                    {
                      label: "Old + no department",
                      data: [
                        onboardingStack.UNCONFIRMED.oldWithoutDepartment,
                        onboardingStack.CONFIRMED.oldWithoutDepartment,
                        onboardingStack.MEMBER.oldWithoutDepartment,
                      ],
                      backgroundColor: "#93C5FD",
                      stack: "old",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-primary">Visitor Cycle: Visitor to Member</h3>
              <p className="text-xs text-gray-600 mb-3">
                Tracks how many visitors eventually become members.
              </p>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ["Total visitors", "Converted to members"],
                    datasets: [
                      {
                        label: "People",
                        data: [visitorFunnel.totalVisitors, visitorFunnel.converted],
                        backgroundColor: ["#94A3B8", "#16A34A"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-primary">Member Lifecycle</h3>
              <p className="text-xs text-gray-600 mb-3">
                Lifecycle progression: unconfirmed to confirmed to functional member.
              </p>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ["Unconfirmed", "Confirmed", "Functional"],
                    datasets: [
                      {
                        label: "Members",
                        data: [statusCounts.UNCONFIRMED, statusCounts.CONFIRMED, statusCounts.MEMBER],
                        backgroundColor: ["#F59E0B", "#2563EB", "#16A34A"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold text-primary">Member to Worker Cycle</h3>
              <p className="text-xs text-gray-600 mb-3">
                Shows how many members are currently serving as ministry workers.
              </p>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ["Total members", "Ministry workers"],
                    datasets: [
                      {
                        label: "Members",
                        data: [filteredMembers.length, ministryWorkerCount],
                        backgroundColor: ["#CBD5E1", "#0EA5E9"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              Onboarding retention (90 days):{" "}
              <span className="font-semibold">{onboardingRetentionRate.toFixed(1)}%</span>.
              Retention is based on new members moving into confirmed or functional status.
            </p>
            <p>
              Visitor-to-member conversion is{" "}
              <span className="font-semibold">
                {toPercent(visitorFunnel.converted, visitorFunnel.totalVisitors || 1).toFixed(1)}%
              </span>{" "}
              and member-to-worker conversion is{" "}
              <span className="font-semibold">{churchEngagementRate.toFixed(1)}%</span>.
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "7. Geographic & Outreach Insights") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Top Countries</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: locationBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      label: "Members",
                      data: locationBreakdown.map((item) => item.value),
                      backgroundColor: "#10B981",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Online vs In-house Reach</h3>
            <div className="h-64 mt-3">
              <Doughnut
                data={{
                  labels: ["Online", "In-house"],
                  datasets: [
                    {
                      data: [membershipTypeSplit.online, membershipTypeSplit.inHouse],
                      backgroundColor: ["#6366F1", "#F97316"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "8. Data Quality & Admin Maturity") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Data Quality Score</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: [
                    "Profile completeness",
                    "Email collisions",
                    "Phone collisions",
                    "Name collisions",
                  ],
                  datasets: [
                    {
                      label: "Score / count",
                      data: [
                        Number(profileCompletenessScore.toFixed(1)),
                        dataCollisions.email,
                        dataCollisions.phone,
                        dataCollisions.name,
                      ],
                      backgroundColor: ["#2563EB", "#DC2626", "#F59E0B", "#8B5CF6"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-primary">Executive Insight</h3>
            <p>
              Profile completeness: <span className="font-semibold">{profileCompletenessScore.toFixed(1)}%</span>
            </p>
            <p>
              Total collision signals: <span className="font-semibold">{numberFormatter.format(dataCollisions.email + dataCollisions.phone + dataCollisions.name)}</span>
            </p>
            <p>
              Better data quality improves care decisions, outreach planning, and dashboard trust.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="font-semibold text-primary">Member Lifecycle</h3>
          <p className="text-xs text-gray-600 mb-3">
            Lifecycle progression from unconfirmed to confirmed to functional member.
          </p>
          <div className="h-72">
            <Bar
              data={{
                labels: ["Unconfirmed", "Confirmed", "Functional member"],
                datasets: [
                  {
                    label: "Members",
                    data: [statusCounts.UNCONFIRMED, statusCounts.CONFIRMED, statusCounts.MEMBER],
                    backgroundColor: ["#F59E0B", "#2563EB", "#16A34A"],
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-primary">Lifecycle Insight</h3>
          <p>
            Confirmed-to-unconfirmed ratio: <span className="font-semibold">{lifecycleRateSummary.unconfirmedToConfirmed.toFixed(1)}%</span>
          </p>
          <p>
            Functional-to-confirmed ratio: <span className="font-semibold">{lifecycleRateSummary.confirmedToFunctional.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Membership Analytics"
          subtitle="Growth, church engagement, pastoral care, onboarding, and lifecycle insights"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          extra={
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Membership type</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={membershipTypeFilter}
                  onChange={(event) => setMembershipTypeFilter(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="ONLINE">Online</option>
                  <option value="IN_HOUSE">In-house</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Department</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="rounded-xl border bg-white p-2">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`px-3 py-2 rounded-md whitespace-nowrap text-sm transition ${
                  activeSection === section
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-primary hover:bg-gray-100"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {sectionContent()}

        <AnalyticsContractsPanel contract={membershipContract} />

        {membersError ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load one or more membership datasets. Some charts may be partial.
          </div>
        ) : null}

        {membersLoading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading membership analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default MembershipAnalytics;
