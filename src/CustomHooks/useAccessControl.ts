import { useAuth } from "@/context/AuthWrapper";
import {
  AccessAction,
  canAccess,
  hasRequiredAccess,
  isExcluded,
  normalizePermissionPayload,
  PermissionRequirement,
  resolveScope,
  resolvePermission,
  type PermissionMap,
} from "@/utils/accessControl";
import {
  actionAllowed,
  defaultScope,
  findAction,
  isScopeValue,
  normalizeActionOverrides,
  type LevelRank,
  type ScopeValue,
} from "@/utils/permissionCatalog";
import { useCallback, useMemo } from "react";

const RANK: Record<string, LevelRank> = { No_Access: 0, Can_View: 1, Can_Manage: 2, Super_Admin: 3 };

export const useAccessControl = () => {
  const {
    user: { permissions, access_permissions },
  } = useAuth();

  const can = useCallback(
    (domain: string, action: AccessAction = "view") =>
      canAccess(access_permissions, domain, action),
    [access_permissions]
  );

  const hasPermission = useCallback(
    (requirement: PermissionRequirement) =>
      hasRequiredAccess(requirement, access_permissions, permissions),
    [access_permissions, permissions]
  );

  const canView = useCallback((domain: string) => can(domain, "view"), [can]);
  const canManage = useCallback(
    (domain: string) => can(domain, "manage"),
    [can]
  );
  const canAdmin = useCallback((domain: string) => can(domain, "admin"), [can]);

  const getAccessLevel = useCallback(
    (domain: string) => resolvePermission(access_permissions, domain),
    [access_permissions]
  );

  const checkExcluded = useCallback(
    (domain: string, targetUserId: number) =>
      isExcluded(access_permissions, domain, targetUserId),
    [access_permissions]
  );

  const getScope = useCallback(
    (domain: string) => resolveScope(access_permissions, domain),
    [access_permissions]
  );

  const rankOf = useCallback(
    (domain: string): LevelRank => RANK[String(resolvePermission(access_permissions, domain) ?? "No_Access")] ?? 0,
    [access_permissions]
  );
  const actionOverrides = useMemo(() => {
    const stored = normalizePermissionPayload(access_permissions as PermissionMap).Actions;
    return stored === undefined ? undefined : normalizeActionOverrides(stored);
  }, [access_permissions]);

  /**
   * Whether the role allows `Domain.action` (e.g. "Requisition.approve"): an
   * explicit switch on the role, else the level's default. Mirrors the API's
   * src/permissions/access.ts; an unknown action needs Manage.
   */
  const hasAction = useCallback(
    (qualified: string) => {
      const { domain, action } = findAction(qualified);
      const rank = rankOf(domain);
      if (!action) return rank >= 2;
      return actionAllowed(rank, actionOverrides, domain, action);
    },
    [rankOf, actionOverrides]
  );

  /** Whose records the role sees in a module (the level's default when not set). */
  const scopeFor = useCallback(
    (domain: string): ScopeValue => {
      const stored = resolveScope(access_permissions, domain);
      if (stored === "assigned_departments") return "department_member";
      if (isScopeValue(stored)) return stored;
      // Roles saved before scopes existed keep the whole branch.
      if (actionOverrides === undefined) return "branch";
      return defaultScope(rankOf(domain), domain);
    },
    [access_permissions, rankOf, actionOverrides]
  );

  return {
    permissions,
    hasAction,
    scopeFor,
    accessPermissions: access_permissions,
    can,
    canView,
    canManage,
    canAdmin,
    hasPermission,
    getAccessLevel,
    getScope,
    isExcluded: checkExcluded,
  };
};
