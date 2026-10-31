import {
  normalizePermissionPayload,
  resolvePermission,
  type ExclusionsMap,
  type PermissionMap,
  type PermissionValue,
  type ScopesMap,
} from "@/utils/accessControl";
import {
  actionAllowed,
  actionDefault,
  defaultScope,
  findAction,
  isScopeValue,
  legacyExplicitActions,
  normalizeActionOverrides,
  PERMISSION_CATALOG,
  type ActionOverrides,
  type CatalogAction,
  type LevelRank,
  type ScopeValue,
} from "@/utils/permissionCatalog";

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
  /**
   * `excl`: can hide people's records; `explicit`: never switched on by
   * templates or "Set all"; `new`: a module that didn't exist before;
   * `retire`: kept only so stored levels still read, and being removed.
   */
  extra?: "excl" | "explicit" | "new" | "retire";
  /** Why the module is explicit, new or being retired. */
  why?: string;
}

// Grouped and ordered like the icon rail (`SIDE_NAV_GROUPS`).
export const MODULES: SettingsModule[] = [
  { key: "Reports", label: "Reports", description: "Event, department and church-wide reports, and the executive summary", group: "Overview" },
  { key: "Members", label: "Members", description: "Church family profiles and member management", group: "People", extra: "excl" },
  { key: "Membership_Management", label: "Membership management", description: "Membership pipelines, conversions and department join requests", group: "People" },
  { key: "Visitors", label: "Visitors", description: "Visitor records, follow-up and prayer requests", group: "People" },
  { key: "Life Center", label: "Life centers", description: "Life center administration, meetings and souls won", group: "People" },
  { key: "Church_Attendance", label: "Attendance", description: "Church and event attendance, biometric devices and timing rules", group: "People" },
  { key: "Rides", label: "Ride to church", description: "Ride offers, safety reports, blocks and pickup points", group: "People", extra: "new", why: "New module. Until now this borrowed Membership management." },
  { key: "Departments", label: "Departments and ministries", description: "Department and ministry structures, heads and members", group: "People" },
  { key: "Events", label: "Events", description: "Event planning, registrations and check-in", group: "Ministry & engagement" },
  { key: "Appointments", label: "Appointments", description: "Bookings, availability and counselling schedules", group: "Ministry & engagement", extra: "excl" },
  { key: "School_of_ministry", label: "School of Ministry", description: "Curriculum, cohorts, grading and certificates", group: "Ministry & engagement" },
  { key: "Theme", label: "Theme", description: "Communication themes and annual planning content", group: "Ministry & engagement" },
  { key: "Community", label: "Community", description: "Members’ feed, church messages and moderation of reported posts", group: "Ministry & engagement" },
  { key: "Sermons", label: "Sermons", description: "Sermon series and video links", group: "Ministry & engagement" },
  { key: "Promotions", label: "Promotions", description: "Banners on the mobile app home screen", group: "Ministry & engagement" },
  { key: "Messaging", label: "Messaging", description: "Welcome, birthday and church-wide SMS, email and in-app messages", group: "Ministry & engagement", extra: "explicit", why: "Bulk SMS costs money." },
  { key: "Program", label: "Programs", description: "Old program setup", group: "Ministry & engagement", extra: "retire", why: "Nothing checks this any more. Its access moves to Theme, Marketplace and School of Ministry." },
  { key: "Financials", label: "Financials", description: "Weekly finance records, approvals and finance setup", group: "Operations" },
  { key: "Giving", label: "Giving options", description: "Giving options and the accounts payments go to", group: "Operations" },
  { key: "Pledges", label: "Pledges", description: "Pledge campaigns, pledgers and redemptions", group: "Operations" },
  { key: "Requisition", label: "Requisition", description: "Requests, approvals and disbursement", group: "Operations" },
  { key: "Asset", label: "Assets", description: "Inventory, assignment, repairs and stock checks", group: "Operations" },
  { key: "Marketplace", label: "Marketplace", description: "Markets, products and orders", group: "Operations" },
  { key: "Access_rights", label: "Access rights and users", description: "Roles, who has them, and user accounts", group: "Administration" },
  { key: "Positions", label: "Positions", description: "Positions and their hierarchy", group: "Administration" },
  { key: "Settings", label: "Settings", description: "Branches, general configuration and logs", group: "Administration" },
  { key: "AI", label: "AI", description: "Assistant workflows, AI credentials and usage", group: "Administration" },
];

export const MODULE_GROUPS: ModuleGroup[] = NAV_GROUPS;

/** Modules the "Team manager" start only views: finance and administration. */
const MANAGER_VIEW_ONLY = new Set(["Financials", "Giving", "Pledges"]);

export type Level = Extract<PermissionValue, "No_Access" | "Can_View" | "Can_Manage" | "Super_Admin">;

export const LEVELS: { value: Level; label: string }[] = [
  { value: "No_Access", label: "None" },
  { value: "Can_View", label: "View" },
  { value: "Can_Manage", label: "Manage" },
  { value: "Super_Admin", label: "Full" },
];

export const LEVEL_RANK: Record<Level, LevelRank> = { No_Access: 0, Can_View: 1, Can_Manage: 2, Super_Admin: 3 };

/** Dot colour per level (index = rank). */
export const LEVEL_DOT = ["rgb(var(--color-white))", "rgb(var(--color-primary) / 0.2)", "rgb(var(--color-primary) / 0.55)", "rgb(var(--color-primary))"];
/** Border for the dot; "None" is white so it needs a visible ring. */
export const LEVEL_DOT_BORDER = ["rgb(var(--color-gray-400))", "rgb(var(--color-primary) / 0.2)", "rgb(var(--color-primary) / 0.55)", "rgb(var(--color-primary))"];

export const levelLabel = (level: Level) => LEVELS[LEVEL_RANK[level]].label;

/** What a role can do, as edited on the role page. */
export interface RoleDraft {
  perms: Record<string, Level>;
  /** Module key → whose records the role sees, when not the level's default. */
  scopes: Record<string, ScopeValue>;
  /** Module key → actions switched on or off against the level's defaults. */
  actions: ActionOverrides;
  /** Module key → user ids whose records are hidden from this role. */
  excl: Record<string, number[]>;
}

export const rankOf = (draft: Pick<RoleDraft, "perms">, key: string): LevelRank =>
  LEVEL_RANK[draft.perms[key] || "No_Access"];

/** Whose records the role sees in a module: the override, else the level's default. */
export const scopeOf = (draft: Pick<RoleDraft, "perms" | "scopes">, key: string): ScopeValue =>
  draft.scopes[key] || defaultScope(rankOf(draft, key), key);

export const actionOn = (draft: Pick<RoleDraft, "perms" | "actions">, key: string, action: CatalogAction) =>
  actionAllowed(rankOf(draft, key), draft.actions, key, action);

/** Whether the role has `Domain.action` (e.g. "Requisition.raise"). */
export const hasAction = (draft: Pick<RoleDraft, "perms" | "actions">, qualified: string) => {
  const { domain, action } = findAction(qualified);
  return !!action && actionOn(draft, domain, action);
};

/** "Members › Add members" for a `Domain.action` key. */
export const requirementLabel = (qualified: string) => {
  const { domain, action } = findAction(qualified);
  const module = MODULES.find((m) => m.key === domain);
  return `${module?.label ?? domain} › ${action?.label ?? qualified}`;
};

/** How many actions differ from what the levels give, across modules with access. */
export const customActionCount = (draft: RoleDraft) => {
  let count = 0;
  Object.entries(draft.actions).forEach(([key, overrides]) => {
    const rank = rankOf(draft, key);
    const entry = PERMISSION_CATALOG[key];
    if (!rank || !entry) return;
    entry.actions.forEach((a) => {
      const value = overrides[a.key];
      if (value !== undefined && value !== actionDefault(rank, a)) count += 1;
    });
  });
  return count;
};

export type StartKey = "view" | "manager" | "hod" | "admin" | "blank" | "copy";

export const STARTS: { key: StartKey; label: string; description: string }[] = [
  { key: "view", label: "Read-only", description: "Can see every module, change nothing" },
  { key: "manager", label: "Team manager", description: "Runs day-to-day work; finance and admin view-only" },
  {
    key: "hod",
    label: "Head of department",
    description: "Members, requisitions, assets, attendance and reports for departments they lead",
  },
  { key: "admin", label: "Platform admin", description: "Everything except Messaging and on-purpose actions" },
  { key: "blank", label: "Start empty", description: "No access; switch on what they need" },
  { key: "copy", label: "Copy a role", description: "Start from one you already have" },
];

/** What the Head of department start limits to the departments they lead. */
const HOD_SCOPED = ["Members", "Departments", "Church_Attendance", "Requisition", "Asset", "Reports"];

export const presetDraft = (start: Exclude<StartKey, "copy">): RoleDraft => {
  const perms: Record<string, Level> = {};
  MODULES.forEach((module) => {
    if (module.extra === "explicit" || module.extra === "retire") {
      perms[module.key] = "No_Access";
      return;
    }
    perms[module.key] = {
      blank: "No_Access",
      view: "Can_View",
      admin: "Super_Admin",
      manager:
        module.group === "Administration" || MANAGER_VIEW_ONLY.has(module.key) ? "Can_View" : "Can_Manage",
      hod: "No_Access",
    }[start] as Level;
  });
  if (start !== "hod") return { perms, scopes: {}, actions: {}, excl: {} };

  Object.assign(perms, {
    Members: "Can_View",
    Departments: "Can_Manage",
    Positions: "Can_View",
    Church_Attendance: "Can_View",
    Requisition: "Can_View",
    Asset: "Can_View",
    Reports: "Can_View",
  });
  return {
    perms,
    scopes: Object.fromEntries(HOD_SCOPED.map((key) => [key, "department" as ScopeValue])),
    actions: { Reports: { dept_prepare: true }, Church_Attendance: { record: true } },
    excl: {},
  };
};

/** Lowers every level to at most what `ceiling` holds ("you can only give what you have"). */
export const clampToCeiling = (draft: RoleDraft, ceiling: (key: string) => LevelRank): RoleDraft => {
  const perms: Record<string, Level> = {};
  Object.entries(draft.perms).forEach(([key, level]) => {
    perms[key] = LEVELS[Math.min(LEVEL_RANK[level], ceiling(key))].value;
  });
  return { ...draft, perms };
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
  const scopes: Record<string, ScopeValue> = {};
  Object.entries((normalized.Scopes || {}) as ScopesMap).forEach(([key, mode]) => {
    // Roles saved before the scope picker stored "assigned_departments".
    const value = mode === "assigned_departments" ? "department" : mode;
    if (isScopeValue(value) && value !== defaultScope(LEVEL_RANK[perms[key] || "No_Access"], key)) {
      scopes[key] = value;
    }
  });
  const legacy = normalized.Actions === undefined;
  const actions = legacy
    ? legacyExplicitActions((key) => LEVEL_RANK[perms[key] || "No_Access"])
    : normalizeActionOverrides(normalized.Actions);
  // Roles saved before scopes existed see the whole branch; keep that
  // explicit where the level now defaults to something narrower.
  if (legacy) {
    MODULES.forEach(({ key }) => {
      if (!scopes[key] && defaultScope(LEVEL_RANK[perms[key] || "No_Access"], key) !== "branch") {
        scopes[key] = "branch";
      }
    });
  }
  const excl: Record<string, number[]> = {};
  Object.entries((normalized.Exclusions || {}) as ExclusionsMap).forEach(([key, ids]) => {
    if (ids.length) excl[key] = [...ids];
  });
  return { perms, scopes, actions, excl };
};

/** The `permissions` object the access-level endpoints expect. */
export const permissionsPayload = (draft: RoleDraft): Record<string, unknown> => {
  const has = (key: string) => (draft.perms[key] || "No_Access") !== "No_Access";
  const scopes: Record<string, ScopeValue> = {};
  Object.entries(draft.scopes).forEach(([key, value]) => {
    if (has(key)) scopes[key] = value;
  });
  const actions: ActionOverrides = {};
  Object.entries(draft.actions).forEach(([key, overrides]) => {
    if (has(key) && Object.keys(overrides).length) actions[key] = { ...overrides };
  });
  const exclusions: ExclusionsMap = {};
  Object.entries(draft.excl).forEach(([key, ids]) => {
    if (ids.length && has(key)) exclusions[key] = ids;
  });
  return { ...draft.perms, Exclusions: exclusions, Scopes: scopes, Actions: actions };
};

/** Module keys whose level, scope, actions or hidden people differ between two drafts. */
export const changedModules = (a: RoleDraft, b: RoleDraft): Set<string> => {
  const out = new Set<string>();
  MODULES.forEach(({ key }) => {
    const ea = [...(a.excl[key] || [])].sort().join();
    const eb = [...(b.excl[key] || [])].sort().join();
    if (
      (a.perms[key] || "No_Access") !== (b.perms[key] || "No_Access") ||
      scopeOf(a, key) !== scopeOf(b, key) ||
      JSON.stringify(a.actions[key] || {}) !== JSON.stringify(b.actions[key] || {}) ||
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
  actions: Object.fromEntries(Object.entries(draft.actions).map(([key, map]) => [key, { ...map }])),
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
