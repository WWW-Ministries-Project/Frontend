import {
  IMembersForm,
  MembersForm,
} from "@/pages/HomePage/pages/Members/Components/MembersForm";
import type { SoulWonListType } from "@/utils/api/lifeCenter/interfaces";
import type { MembersType } from "@/utils/api/members/interfaces";
import type { VisitorType } from "@/utils/api/visitors/interfaces";
import { relativePath } from "@/utils/const";
import { formatPhoneNumber } from "@/utils/helperFunctions";

/* -------------------------------------------------------------------------- */
/*                                    Paths                                   */
/* -------------------------------------------------------------------------- */

const managerBase = `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.management.main}`;

export const memberManagePath = `${relativePath.home.main}/${relativePath.home.members.manage}`;
export const visitorMembershipPath = `${managerBase}/${relativePath.home.membership.management.visitorToMembership}`;
export const soulwonMembershipPath = `${managerBase}/${relativePath.home.membership.management.soulwonToMembership}`;

/* -------------------------------------------------------------------------- */
/*                                   Members                                  */
/* -------------------------------------------------------------------------- */

/** A `user/list-users` row, with the extra fields the list endpoint returns. */
export type ManagerMember = MembersType & {
  date_joined?: string | null;
  member_since?: string | null;
  department_names?: string[];
  department_positions?: { department_id?: number | null }[];
};

export const memberDisplayName = (member: MembersType): string =>
  `${member.title || ""} ${member.name || ""}`.trim() || "No name";

/** Functional members serve in a department. */
export const memberHasDepartment = (member: ManagerMember): boolean =>
  Boolean(
    member.department_id ||
      member.department_name ||
      (member.department_positions ?? []).some((row) => row?.department_id)
  );

/**
 * When the member entered their current stage: `confirmed_at` for confirmed
 * members. Unconfirmed members (and confirmed ones from before the backend
 * recorded it) fall back to the date they joined.
 */
export const memberStageSince = (member: ManagerMember): string | null =>
  (member.status === "CONFIRMED" ? member.confirmed_at : null) ||
  member.date_joined ||
  member.member_since ||
  member.created_at ||
  null;

export const phoneLabel = (countryCode?: string | null, number?: string | null) => {
  if (!number) return "—";
  const formatted = formatPhoneNumber(countryCode || "", number);
  return formatted !== "-" ? formatted : [countryCode, number].filter(Boolean).join(" ");
};

export const matchesQuery = (query: string, values: (string | null | undefined)[]) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(needle));
};

export const errorText = (error: unknown, fallback: string): string => {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  if (response?.data?.message) return response.data.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/* -------------------------------------------------------------------------- */
/*                                  Visitors                                  */
/* -------------------------------------------------------------------------- */

type VisitorWithMemberLink = VisitorType & {
  member_id?: string;
  memberId?: string;
  linked_member_id?: string;
};

export const getVisitorMemberLinkId = (visitor: VisitorType): string | null => {
  const linked = visitor as VisitorWithMemberLink;
  return linked.member_id || linked.memberId || linked.linked_member_id || null;
};

export const extractVisitors = (source: unknown): VisitorType[] => {
  let current = source;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(current)) return current as VisitorType[];
    if (current && typeof current === "object" && "data" in current) {
      current = (current as { data?: unknown }).data;
      continue;
    }
    break;
  }
  return [];
};

export const buildVisitorPrefillForm = (visitor: VisitorType): IMembersForm => ({
  ...MembersForm.initialValues,
  personal_info: {
    ...MembersForm.initialValues.personal_info,
    title: visitor.title || "",
    first_name: visitor.firstName || "",
    other_name: visitor.otherName || "",
    last_name: visitor.lastName || "",
    gender: visitor.gender || "",
    marital_status: visitor.marital_status || "",
    nationality: visitor.nationality || "",
    has_children: false,
  },
  picture: {
    ...MembersForm.initialValues.picture,
  },
  contact_info: {
    ...MembersForm.initialValues.contact_info,
    email: visitor.email || "",
    resident_country: visitor.country || "",
    state_region: visitor.state || "",
    city: visitor.city || "",
    phone: {
      country_code:
        visitor.country_code ||
        MembersForm.initialValues.contact_info.phone.country_code,
      number: visitor.phone || "",
    },
  },
  work_info: {
    ...MembersForm.initialValues.work_info,
  },
  emergency_contact: {
    ...MembersForm.initialValues.emergency_contact,
    phone: {
      country_code:
        MembersForm.initialValues.emergency_contact.phone?.country_code ?? "",
      number: MembersForm.initialValues.emergency_contact.phone?.number ?? "",
    },
  },
  church_info: {
    ...MembersForm.initialValues.church_info,
    membership_type: "IN_HOUSE",
  },
  department_positions: [],
  family: [],
});

export const visitorSourceLabel = (visitor: VisitorType): string => {
  const name = [visitor.firstName, visitor.lastName].filter(Boolean).join(" ").trim();
  return name ? `${name} (visitor)` : `Visitor ${visitor.id}`;
};

/* -------------------------------------------------------------------------- */
/*                                 Souls won                                  */
/* -------------------------------------------------------------------------- */

export type SoulwonRecord = SoulWonListType & {
  gender?: string | null;
  lifeCenterName: string;
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";
const normalizePhone = (value?: string | null) => value?.replace(/\D/g, "") ?? "";
const phoneCandidates = (value?: string | null) => {
  const normalized = normalizePhone(value);
  return Array.from(
    new Set([normalized, normalized.slice(-10), normalized.slice(-9)].filter(Boolean))
  );
};

export const soulCountryCode = (record: SoulWonListType) =>
  record.country_code || MembersForm.initialValues.contact_info.phone.country_code;

/**
 * Records already tied to a member — linked on the record itself, or matching a
 * member by email or phone — are treated as converted.
 */
export const unconvertedSouls = (
  records: SoulwonRecord[],
  members: MembersType[]
): SoulwonRecord[] => {
  const byEmail = new Set<string>();
  const byPhone = new Set<string>();
  members.forEach((member) => {
    const email = normalizeEmail(member.email);
    if (email) byEmail.add(email);
    phoneCandidates(member.primary_number).forEach((candidate) => byPhone.add(candidate));
  });

  return records.filter((record) => {
    if (record.member?.id || record.memberId || record.isMember) return false;
    const email = normalizeEmail(record.contact_email);
    if (email && byEmail.has(email)) return false;
    return !phoneCandidates(record.contact_number).some((candidate) =>
      byPhone.has(candidate)
    );
  });
};

export const buildSoulPrefillForm = (record: SoulwonRecord): IMembersForm => ({
  ...MembersForm.initialValues,
  personal_info: {
    ...MembersForm.initialValues.personal_info,
    title: record.title || "",
    first_name: record.first_name || "",
    other_name: record.other_name || "",
    last_name: record.last_name || "",
    nationality: record.country || "",
    has_children: false,
  },
  picture: {
    ...MembersForm.initialValues.picture,
  },
  contact_info: {
    ...MembersForm.initialValues.contact_info,
    email: record.contact_email || "",
    resident_country: record.country || "",
    city: record.city || "",
    phone: {
      country_code: soulCountryCode(record),
      number: record.contact_number || "",
    },
  },
  work_info: {
    ...MembersForm.initialValues.work_info,
  },
  emergency_contact: {
    ...MembersForm.initialValues.emergency_contact,
    phone: {
      country_code:
        MembersForm.initialValues.emergency_contact.phone?.country_code ?? "",
      number: MembersForm.initialValues.emergency_contact.phone?.number ?? "",
    },
  },
  church_info: {
    membership_type: "IN_HOUSE",
    member_since: record.date_won ? record.date_won.split("T")[0] : undefined,
  },
  is_user: false,
  department_positions: [],
  family: [],
});

/** Today as YYYY-MM-DD in local time, for date inputs. */
export const todayInputValue = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
