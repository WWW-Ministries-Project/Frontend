import { DateTime } from "luxon";

import { Department } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { SoulWonListType } from "@/utils/api/lifeCenter/interfaces";
import { VisitorType } from "@/utils/api/visitors/interfaces";
import { toDateTime } from "@/pages/HomePage/pages/Analytics/utils";

import {
  BAR_WARNING,
  BarItem,
  buildBars,
  buildColumns,
  buildFunnel,
  ColumnItem,
  FollowUpItem,
} from "./chartBuilders";
import {
  DATA_QUALITY_FIELDS,
  daysBetween,
  daysSinceJoined,
  EMPLOYMENT_LABELS,
  getAge,
  getChildrenCount,
  getEmploymentStatus,
  getGender,
  getMaritalStatus,
  getMemberDepartments,
  getMemberJoinDate,
  getMemberPositions,
  getTenureYears,
  isOutsideGhana,
  isSingleParent,
  isSoulWonMemberLinked,
  isWidowed,
  MARITAL_LABELS,
  MemberRecord,
  normalizeStatus,
  pct,
  safeBoolean,
  safeString,
} from "./memberAnalyticsData";

export const ANALYTICS_SECTIONS = [
  { key: "growth", label: "Growth & health", desc: "Membership size, new members and status mix" },
  { key: "engagement", label: "Engagement", desc: "Serving, departments and School of Ministry" },
  { key: "demographics", label: "Demographics", desc: "Age, gender and household make-up" },
  { key: "care", label: "Pastoral care", desc: "Members who may need welfare or follow-up" },
  { key: "workforce", label: "Ministry workforce", desc: "Workers, heads and department coverage" },
  { key: "onboarding", label: "Onboarding", desc: "How quickly new members settle in" },
  { key: "geography", label: "Geography", desc: "Where members live and worship from" },
  { key: "quality", label: "Data quality", desc: "How complete member records are" },
  { key: "lifecycle", label: "Lifecycle", desc: "Tenure and movement through the journey" },
] as const;

export type AnalyticsSectionKey = (typeof ANALYTICS_SECTIONS)[number]["key"];

export interface KpiSpec {
  label: string;
  value: string;
  sub?: string;
}

export type ChartSpec =
  | { kind: "trend" }
  | { kind: "bar"; title: string; sub: string; items: BarItem[] }
  | { kind: "col"; title: string; sub: string; items: ColumnItem[] }
  | { kind: "list"; title: string; sub: string; items: FollowUpItem[] }
  | { kind: "missing"; title: string; sub: string; note: string };

export interface SectionContext {
  /** Members in view: date range + type + department + included scope. */
  members: MemberRecord[];
  /** Type + department + scope, ignoring the date range. */
  baseMembers: MemberRecord[];
  /** Date range + type + department, ignoring the active/inactive scope. */
  membersAnyScope: MemberRecord[];
  /** All loaded records filtered by membership type only. */
  allOfType: MemberRecord[];
  scope: "active" | "all";
  visitors: VisitorType[];
  soulsWon: SoulWonListType[];
  departments: Department[];
  pendingJoinRequests: number | null;
  /** Year the period ends in. */
  year: number;
  openMember: (id: number | string) => void;
}

const NOT_TRACKED = "Not tracked yet";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STAGE_LABELS: [string, string][] = [
  ["UNCONFIRMED", "Unconfirmed"],
  ["CONFIRMED", "Confirmed"],
  ["MEMBER", "Functional member"],
];
const AGE_BANDS = ["Under 25", "25–34", "35–44", "45–59", "60 and over"];
const ageBand = (age: number) =>
  age < 25 ? "Under 25" : age < 35 ? "25–34" : age < 45 ? "35–44" : age < 60 ? "45–59" : "60 and over";
const TENURE_BANDS = ["Under 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"];
const tenureBand = (years: number) =>
  years < 1
    ? "Under 1 year"
    : years < 3
    ? "1–3 years"
    : years < 5
    ? "3–5 years"
    : years < 10
    ? "5–10 years"
    : "10+ years";

const count = <T,>(list: T[], fn: (item: T) => boolean) => list.filter(fn).length;

const groupCounts = (list: MemberRecord[], keyOf: (m: MemberRecord) => string[] | string) => {
  const map = new Map<string, number>();
  list.forEach((member) => {
    ([] as string[]).concat(keyOf(member)).forEach((key) => {
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    });
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
};

const joinYearMonth = (member: MemberRecord) => {
  const joined = toDateTime(getMemberJoinDate(member));
  return joined ? { year: joined.year, month: joined.month } : null;
};

const isWorker = (member: MemberRecord) => safeBoolean(member.is_user);
const isOpen = (department: Department) => (department.status ?? "OPEN") === "OPEN";

const memberName = (member: MemberRecord) => safeString(member.name) || "Unnamed member";

const averageDays = (values: number[]) =>
  values.length
    ? `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)} days`
    : "—";

export const buildSection = (
  key: AnalyticsSectionKey,
  ctx: SectionContext
): { kpis: KpiSpec[]; charts: ChartSpec[] } => {
  const L = ctx.members;
  const n = L.length;
  const cnt = (fn: (m: MemberRecord) => boolean) => count(L, fn);

  if (key === "growth") {
    const newIn = (year: number) =>
      count(ctx.baseMembers, (m) => joinYearMonth(m)?.year === year);
    const thisYear = newIn(ctx.year);
    const lastYear = newIn(ctx.year - 1);
    const functional = cnt((m) => normalizeStatus(m.status) === "MEMBER");
    const visitors = ctx.visitors.length;
    const interested = count(ctx.visitors, (v) => Boolean(v.membershipWish) || Boolean(v.is_member));
    const converted = count(ctx.visitors, (v) => Boolean(v.is_member));
    const souls = ctx.soulsWon.length;
    const soulsConverted = count(ctx.soulsWon, isSoulWonMemberLinked);
    return {
      kpis: [
        {
          label: "Members",
          value: String(n),
          sub: `${cnt((m) => safeString(m.membership_type).toUpperCase() === "IN_HOUSE")} in person · ${cnt(
            (m) => safeString(m.membership_type).toUpperCase() === "ONLINE"
          )} online`,
        },
        {
          label: `New in ${ctx.year}`,
          value: String(thisYear),
          sub: lastYear
            ? `${thisYear >= lastYear ? "+" : ""}${Math.round(((thisYear - lastYear) * 100) / lastYear)}% vs ${ctx.year - 1}`
            : `None in ${ctx.year - 1}`,
        },
        { label: "Functional members", value: pct(functional, n), sub: `${functional} members` },
        {
          label: "Inactive",
          value: String(count(ctx.membersAnyScope, (m) => m.is_active === false)),
          sub: ctx.scope === "all" ? "Included in this view" : "Excluded from this view",
        },
      ],
      charts: [
        { kind: "trend" },
        {
          kind: "bar",
          title: "Membership status",
          sub: "Where members are in the journey",
          items: buildBars(
            STAGE_LABELS.map(([status, label]) => [label, cnt((m) => normalizeStatus(m.status) === status)]),
            n
          ),
        },
        {
          kind: "bar",
          title: "Visitor to member",
          sub: visitors
            ? `Visitor-to-member conversion is ${pct(converted, visitors)} for visitors first seen in this period`
            : "No visitors first seen in this period",
          items: buildFunnel([
            ["Visitors", visitors],
            ["Interested in membership", interested],
            ["Converted to members", converted],
          ]),
        },
        {
          kind: "bar",
          title: "Soulwon to member",
          sub: souls
            ? `Soulwon-to-member conversion is ${pct(soulsConverted, souls)} for souls won in this period`
            : "No souls won in this period",
          items: buildFunnel([
            ["Souls won", souls],
            ["Converted to members", soulsConverted],
          ]),
        },
      ],
    };
  }

  if (key === "engagement") {
    const workers = L.filter(isWorker);
    const deptCount = (m: MemberRecord) => getMemberDepartments(m).length;
    const multi = cnt((m) => deptCount(m) > 1);
    const single = cnt((m) => deptCount(m) === 1);
    const deptNames = ctx.departments.length
      ? ctx.departments.map((d) => d.name)
      : Array.from(new Set(L.flatMap(getMemberDepartments)));
    const sizes = deptNames
      .map((name): [string, number] => [name, cnt((m) => getMemberDepartments(m).includes(name))])
      .sort((a, b) => b[1] - a[1]);
    return {
      kpis: [
        { label: "Ministry workers", value: String(workers.length), sub: `${pct(workers.length, n)} of members` },
        { label: "In School of Ministry", value: "—", sub: NOT_TRACKED },
        { label: "Serving in 2+ departments", value: String(multi) },
        {
          label: "Avg departments per worker",
          value: workers.length
            ? (workers.reduce((sum, m) => sum + deptCount(m), 0) / workers.length).toFixed(1)
            : "0",
        },
      ],
      charts: [
        {
          kind: "bar",
          title: "Department sizes",
          sub: "Members serving in each department",
          items: buildBars(
            sizes.map(([name, value]): [string, number, string?] => [name, value, value === 0 ? "none" : undefined]),
            n
          ),
        },
        {
          kind: "bar",
          title: "How members take part",
          sub: "Share of members",
          items: buildBars(
            [
              ["Serving in 2+ departments", multi],
              ["Serving in 1 department", single],
              ["Not serving yet", n - multi - single],
            ],
            n
          ),
        },
      ],
    };
  }

  if (key === "demographics") {
    const ages = L.map(getAge).filter((age): age is number => age !== null).sort((a, b) => a - b);
    const female = cnt((m) => getGender(m) === "female");
    const male = cnt((m) => getGender(m) === "male");
    const children = L.reduce((sum, m) => sum + getChildrenCount(m), 0);
    const households = cnt((m) => getChildrenCount(m) > 0);
    return {
      kpis: [
        {
          label: "Median age",
          value: ages.length ? String(ages[Math.floor(ages.length / 2)]) : "—",
          sub: ages.length ? `Range ${ages[0]}–${ages[ages.length - 1]}` : "No dates of birth recorded",
        },
        { label: "Female", value: pct(female, n), sub: `${female} members` },
        { label: "Male", value: pct(male, n), sub: `${male} members` },
        {
          label: "Children recorded",
          value: String(children),
          sub: `${households} ${households === 1 ? "household" : "households"}`,
        },
      ],
      charts: [
        {
          kind: "bar",
          title: "Age groups",
          sub: `From date of birth · ${ages.length} of ${n} members recorded`,
          items: buildBars(
            AGE_BANDS.map((band) => [band, count(ages, (age) => ageBand(age) === band)]),
            n
          ),
        },
        {
          kind: "bar",
          title: "Marital status",
          sub: "Members with a marital status recorded",
          items: buildBars(
            Object.entries(MARITAL_LABELS)
              .map(([status, label]): [string, number] => [label, cnt((m) => getMaritalStatus(m) === status)])
              .filter((entry) => entry[1] > 0),
            n
          ),
        },
      ],
    };
  }

  if (key === "care") {
    const reasons = (m: MemberRecord) => {
      const out: string[] = [];
      const age = getAge(m);
      if (age !== null && age >= 60) out.push(`Senior (${age})`);
      if (isWidowed(m)) out.push("Widowed");
      if (getEmploymentStatus(m) === "unemployed") out.push("Unemployed");
      if (m.is_active === false) out.push("Inactive");
      return out;
    };
    const flagged = L.filter((m) => !m.is_restricted)
      .map((m) => ({ m, r: reasons(m) }))
      .filter((entry) => entry.r.length > 0)
      .sort((a, b) => b.r.length - a.r.length);
    return {
      kpis: [
        { label: "Seniors (60+)", value: String(cnt((m) => (getAge(m) ?? 0) >= 60)) },
        { label: "Widowed", value: String(cnt(isWidowed)) },
        { label: "Unemployed", value: String(cnt((m) => getEmploymentStatus(m) === "unemployed")) },
        { label: "Single parents", value: String(cnt(isSingleParent)) },
      ],
      charts: [
        {
          kind: "bar",
          title: "Employment status",
          sub: "Current work or schooling",
          items: buildBars(
            groupCounts(L, (m) => {
              const status = getEmploymentStatus(m);
              return status ? EMPLOYMENT_LABELS[status] ?? status : "Not recorded";
            }),
            n
          ),
        },
        {
          kind: "list",
          title: "Suggested follow-ups",
          sub: "Members the welfare team may want to check on",
          items: flagged.slice(0, 6).map(({ m, r }) => ({
            key: String(m.id),
            label: memberName(m),
            sub: r.join(" · "),
            onClick: () => ctx.openMember(m.id),
          })),
        },
      ],
    };
  }

  if (key === "workforce") {
    const open = ctx.departments.filter(isOpen);
    const sizeOf = (d: Department) =>
      typeof d.member_count === "number"
        ? d.member_count
        : count(ctx.allOfType, (m) => getMemberDepartments(m).includes(d.name));
    const positions = groupCounts(L, getMemberPositions);
    return {
      kpis: [
        { label: "Ministry workers", value: String(cnt(isWorker)) },
        {
          label: "Departments without a head",
          value: String(count(open, (d) => !d.department_head && !d.department_head_info)),
          sub: `${open.length} open departments`,
        },
        {
          label: "Departments under 3 members",
          value: String(count(open, (d) => sizeOf(d) < 3)),
          sub: "May need recruiting",
        },
        {
          label: "Pending join requests",
          value: ctx.pendingJoinRequests === null ? "—" : String(ctx.pendingJoinRequests),
        },
      ],
      charts: [
        {
          kind: "bar",
          title: "Workers per department",
          sub: "Open and closed departments",
          items: buildBars(
            ctx.departments
              .map((d): [string, number] => [
                `${d.name}${isOpen(d) ? "" : " (closed)"}`,
                cnt((m) => getMemberDepartments(m).includes(d.name)),
              ])
              .sort((a, b) => b[1] - a[1]),
            n
          ),
        },
        {
          kind: "bar",
          title: "Positions held",
          sub: "Across all departments",
          items: buildBars(
            positions.map(([label, value]): [string, number, false] => [label, value, false]),
            n
          ),
        },
      ],
    };
  }

  if (key === "onboarding") {
    const now = DateTime.now();
    const lastMonth = ctx.year === now.year ? now.month : 12;
    const joinedAfterVisiting = cnt((m) => m.from_visitor === true);
    // Stage dates are only recorded from the backend change onwards, so
    // members without them are left out of the averages.
    const toConfirmation = L.map((m) =>
      m.confirmed_at ? daysBetween(getMemberJoinDate(m), m.confirmed_at) : null
    ).filter((days): days is number => days !== null);
    const toFunctional = L.map((m) =>
      m.confirmed_at && m.functional_at ? daysBetween(m.confirmed_at, m.functional_at) : null
    ).filter((days): days is number => days !== null);
    return {
      kpis: [
        {
          label: "Avg time to confirmation",
          value: averageDays(toConfirmation),
          sub: `${toConfirmation.length} ${toConfirmation.length === 1 ? "member" : "members"}`,
        },
        { label: "Avg time to functional", value: averageDays(toFunctional), sub: "After confirmation" },
        {
          label: "Unconfirmed over 30 days",
          value: String(
            cnt((m) => normalizeStatus(m.status) === "UNCONFIRMED" && (daysSinceJoined(m) ?? 0) > 30)
          ),
          sub: "Follow up on the class",
        },
        {
          label: "Joined after visiting",
          value: pct(joinedAfterVisiting, n),
          sub: `${joinedAfterVisiting} ${joinedAfterVisiting === 1 ? "member" : "members"}`,
        },
      ],
      charts: [
        {
          kind: "bar",
          title: "Journey funnel",
          sub: "Members reaching each stage",
          items: buildBars(
            [
              ["Registered", n, false],
              ["Confirmed or beyond", cnt((m) => normalizeStatus(m.status) !== "UNCONFIRMED")],
              ["Functional member", cnt((m) => normalizeStatus(m.status) === "MEMBER")],
            ],
            n
          ),
        },
        {
          kind: "col",
          title: `New members in ${ctx.year}`,
          sub: "By month joined",
          items: buildColumns(
            MONTHS.slice(0, lastMonth).map((label, index): [string, number] => [
              label,
              count(ctx.baseMembers, (m) => {
                const joined = joinYearMonth(m);
                return joined?.year === ctx.year && joined.month === index + 1;
              }),
            ])
          ),
        },
      ],
    };
  }

  if (key === "geography") {
    return {
      kpis: [
        {
          label: "Cities and towns",
          value: String(new Set(L.map((m) => safeString(m.city).toLowerCase()).filter(Boolean)).size),
        },
        {
          label: "Regions",
          value: String(
            new Set(L.map((m) => safeString(m.state_region).toLowerCase()).filter(Boolean)).size
          ),
        },
        {
          label: "Online members",
          value: pct(cnt((m) => safeString(m.membership_type).toUpperCase() === "ONLINE"), n),
          sub: "Worship through the e-church",
        },
        { label: "Living outside Ghana", value: String(cnt(isOutsideGhana)), sub: "From country of residence" },
      ],
      charts: [
        {
          kind: "bar",
          title: "City or town",
          sub: "Where members live",
          items: buildBars(groupCounts(L, (m) => safeString(m.city) || "Not recorded").slice(0, 8), n),
        },
        {
          kind: "bar",
          title: "Nationality",
          sub: "Members by nationality",
          items: buildBars(groupCounts(L, (m) => safeString(m.nationality) || "Not recorded"), n),
        },
      ],
    };
  }

  if (key === "quality") {
    const records = L.filter((m) => !m.is_restricted);
    const total = records.length;
    const missing = (m: MemberRecord) => DATA_QUALITY_FIELDS.filter((f) => !f.has(m)).map((f) => f.label);
    const completeness = (m: MemberRecord) =>
      Math.round(((DATA_QUALITY_FIELDS.length - missing(m).length) * 100) / DATA_QUALITY_FIELDS.length);
    const avg = total ? Math.round(records.reduce((sum, m) => sum + completeness(m), 0) / total) : 0;
    return {
      kpis: [
        { label: "Average completeness", value: `${avg}%`, sub: `${DATA_QUALITY_FIELDS.length} key fields checked` },
        {
          label: "Complete except photo",
          value: String(count(records, (m) => {
            const gaps = missing(m);
            return gaps.length === 1 && gaps[0] === "Photo";
          })),
        },
        {
          label: "Missing emergency contact",
          value: String(count(records, (m) => m.has_emergency_contact !== true)),
        },
        { label: "Missing employment info", value: String(count(records, (m) => !getEmploymentStatus(m))) },
      ],
      charts: [
        {
          kind: "bar",
          title: "Missing fields",
          sub: "Members without each field",
          items: buildBars(
            DATA_QUALITY_FIELDS.map((f): [string, number] => [f.label, count(records, (m) => !f.has(m))]).sort(
              (a, b) => b[1] - a[1]
            ),
            total,
            BAR_WARNING
          ),
        },
        {
          kind: "list",
          title: "Records to tidy",
          sub: "Most incomplete profiles first",
          items: records
            .map((m) => ({ m, gaps: missing(m) }))
            .filter((entry) => entry.gaps.length > 1)
            .sort((a, b) => b.gaps.length - a.gaps.length)
            .slice(0, 6)
            .map(({ m, gaps }) => ({
              key: String(m.id),
              label: memberName(m),
              sub: `Missing ${gaps.join(", ").toLowerCase()}`,
              onClick: () => ctx.openMember(m.id),
            })),
        },
      ],
    };
  }

  // lifecycle
  const tenures = L.map((m) => ({ m, t: getTenureYears(m) })).filter(
    (entry): entry is { m: MemberRecord; t: number } => entry.t !== null
  );
  const avgTenure = tenures.length
    ? (tenures.reduce((sum, entry) => sum + entry.t, 0) / tenures.length).toFixed(1)
    : "0";
  return {
    kpis: [
      { label: "Average tenure", value: `${avgTenure} yrs` },
      { label: "Members 10+ years", value: String(count(tenures, (entry) => entry.t >= 10)) },
      { label: "Joined in last 12 months", value: String(cnt((m) => (daysSinceJoined(m) ?? Infinity) <= 365)) },
      {
        label: "Inactive",
        value: String(count(ctx.allOfType, (m) => m.is_active === false)),
        sub: "Across all records",
      },
    ],
    charts: [
      {
        kind: "bar",
        title: "Tenure",
        sub: "Time since joining",
        items: buildBars(
          TENURE_BANDS.map((band) => [band, count(tenures, (entry) => tenureBand(entry.t) === band)]),
          n
        ),
      },
      {
        kind: "bar",
        title: "Stage by tenure",
        sub: "Functional members per tenure group",
        items: buildBars(
          TENURE_BANDS.map((band): [string, number, string] => {
            const group = tenures.filter((entry) => tenureBand(entry.t) === band);
            const functional = count(group, (entry) => normalizeStatus(entry.m.status) === "MEMBER");
            return [band, functional, group.length ? `${pct(functional, group.length)} of ${group.length}` : "none"];
          }),
          n
        ),
      },
    ],
  };
};
