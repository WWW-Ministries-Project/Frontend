import { ALL_BRANCHES, type ActiveBranchId } from "@/store/useBranchStore";
import type { BranchAccessGrant } from "@/utils/interfaces";
import { WORKSPACE_KEYS, type WorkspaceKey } from "@/utils/api/workspaces/interfaces";

const PERMISSION_RANK: Record<string, number> = {
  No_Access: 0,
  Can_View: 1,
  Can_Manage: 2,
  Super_Admin: 3,
};

/**
 * Merges per-branch permission maps keeping each module at its highest level,
 * the same rule the API uses for "all my branches". Non-level keys
 * (exclusions, scopes) come from the first grant that sets them.
 */
export const mergePermissionsAtHighest = (
  maps: Array<Record<string, unknown> | undefined>
): Record<string, unknown> => {
  const merged: Record<string, unknown> = {};
  maps.forEach((permissions) => {
    Object.entries(permissions || {}).forEach(([key, value]) => {
      const current = merged[key];
      if (typeof value === "string" && value in PERMISSION_RANK) {
        if (
          typeof current !== "string" ||
          (PERMISSION_RANK[value] ?? 0) > (PERMISSION_RANK[current] ?? 0)
        ) {
          merged[key] = value;
        }
      } else if (current === undefined) {
        merged[key] = value;
      }
    });
  });
  return merged;
};

/**
 * The permissions that apply in the active branch, or `undefined` when the
 * grants carry no permission maps (older API) and the token's should be used.
 */
export const resolveBranchPermissions = (
  grants: BranchAccessGrant[] | undefined,
  activeBranchId: ActiveBranchId
): Record<string, unknown> | undefined => {
  if (!grants?.length || !grants.every((grant) => grant.permissions)) {
    return undefined;
  }

  if (activeBranchId !== ALL_BRANCHES) {
    const grant = grants.find((item) => item.branch_id === activeBranchId);
    if (grant) return grant.permissions;
  }

  return mergePermissionsAtHighest(grants.map((grant) => grant.permissions));
};

/**
 * The branches a user may work in. Admins: the branches they hold a role in.
 * Members: their home branch. `null` when nothing limits them (e.g. an admin
 * on an API that predates branch access).
 */
export const resolveAllowedBranchIds = (user: {
  user_category?: string;
  branch_id?: number | null;
  branch_access?: BranchAccessGrant[];
}): number[] | null => {
  const grants = user.branch_access ?? [];
  if (user.user_category === "admin") {
    return grants.length ? grants.map((grant) => grant.branch_id) : null;
  }
  return user.branch_id ? [user.branch_id] : null;
};

/**
 * The Home workspaces granted in the active branch, in display order. With
 * "all branches" it is the union across every grant; a branch the user holds
 * no grant in has none (the server would refuse them there).
 */
export const resolveBranchWorkspaces = (
  grants: BranchAccessGrant[] | undefined,
  activeBranchId: ActiveBranchId
): WorkspaceKey[] => {
  if (!grants?.length) return [];
  const scoped =
    activeBranchId === ALL_BRANCHES
      ? grants
      : grants.filter((item) => item.branch_id === activeBranchId);
  const keys = new Set<string>();
  scoped.forEach((item) =>
    (item.workspaces ?? []).forEach((key) => keys.add(key))
  );
  return WORKSPACE_KEYS.filter((key) => keys.has(key));
};
