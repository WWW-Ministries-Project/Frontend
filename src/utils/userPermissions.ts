/**
 * Merges the user profile and permissions from the decoded session token and
 * any API payloads (login response, `user/current-user`). Shared by login and
 * the realtime `session.changed` refresh so both build the user the same way.
 */
import type { BranchAccessGrant, userTypeWithToken } from "@/utils/interfaces";

type PermissionCandidate = Record<string, unknown> | string[] | null | undefined;

const USER_PROFILE_FIELDS = [
  "id",
  "member_id",
  "email",
  "name",
  "phone",
  "user_category",
  "profile_img",
  "member_since",
  "membership_type",
  "ministry_worker",
  "department",
  "department_positions",
  "life_center_leader",
  "instructor",
  "branch_id",
  "branch_name",
] as const;

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

export const collectCandidateRecords = (payload: unknown): Record<string, unknown>[] => {
  const root = asRecord(payload);
  if (!root) return [];

  const levelOne = asRecord(root.data);
  const levelTwo = levelOne ? asRecord(levelOne.data) : undefined;
  const candidates = [
    root,
    levelOne,
    levelTwo,
    asRecord(root.user),
    levelOne ? asRecord(levelOne.user) : undefined,
    levelTwo ? asRecord(levelTwo.user) : undefined,
  ];

  const seen = new Set<Record<string, unknown>>();
  const records: Record<string, unknown>[] = [];

  candidates.forEach((candidate) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    records.push(candidate);
  });

  return records;
};

const extractPermissionsFromRecord = (
  record: Record<string, unknown>
): PermissionCandidate => {
  const direct = record.permissions;
  if (Array.isArray(direct) || asRecord(direct)) {
    return direct as PermissionCandidate;
  }

  const access = asRecord(record.access);
  if (access) {
    const accessPermissions = access.permissions;
    if (Array.isArray(accessPermissions) || asRecord(accessPermissions)) {
      return accessPermissions as PermissionCandidate;
    }
  }

  const accessLevel = asRecord(record.access_level);
  if (accessLevel) {
    const levelPermissions = accessLevel.permissions;
    if (Array.isArray(levelPermissions) || asRecord(levelPermissions)) {
      return levelPermissions as PermissionCandidate;
    }
  }

  return undefined;
};

const extractPermissionSources = (
  payload: unknown
): {
  permissions: PermissionCandidate;
  access_permissions: Record<string, unknown> | null | undefined;
} => {
  const records = collectCandidateRecords(payload);
  let permissions: PermissionCandidate = undefined;
  let accessPermissions: Record<string, unknown> | null | undefined = undefined;

  for (const record of records) {
    if (!accessPermissions) {
      const directAccessPermissions = asRecord(record.access_permissions);
      if (directAccessPermissions) {
        accessPermissions = directAccessPermissions;
      }
    }

    if (!permissions) {
      const extractedPermissions = extractPermissionsFromRecord(record);
      if (extractedPermissions) {
        permissions = extractedPermissions;
      }
    }

    if (permissions && accessPermissions) break;
  }

  return {
    permissions,
    access_permissions: accessPermissions,
  };
};

const extractUserProfileFromSources = (
  ...sources: unknown[]
): Partial<userTypeWithToken> => {
  const mergedProfile: Partial<userTypeWithToken> = {};

  sources.forEach((source) => {
    const records = collectCandidateRecords(source);

    records.forEach((record) => {
      USER_PROFILE_FIELDS.forEach((field) => {
        if (mergedProfile[field] !== undefined) return;
        const value = record[field];
        if (value !== undefined) {
          (mergedProfile as Record<string, unknown>)[field] = value;
        }
      });
    });
  });

  if (mergedProfile.id !== undefined) {
    mergedProfile.id = String(mergedProfile.id);
  }
  if (mergedProfile.member_id !== undefined && mergedProfile.member_id !== null) {
    mergedProfile.member_id = String(mergedProfile.member_id);
  }

  return mergedProfile;
};

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/** Normalizes a `branch_access` array; drops malformed grants. */
export const normalizeBranchAccess = (value: unknown): BranchAccessGrant[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.reduce<BranchAccessGrant[]>((grants, entry) => {
    const record = asRecord(entry);
    const branchId = toPositiveNumber(record?.branch_id);
    const accessLevelId = toPositiveNumber(record?.access_level_id);
    if (!record || !branchId || !accessLevelId) return grants;
    grants.push({
      branch_id: branchId,
      branch_name: String(record.branch_name ?? ""),
      access_level_id: accessLevelId,
      access_level_name: String(record.access_level_name ?? ""),
      permissions: asRecord(record.permissions),
      ...(Array.isArray(record.workspaces)
        ? { workspaces: record.workspaces.filter((key): key is string => typeof key === "string") }
        : {}),
    });
    return grants;
  }, []);
};

/**
 * The richest `branch_access` among the sources: the last one that carries
 * per-branch permissions (current-user), else the last one found at all.
 */
const extractBranchAccess = (
  ...sources: unknown[]
): BranchAccessGrant[] | undefined => {
  let found: BranchAccessGrant[] | undefined;
  let withPermissions: BranchAccessGrant[] | undefined;
  sources.forEach((source) => {
    collectCandidateRecords(source).forEach((record) => {
      const grants = normalizeBranchAccess(record.branch_access);
      if (!grants) return;
      found = grants;
      if (grants.every((grant) => grant.permissions)) withPermissions = grants;
    });
  });
  return withPermissions ?? found;
};

export const mergeUserPermissionSources = (
  decodedToken: userTypeWithToken,
  ...sources: unknown[]
): userTypeWithToken => {
  const profile = extractUserProfileFromSources(...sources);
  let permissions: PermissionCandidate = decodedToken.permissions;
  let accessPermissions = decodedToken.access_permissions;

  sources.forEach((source) => {
    const extracted = extractPermissionSources(source);

    if (extracted.permissions) {
      permissions = extracted.permissions;
    }

    if (extracted.access_permissions) {
      accessPermissions = extracted.access_permissions;
    }
  });

  return {
    ...decodedToken,
    ...profile,
    branch_access:
      extractBranchAccess(...sources) ??
      normalizeBranchAccess(decodedToken.branch_access) ??
      [],
    permissions: permissions as userTypeWithToken["permissions"],
    access_permissions: accessPermissions,
  };
};
