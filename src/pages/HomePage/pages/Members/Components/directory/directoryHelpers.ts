import type { MemberExportRow } from "@/utils/api/members/membershipActions";
import type { MembersType } from "@/utils/api/members/interfaces";
import type { QueryType } from "@/utils/interfaces";

/** Row shape returned by `user/list-users` (flattened user + user_info). */
export type DirectoryMember = MembersType & {
  department_names?: string[] | null;
  department_positions?:
    | { department_id: number; department_name?: string | null }[]
    | null;
  date_joined?: string | null;
  member_since?: string | null;
};

export const PAGE_SIZE = 12;
/** Large page used to pull every matching row for Excel export. */
export const EXPORT_TAKE = 10000;

export type StatusTab = "ALL" | "UNCONFIRMED" | "CONFIRMED" | "MEMBER" | "INACTIVE";
export type SortKey = "name" | "newest" | "oldest";
export type ViewMode = "cards" | "table";

export const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UNCONFIRMED", label: "Unconfirmed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "MEMBER", label: "Functional" },
  { key: "INACTIVE", label: "Inactive" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name A–Z" },
  { value: "newest", label: "Newest members" },
  { value: "oldest", label: "Longest serving" },
];

/** Filters from the "Refine members" panel, kept in the URL. */
export interface DirectoryFilters {
  membership_type: string;
  is_user: string;
  department_id: string;
  is_active: string;
}

export const FILTER_KEYS: (keyof DirectoryFilters)[] = [
  "membership_type",
  "is_user",
  "department_id",
  "is_active",
];

export const parseStatusTab = (value: string | null): StatusTab => {
  const upper = (value || "").trim().toUpperCase();
  return STATUS_TABS.some((tab) => tab.key === upper) ? (upper as StatusTab) : "ALL";
};

export const parseSort = (value: string | null): SortKey =>
  value === "newest" || value === "oldest" ? value : "name";

/**
 * Builds the list-users query for a status tab. Status tabs count active
 * members only (Inactive = !is_active). Returns null when the tab contradicts
 * the Activity filter, which means "no rows" without asking the server.
 */
export const buildDirectoryQuery = (
  tab: StatusTab,
  filters: DirectoryFilters,
  search: string
): QueryType | null => {
  const query: QueryType = {};
  if (search) query.search = search;
  if (filters.membership_type) query.membership_type = filters.membership_type;
  if (filters.is_user) query.is_user = filters.is_user;
  if (filters.department_id) query.department_id = filters.department_id;

  const tabActive = tab === "ALL" ? "" : tab === "INACTIVE" ? "false" : "true";
  if (tabActive && filters.is_active && filters.is_active !== tabActive) return null;
  const isActive = tabActive || filters.is_active;
  if (isActive) query.is_active = isActive;
  if (tab === "UNCONFIRMED" || tab === "CONFIRMED" || tab === "MEMBER") {
    query.status = tab;
  }
  return query;
};

/**
 * Count for a status tab from `meta.status_counts`. The server counts ignore
 * the status and activity filters, so a tab that contradicts the Activity
 * filter shows 0. Returns null while counts are unknown.
 */
export const statusTabCount = (
  counts: Record<string, number> | undefined,
  tab: StatusTab,
  activity: string
): number | null => {
  if (!counts) return null;
  const active =
    (counts.UNCONFIRMED ?? 0) + (counts.CONFIRMED ?? 0) + (counts.MEMBER ?? 0);
  if (tab === "ALL") {
    if (activity === "true") return active;
    if (activity === "false") return counts.inactive ?? 0;
    return counts.all ?? 0;
  }
  if (tab === "INACTIVE") return activity === "true" ? 0 : counts.inactive ?? 0;
  return activity === "false" ? 0 : counts[tab] ?? 0;
};

export const joinedDate = (member: DirectoryMember) =>
  member.date_joined || member.member_since || member.created_at || null;

export const departmentNames = (member: DirectoryMember): string[] => {
  const names = Array.isArray(member.department_names)
    ? member.department_names.filter(Boolean)
    : [];
  if (names.length) return names;
  return member.department_name ? [member.department_name] : [];
};

export const membershipTypeLabel = (value?: string | null) =>
  value === "ONLINE" ? "Online" : "In person";

export const phoneLabel = (member: DirectoryMember) =>
  `${member.country_code ? `${member.country_code} ` : ""}${member.primary_number || ""}`.trim();

export const toExportRow = (member: DirectoryMember): MemberExportRow => ({
  member_id: member.member_id,
  name: member.name,
  email: member.email,
  phone: phoneLabel(member),
  membership_type: member.membership_type,
  status: member.status,
  is_active: member.is_active,
  is_user: member.is_user,
  departments: departmentNames(member).join(", "),
  date_joined: joinedDate(member)?.slice(0, 10) ?? "",
});

export const MASKED_VALUE = "••••••••";
