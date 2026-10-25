import {
  normalizePermissionPayload,
  resolvePermission,
  type ExclusionsMap,
  type PermissionMap,
  type PermissionValue,
  type ScopesMap,
} from "@/utils/accessControl";

import { NAV_GROUPS, type NavGroup } from "@/routes/sideNavGroups";

import type { AccessRight } from "./settingsInterfaces";

/**
 * Shared model for the Settings screens (General configuration, Access rights,
 * Users, Approvals): module catalogue, access levels, role presets and the
 * draft shape the role editor works on.
 */

export type ModuleGroup = NavGroup;

export interface SettingsModule {
  key: string;
  label: string;
  description: string;
  group: ModuleGroup;
  /** `excl`: can hide people's records; `scope`: can limit to own departments; `explicit`: never switched on by templates or "Set all". */
  extra?: "excl" | "scope" | "explicit";
  /** Why an explicit module needs a deliberate grant. */
  why?: string;
}

// Grouped and ordered like the icon rail (`SIDE_NAV_GROUPS`).
export const MODULES: SettingsModule[] = [
  { key: "Reports", label: "Reports", description: "Executive summary and department reports", group: "Overview" },
  { key: "Members", label: "Members", description: "Church family profiles and member management", group: "People", extra: "excl" },
  { key: "Membership_Management", label: "Membership management", description: "Membership pipelines, conversions and department join requests", group: "People" },
  { key: "Departments", label: "Departments and ministries", description: "Department and ministry structures, heads and setup", group: "People", extra: "scope" },
  { key: "Visitors", label: "Visitors", description: "Visitor records, follow-up and engagement tracking", group: "People" },
  { key: "Life Center", label: "Life centers", description: "Life center administration and souls-won data", group: "People" },
  { key: "Church_Attendance", label: "Church attendance", description: "Attendance sessions and records", group: "People", extra: "scope" },
  { key: "Events", label: "Events", description: "Event planning and participation records", group: "Engagement" },
  { key: "Theme", label: "Theme", description: "Communication themes and annual planning content", group: "Engagement" },
  { key: "Community", label: "Community", description: "Members’ feed, church messages and moderation of reported posts", group: "Engagement", extra: "explicit", why: "Viewing reveals the real authors of anonymous posts." },
  { key: "Sermons", label: "Sermons", description: "Sermon series and video links", group: "Engagement" },
  { key: "Promotions", label: "Promotions", description: "Banners on the mobile app home screen", group: "Engagement" },
  { key: "Messaging", label: "Messaging", description: "Welcome, birthday and church-wide SMS, email and in-app messages", group: "Engagement", extra: "explicit", why: "Bulk SMS costs money." },
  { key: "Appointments", label: "Appointments", description: "Bookings, availability and counselling schedules", group: "Engagement", extra: "excl" },
  { key: "Program", label: "Programs", description: "Program setup and enrolment administration", group: "Engagement" },
  { key: "School_of_ministry", label: "School of Ministry", description: "Curriculum, cohorts and learning workflows", group: "Engagement" },
  { key: "Financials", label: "Financials", description: "Financial setup and records", group: "Operations" },
  { key: "Giving", label: "Giving options", description: "Giving options and the accounts payments go to", group: "Operations" },
  { key: "Pledges", label: "Pledges", description: "Pledge campaigns, pledgers and redemptions", group: "Operations" },
  { key: "Requisition", label: "Requisition", description: "Staff requests and approvals", group: "Operations" },
  { key: "Asset", label: "Assets", description: "Inventory, assignment and lifecycle management", group: "Operations" },
  { key: "Marketplace", label: "Marketplace", description: "Products, orders and market operations", group: "Operations" },
  { key: "Positions", label: "Positions", description: "Roles and role hierarchy definitions", group: "Administration" },
  { key: "Access_rights", label: "Access rights", description: "Roles and who has them", group: "Administration" },
  { key: "Settings", label: "Settings", description: "Branches, positions, approvals and platform settings", group: "Administration" },
  { key: "AI", label: "AI", description: "Assistant workflows, AI credentials and usage", group: "Administration" },
];

export const MODULE_GROUPS: ModuleGroup[] = NAV_GROUPS;

/** Admin areas the "Team manager" start can only view. */
const MANAGER_VIEW_ONLY = new Set(["Reports", "Financials", "Giving", "Pledges", "Access_rights", "Settings", "AI"]);

export type Level = Extract<PermissionValue, "No_Access" | "Can_View" | "Can_Manage" | "Super_Admin">;

export const LEVELS: { value: Level; label: string }[] = [
  { value: "No_Access", label: "None" },
  { value: "Can_View", label: "View" },
  { value: "Can_Manage", label: "Manage" },
  { value: "Super_Admin", label: "Full" },
];

export const LEVEL_RANK: Record<Level, number> = { No_Access: 0, Can_View: 1, Can_Manage: 2, Super_Admin: 3 };

/** Dot colour per level (index = rank). */
export const LEVEL_DOT = ["rgb(var(--color-white))", "rgb(var(--color-primary) / 0.2)", "rgb(var(--color-primary) / 0.55)", "rgb(var(--color-primary))"];
/** Border for the dot; "None" is white so it needs a visible ring. */
export const LEVEL_DOT_BORDER = ["rgb(var(--color-gray-400))", "rgb(var(--color-primary) / 0.2)", "rgb(var(--color-primary) / 0.55)", "rgb(var(--color-primary))"];

export const levelLabel = (level: Level) => LEVELS[LEVEL_RANK[level]].label;

/** What a role can do, as edited on the role page. */
export interface RoleDraft {
  perms: Record<string, Level>;
  /** Module keys limited to the person's own departments. */
  scopes: Record<string, true>;
  /** Module key → user ids whose records are hidden from this role. */
  excl: Record<string, number[]>;
}

export type StartKey = "view" | "manager" | "hod" | "admin" | "blank" | "copy";

export const STARTS: { key: StartKey; label: string; description: string }[] = [
  { key: "view", label: "Read-only", description: "Can see every module, change nothing" },
  { key: "manager", label: "Team manager", description: "Runs day-to-day work; admin areas view-only" },
  { key: "hod", label: "Head of department", description: "Only their own departments and attendance" },
  { key: "admin", label: "Platform admin", description: "Everything except Community and Messaging" },
  { key: "blank", label: "Start empty", description: "No access; switch on what they need" },
  { key: "copy", label: "Copy a role", description: "Start from one you already have" },
];

export const presetDraft = (start: Exclude<StartKey, "copy">): RoleDraft => {
  const perms: Record<string, Level> = {};
  MODULES.forEach((module) => {
    if (module.extra === "explicit") {
      perms[module.key] = "No_Access";
      return;
    }
    perms[module.key] = {
      blank: "No_Access",
      view: "Can_View",
      admin: "Super_Admin",
      manager: MANAGER_VIEW_ONLY.has(module.key) ? "Can_View" : "Can_Manage",
      hod: "No_Access",
    }[start] as Level;
  });
  if (start === "hod") {
    Object.assign(perms, {
      Members: "Can_View",
      Departments: "Can_Manage",
      Positions: "Can_View",
      Church_Attendance: "Can_View",
    });
  }
  return {
    perms,
    scopes: start === "hod" ? { Departments: true, Church_Attendance: true } : {},
    excl: {},
  };
};

const isLevel = (value: unknown): value is Level =>
  value === "No_Access" || value === "Can_View" || value === "Can_Manage" || value === "Super_Admin";

/** Reads a stored access level into the editor's draft shape. */
export const draftFromAccessRight = (role: Pick<AccessRight, "permissions"> | null | undefined): RoleDraft => {
  const normalized = normalizePermissionPayload((role?.permissions || {}) as PermissionMap);
  const perms: Record<string, Level> = {};
  MODULES.forEach((module) => {
    // Roles saved before a module existed have no key for it; the API then
    // falls back to a broader module (Giving → Financials…). Start from that
    // so saving doesn't take away access people have today.
    const value = resolvePermission(normalized, module.key);
    perms[module.key] = isLevel(value) ? value : "No_Access";
  });
  const scopes: Record<string, true> = {};
  Object.entries((normalized.Scopes || {}) as ScopesMap).forEach(([key, mode]) => {
    if (mode === "assigned_departments") scopes[key] = true;
  });
  const excl: Record<string, number[]> = {};
  Object.entries((normalized.Exclusions || {}) as ExclusionsMap).forEach(([key, ids]) => {
    if (ids.length) excl[key] = [...ids];
  });
  return { perms, scopes, excl };
};

/** The `permissions` object the access-level endpoints expect. */
export const permissionsPayload = (draft: RoleDraft): Record<string, unknown> => {
  const scopes: ScopesMap = {};
  Object.keys(draft.scopes).forEach((key) => {
    if (draft.scopes[key] && draft.perms[key] !== "No_Access") scopes[key] = "assigned_departments";
  });
  const exclusions: ExclusionsMap = {};
  Object.entries(draft.excl).forEach(([key, ids]) => {
    if (ids.length && draft.perms[key] !== "No_Access") exclusions[key] = ids;
  });
  return { ...draft.perms, Exclusions: exclusions, Scopes: scopes };
};

/** Module keys whose level, scope or hidden people differ between two drafts. */
export const changedModules = (a: RoleDraft, b: RoleDraft): Set<string> => {
  const out = new Set<string>();
  MODULES.forEach(({ key }) => {
    const ea = [...(a.excl[key] || [])].sort().join();
    const eb = [...(b.excl[key] || [])].sort().join();
    if (
      (a.perms[key] || "No_Access") !== (b.perms[key] || "No_Access") ||
      !!a.scopes[key] !== !!b.scopes[key] ||
      ea !== eb
    ) {
      out.add(key);
    }
  });
  return out;
};

/** Count of modules at each level (index = rank). */
export const levelMix = (draft: RoleDraft): [number, number, number, number] => {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  MODULES.forEach(({ key }) => {
    counts[LEVEL_RANK[draft.perms[key] || "No_Access"]] += 1;
  });
  return counts;
};

export const cloneDraft = (draft: RoleDraft): RoleDraft => ({
  perms: { ...draft.perms },
  scopes: { ...draft.scopes },
  excl: Object.fromEntries(Object.entries(draft.excl).map(([key, ids]) => [key, [...ids]])),
});

/* -------------------------------------------------------------------------- */
/*                                  Formatting                                */
/* -------------------------------------------------------------------------- */

export const initials = (name: string) => {
  const parts = name.replace(/^Rev\.\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

export const plural = (count: number, singular: string, pluralWord = `${singular}s`) =>
  `${count.toLocaleString()} ${count === 1 ? singular : pluralWord}`;

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SHORT_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "3 Oct 2026". */
export const formatDay = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FMT.format(date);
};

/** "Today", "Yesterday", "18 Oct", or "Never". */
export const formatLastActive = (value?: string | null, now = new Date()) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.getFullYear() === now.getFullYear() ? SHORT_FMT.format(date) : DATE_FMT.format(date);
};

/** "Hill City", "Kumasi" — trims a trailing " Branch" for compact chips. */
export const shortBranch = (name: string) => name.replace(/\s+Branch$/i, "");

/** "A, B +3", or "No one". */
export const summarizeNames = (names: string[]) => {
  if (!names.length) return "No one";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
};
