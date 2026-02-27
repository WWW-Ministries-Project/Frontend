export type PermissionValue =
  | "No_Access"
  | "Can_View"
  | "Can_Manage"
  | "Super_Admin";
export type AccessAction = "view" | "manage" | "admin";
export type PermissionMap = Record<string, unknown>;
export type LegacyPermissionMap = Record<string, boolean>;
export type ExclusionsMap = Record<string, number[]>;

export const CANONICAL_PERMISSION_DOMAINS = [
  "Members",
  "Departments",
  "Positions",
  "Access_rights",
  "Asset",
  "Events",
  "Requisition",
  "Program",
  "Life Center",
  "Visitors",
  "Appointments",
  "Church_Attendance",
  "Theme",
  "Financials",
  "Marketplace",
  "School_of_ministry",
  "Settings",
] as const;

export type PermissionDomain = (typeof CANONICAL_PERMISSION_DOMAINS)[number];

export const EXCLUSION_SUPPORTED_DOMAINS: PermissionDomain[] = [
  "Members",
  "Appointments",
];

type PermissionRequirementObject = {
  domain: PermissionDomain | string;
  action: AccessAction;
};

export type PermissionRequirement =
  | string
  | PermissionRequirementObject
  | undefined
  | null;

const DOMAIN_ALIASES: Record<PermissionDomain, string[]> = {
  Members: ["Members", "Member", "users", "user"],
  Visitors: ["Visitors", "Visitor"],
  Appointments: ["Appointments", "Appointment"],
  Departments: ["Departments", "Department"],
  Positions: ["Positions", "Position"],
  Access_rights: ["Access_rights", "Access rights", "Access Rights"],
  Events: ["Events", "Event"],
  Church_Attendance: ["Church_Attendance", "Church Attendance"],
  Theme: ["Theme", "Themes"],
  Asset: ["Asset", "Assets"],
  Requisition: ["Requisition", "Requisitions", "Requests"],
  Program: ["Program", "Programs"],
  School_of_ministry: [
    "School_of_ministry",
    "School of ministry",
    "School of Ministry",
  ],
  Financials: ["Financials", "Finance", "Finances"],
  Settings: ["Settings", "Setting"],
  Marketplace: ["Marketplace", "Market Place", "Market"],
  "Life Center": ["Life Center", "Life_Center", "Life center", "LifeCenter"],
};

const REQUIRED_KEYS_ON_MUTATION = new Set<PermissionDomain>([
  "Members",
  "Departments",
  "Positions",
  "Access_rights",
  "Asset",
  "Events",
  "Requisition",
  "Program",
  "Life Center",
]);

type DomainMeta = {
  key: PermissionDomain;
  label: string;
  description: string;
  group: "People" | "Operations" | "Engagement" | "Administration";
  required: boolean;
};

export const ACCESS_LEVEL_DOMAINS: DomainMeta[] = [
  {
    key: "Members",
    label: "Members",
    description: "Church family profile and member management",
    group: "People",
    required: true,
  },
  {
    key: "Visitors",
    label: "Visitors",
    description: "Visitor records, follow-up and engagement tracking",
    group: "People",
    required: false,
  },
  {
    key: "Appointments",
    label: "Appointments",
    description: "Bookings, availability and counseling schedules",
    group: "People",
    required: false,
  },
  {
    key: "Departments",
    label: "Departments",
    description: "Team structures and departmental setup",
    group: "People",
    required: true,
  },
  {
    key: "Positions",
    label: "Positions",
    description: "Roles and role hierarchy definitions",
    group: "People",
    required: true,
  },
  {
    key: "Asset",
    label: "Assets",
    description: "Inventory, assignment and lifecycle management",
    group: "Operations",
    required: true,
  },
  {
    key: "Requisition",
    label: "Requisition",
    description: "Staff requests and approvals",
    group: "Operations",
    required: true,
  },
  {
    key: "Program",
    label: "Programs",
    description: "Program setup and enrollment administration",
    group: "Engagement",
    required: true,
  },
  {
    key: "School_of_ministry",
    label: "School of Ministry",
    description: "Curriculum, cohorts and learning workflows",
    group: "Engagement",
    required: false,
  },
  {
    key: "Events",
    label: "Events",
    description: "Event planning and participation records",
    group: "Engagement",
    required: true,
  },
  {
    key: "Church_Attendance",
    label: "Church Attendance",
    description: "Attendance sessions and attendance records",
    group: "Engagement",
    required: false,
  },
  {
    key: "Theme",
    label: "Theme",
    description: "Communication themes and annual planning content",
    group: "Engagement",
    required: false,
  },
  {
    key: "Life Center",
    label: "Life Center",
    description: "Life center administration and soul winning data",
    group: "Engagement",
    required: true,
  },
  {
    key: "Marketplace",
    label: "Marketplace",
    description: "Products, orders and market operations",
    group: "Operations",
    required: false,
  },
  {
    key: "Financials",
    label: "Financials",
    description: "Financial setup and record management",
    group: "Administration",
    required: false,
  },
  {
    key: "Access_rights",
    label: "Access Rights",
    description: "Role templates and access-level configuration",
    group: "Administration",
    required: true,
  },
  {
    key: "Settings",
    label: "Settings",
    description: "Global platform controls and advanced configuration",
    group: "Administration",
    required: false,
  },
];

const LEGACY_PERMISSION_TO_REQUIREMENT: Record<string, PermissionRequirementObject> = {
  view_members: { domain: "Members", action: "view" },
  manage_members: { domain: "Members", action: "manage" },
  view_visitors: { domain: "Visitors", action: "view" },
  manage_visitors: { domain: "Visitors", action: "manage" },
  view_appointments: { domain: "Appointments", action: "view" },
  manage_appointments: { domain: "Appointments", action: "manage" },
  view_events: { domain: "Events", action: "view" },
  manage_events: { domain: "Events", action: "manage" },
  view_departments: { domain: "Departments", action: "view" },
  manage_departments: { domain: "Departments", action: "manage" },
  view_positions: { domain: "Positions", action: "view" },
  manage_positions: { domain: "Positions", action: "manage" },
  view_access_rights: { domain: "Access_rights", action: "view" },
  manage_access_rights: { domain: "Access_rights", action: "manage" },
  view_asset: { domain: "Asset", action: "view" },
  manage_asset: { domain: "Asset", action: "manage" },
  view_requisition: { domain: "Requisition", action: "view" },
  manage_requisition: { domain: "Requisition", action: "manage" },
  view_program: { domain: "Program", action: "view" },
  manage_program: { domain: "Program", action: "manage" },
  view_life_center: { domain: "Life Center", action: "view" },
  manage_life_center: { domain: "Life Center", action: "manage" },
  view_church_attendance: { domain: "Church_Attendance", action: "view" },
  manage_church_attendance: { domain: "Church_Attendance", action: "manage" },
  view_theme: { domain: "Theme", action: "view" },
  manage_theme: { domain: "Theme", action: "manage" },
  view_financials: { domain: "Financials", action: "view" },
  manage_financials: { domain: "Financials", action: "manage" },
  view_marketplace: { domain: "Marketplace", action: "view" },
  manage_marketplace: { domain: "Marketplace", action: "manage" },
  view_school_of_ministry: { domain: "School_of_ministry", action: "view" },
  manage_school_of_ministry: { domain: "School_of_ministry", action: "manage" },
  view_settings: { domain: "Settings", action: "view" },
  manage_settings: { domain: "Settings", action: "manage" },
  view_users: { domain: "Settings", action: "view" },
  manage_users: { domain: "Settings", action: "manage" },
};

const VIEW_ACCESS = new Set<PermissionValue>([
  "Can_View",
  "Can_Manage",
  "Super_Admin",
]);
const MANAGE_ACCESS = new Set<PermissionValue>(["Can_Manage", "Super_Admin"]);
const ADMIN_ACCESS = new Set<PermissionValue>(["Super_Admin"]);
const VALID_ACCESS_VALUES = new Set<PermissionValue>([
  "No_Access",
  "Can_View",
  "Can_Manage",
  "Super_Admin",
]);

const normalizeLookupToken = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, "");

const slugifyDomain = (domain: string) =>
  domain
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

const DOMAIN_LOOKUP: Record<string, PermissionDomain> = (() => {
  const lookup: Record<string, PermissionDomain> = {};

  for (const domain of CANONICAL_PERMISSION_DOMAINS) {
    lookup[normalizeLookupToken(domain)] = domain;
    lookup[normalizeLookupToken(slugifyDomain(domain))] = domain;

    for (const alias of DOMAIN_ALIASES[domain] || []) {
      lookup[normalizeLookupToken(alias)] = domain;
      lookup[normalizeLookupToken(slugifyDomain(alias))] = domain;
    }
  }

  return lookup;
})();

const parsePermissionValue = (value: unknown): PermissionValue | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (VALID_ACCESS_VALUES.has(trimmed as PermissionValue)) {
    return trimmed as PermissionValue;
  }

  const normalized = normalizeLookupToken(trimmed);
  if (
    normalized === "noaccess" ||
    normalized === "none" ||
    normalized === "no_access"
  ) {
    return "No_Access";
  }
  if (normalized === "canview" || normalized === "view") return "Can_View";
  if (normalized === "canmanage" || normalized === "manage") {
    return "Can_Manage";
  }
  if (normalized === "superadmin" || normalized === "admin") {
    return "Super_Admin";
  }

  return null;
};

const resolveDomain = (domain: string): PermissionDomain | string => {
  const normalized = normalizeLookupToken(domain);
  return DOMAIN_LOOKUP[normalized] || domain;
};

const normalizeExclusions = (value: unknown): ExclusionsMap => {
  if (!value || typeof value !== "object") return {};

  const normalized: ExclusionsMap = {};
  for (const [rawDomain, rawIds] of Object.entries(
    value as Record<string, unknown>
  )) {
    const resolved = resolveDomain(rawDomain);
    if (!Array.isArray(rawIds)) continue;

    const ids = rawIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length > 0) {
      normalized[String(resolved)] = Array.from(new Set(ids));
    }
  }

  return normalized;
};

export const normalizePermissionPayload = (
  permissions: PermissionMap | null | undefined
): PermissionMap => {
  if (!permissions || typeof permissions !== "object") return {};

  const normalized: PermissionMap = {};
  for (const [rawKey, rawValue] of Object.entries(permissions)) {
    if (rawKey === "Exclusions") {
      const exclusions = normalizeExclusions(rawValue);
      if (Object.keys(exclusions).length > 0) {
        normalized.Exclusions = exclusions;
      }
      continue;
    }

    const parsedValue = parsePermissionValue(rawValue);
    if (!parsedValue) continue;

    const resolvedDomain = resolveDomain(rawKey);
    normalized[String(resolvedDomain)] = parsedValue;
  }

  return normalized;
};

export const flattenPermissionsToLegacyFlags = (
  permissions: PermissionMap | null | undefined
): LegacyPermissionMap => {
  const normalized = normalizePermissionPayload(permissions);
  const legacyFlags: LegacyPermissionMap = {};

  for (const [domain, value] of Object.entries(normalized)) {
    if (domain === "Exclusions") continue;

    const parsedValue = parsePermissionValue(value);
    if (!parsedValue) continue;

    const domainKey = slugifyDomain(domain);

    if (VIEW_ACCESS.has(parsedValue)) {
      legacyFlags[`view_${domainKey}`] = true;
    }
    if (MANAGE_ACCESS.has(parsedValue)) {
      legacyFlags[`manage_${domainKey}`] = true;
    }
    if (ADMIN_ACCESS.has(parsedValue)) {
      legacyFlags[`admin_${domainKey}`] = true;
    }
  }

  return legacyFlags;
};

export const resolvePermission = (
  permissions: PermissionMap | null | undefined,
  domain: string
): PermissionValue | null => {
  const normalized = normalizePermissionPayload(permissions);
  const resolvedDomain = String(resolveDomain(domain));
  const parsed = parsePermissionValue(normalized[resolvedDomain]);
  return parsed || null;
};

export const canAccess = (
  permissions: PermissionMap | null | undefined,
  domain: string,
  action: AccessAction = "view"
): boolean => {
  const value = resolvePermission(permissions, domain);
  if (!value) return false;

  if (action === "view") return VIEW_ACCESS.has(value);
  if (action === "manage") return MANAGE_ACCESS.has(value);
  return ADMIN_ACCESS.has(value);
};

export const isExcluded = (
  permissions: PermissionMap | null | undefined,
  domain: string,
  targetUserId: number
): boolean => {
  const normalized = normalizePermissionPayload(permissions);
  const exclusions = normalized.Exclusions as ExclusionsMap | undefined;
  if (!exclusions) return false;

  const resolvedDomain = String(resolveDomain(domain));
  const domainExclusions = exclusions[resolvedDomain];
  return Array.isArray(domainExclusions) && domainExclusions.includes(targetUserId);
};

const parseLegacyRequirement = (
  requirement: string
): PermissionRequirementObject | null => {
  const explicit = LEGACY_PERMISSION_TO_REQUIREMENT[requirement];
  if (explicit) return explicit;

  const match = /^(view|manage|admin)_(.+)$/i.exec(requirement);
  if (!match) return null;

  const [, actionToken, domainToken] = match;
  const action = actionToken.toLowerCase() as AccessAction;
  const inferredDomain = resolveDomain(domainToken);

  return { action, domain: String(inferredDomain) };
};

const hasPositiveCanonicalAccess = (
  permissions: PermissionMap | null | undefined
): boolean => {
  const normalized = normalizePermissionPayload(permissions);

  return Object.entries(normalized).some(([domain, value]) => {
    if (domain === "Exclusions") return false;
    const parsedValue = parsePermissionValue(value);
    return parsedValue !== null && parsedValue !== "No_Access";
  });
};

export const hasRequiredAccess = (
  requirement: PermissionRequirement,
  permissions: PermissionMap | null | undefined,
  legacyPermissions: LegacyPermissionMap | null | undefined = {}
): boolean => {
  if (!requirement) return true;

  if (typeof requirement === "object") {
    return canAccess(permissions, requirement.domain, requirement.action);
  }

  const parsedRequirement = parseLegacyRequirement(requirement);
  const canonicalHasAnyGrant = hasPositiveCanonicalAccess(permissions);

  if (parsedRequirement) {
    // Canonical access levels should take precedence when a domain is configured.
    const configuredDomainPermission = resolvePermission(
      permissions,
      parsedRequirement.domain
    );

    if (configuredDomainPermission !== null) {
      if (
        configuredDomainPermission === "No_Access" &&
        !canonicalHasAnyGrant &&
        legacyPermissions?.[requirement]
      ) {
        return true;
      }

      return canAccess(
        permissions,
        parsedRequirement.domain,
        parsedRequirement.action
      );
    }
  }

  if (legacyPermissions?.[requirement]) return true;

  if (!parsedRequirement) return false;

  return canAccess(
    permissions,
    parsedRequirement.domain,
    parsedRequirement.action
  );
};

export const toManageRequirement = (
  requirement: PermissionRequirement
): PermissionRequirement => {
  if (!requirement) return requirement;

  if (typeof requirement === "object") {
    if (requirement.action === "admin") return requirement;
    return {
      ...requirement,
      action: "manage",
    };
  }

  const actionMatch = /^(view|manage|admin)_(.+)$/i.exec(requirement);
  if (actionMatch) {
    const [, actionToken, suffix] = actionMatch;
    const action = actionToken.toLowerCase() as AccessAction;

    if (action === "view") {
      return `manage_${suffix}`;
    }

    return requirement;
  }

  const parsedRequirement = parseLegacyRequirement(requirement);
  if (!parsedRequirement) return requirement;

  if (parsedRequirement.action === "admin") {
    return requirement;
  }

  return `manage_${slugifyDomain(String(parsedRequirement.domain))}`;
};

export const createDefaultPermissionMatrix = (
  defaultValue: PermissionValue = "Can_View"
): Record<PermissionDomain, PermissionValue> =>
  ACCESS_LEVEL_DOMAINS.reduce((acc, module) => {
    acc[module.key] = defaultValue;
    return acc;
  }, {} as Record<PermissionDomain, PermissionValue>);

export const ensureRequiredPermissionKeys = (
  permissions: Record<string, PermissionValue>,
  fallbackValue: PermissionValue = "Can_View"
) => {
  const normalized = { ...permissions };
  for (const key of REQUIRED_KEYS_ON_MUTATION) {
    if (!normalized[key]) {
      normalized[key] = fallbackValue;
    }
  }
  return normalized;
};

export const getDomainLabel = (domain: string): string => {
  const config = ACCESS_LEVEL_DOMAINS.find((item) => item.key === domain);
  if (config) return config.label;
  return domain.replace(/_/g, " ");
};
