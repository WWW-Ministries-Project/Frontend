import { DateTime } from "luxon";

import { MembersType } from "@/utils";
import { SoulWonListType } from "@/utils/api/lifeCenter/interfaces";
import { VisitorType } from "@/utils/api/visitors/interfaces";
import { toDateTime } from "@/pages/HomePage/pages/Analytics/utils";

/**
 * Member rows from `user/list-users`. The endpoint flattens `user_info` onto
 * the row, so besides `MembersType` (which includes gender, city,
 * state_region, nationality, has_emergency_contact, children_count,
 * confirmed_at and functional_at) it carries: country, member_since,
 * date_of_birth, marital_status, employment_status, date_joined,
 * department_names, department_positions[{department_id, department_name,
 * position_id, position_name}], position{id,name}.
 * It does NOT return School of Ministry enrolment.
 */
export type MemberRecord = MembersType & Record<string, unknown>;

export const safeString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

export const safeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    return ["true", "yes", "1"].includes(normalized);
  }
  return false;
};

export type MemberStatus = "UNCONFIRMED" | "CONFIRMED" | "MEMBER";

export const normalizeStatus = (value: unknown): MemberStatus => {
  const normalized = safeString(value).toUpperCase();
  if (normalized === "MEMBER") return "MEMBER";
  if (normalized === "CONFIRMED") return "CONFIRMED";
  return "UNCONFIRMED";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isSoulWonMemberLinked = (soul: SoulWonListType) =>
  safeBoolean(soul.isMember) || Boolean(soul.memberId) || Boolean(soul.member?.id);

export const extractVisitors = (source: unknown): VisitorType[] => {
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

export const getMemberJoinDate = (member: MemberRecord): string => {
  return (
    safeString(member.date_joined) ||
    safeString(member.member_since) ||
    safeString(member.created_at)
  );
};

/** All departments a member serves in (primary + department_positions). */
export const getMemberDepartments = (member: MemberRecord) => {
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

/** Position names held across all departments. */
export const getMemberPositions = (member: MemberRecord): string[] => {
  if (!Array.isArray(member.department_positions)) return [];
  return member.department_positions
    .map((entry) => (isRecord(entry) ? safeString(entry.position_name) : ""))
    .filter(Boolean);
};

export const getAge = (member: MemberRecord): number | null => {
  const birthDate = toDateTime(
    safeString(member.date_of_birth) || safeString(member.dob) || safeString(member.birth_date)
  );
  if (!birthDate) return null;

  const today = DateTime.now();
  let age = today.year - birthDate.year;
  const monthDiff = today.month - birthDate.month;
  if (monthDiff < 0 || (monthDiff === 0 && today.day < birthDate.day)) age -= 1;

  if (age < 0 || age > 120) return null;
  return age;
};

export const MARITAL_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOW: "Widow",
  WIDOWER: "Widower",
};

export const getMaritalStatus = (member: MemberRecord) =>
  safeString(member.marital_status).toUpperCase();

export const isWidowed = (member: MemberRecord) =>
  ["WIDOW", "WIDOWER", "WIDOWED"].includes(getMaritalStatus(member));

export const EMPLOYMENT_LABELS: Record<string, string> = {
  student: "Student",
  employed: "Employed",
  self_employed: "Self-employed",
  unemployed: "Unemployed",
  retired: "Retired",
};

export const getEmploymentStatus = (member: MemberRecord) =>
  safeString(member.employment_status).toLowerCase();

export const getGender = (member: MemberRecord) => safeString(member.gender).toLowerCase();

export const getChildrenCount = (member: MemberRecord) => {
  const value = Number(member.children_count);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const isSingleParent = (member: MemberRecord) =>
  getChildrenCount(member) > 0 && getMaritalStatus(member) !== "MARRIED";

/** Whole days from `from` to `to`, or null when either date is missing. */
export const daysBetween = (from: unknown, to: unknown): number | null => {
  const start = toDateTime(safeString(from));
  const end = toDateTime(safeString(to));
  if (!start || !end) return null;
  return Math.max(0, Math.round(end.diff(start, "days").days));
};

export const isOutsideGhana = (member: MemberRecord) => {
  const country = safeString(member.country).toLowerCase();
  return Boolean(country) && country !== "ghana" && country !== "gh";
};

/** Years since the member joined (fractional). */
export const getTenureYears = (member: MemberRecord): number | null => {
  const joined = toDateTime(getMemberJoinDate(member));
  if (!joined) return null;
  return Math.max(0, DateTime.now().diff(joined, "days").days / 365.25);
};

export const daysSinceJoined = (member: MemberRecord): number | null => {
  const joined = toDateTime(getMemberJoinDate(member));
  if (!joined) return null;
  return Math.floor(DateTime.now().diff(joined, "days").days);
};

export const pct = (part: number, total: number) =>
  total ? `${Math.round((part * 100) / total)}%` : "0%";

export const DATA_QUALITY_FIELDS: { label: string; has: (m: MemberRecord) => boolean }[] = [
  { label: "Email", has: (m) => Boolean(safeString(m.email)) },
  { label: "Phone number", has: (m) => Boolean(safeString(m.primary_number)) },
  { label: "Date of birth", has: (m) => Boolean(safeString(m.date_of_birth)) },
  { label: "Emergency contact", has: (m) => m.has_emergency_contact === true },
  { label: "Employment / schooling", has: (m) => Boolean(getEmploymentStatus(m)) },
  { label: "City", has: (m) => Boolean(safeString(m.city)) },
  { label: "Marital status", has: (m) => Boolean(getMaritalStatus(m)) },
  { label: "Photo", has: (m) => Boolean(safeString(m.photo)) },
];
