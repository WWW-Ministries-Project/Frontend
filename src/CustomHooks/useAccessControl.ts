import { useAuth } from "@/context/AuthWrapper";
import {
  AccessAction,
  canAccess,
  hasRequiredAccess,
  isExcluded,
  PermissionRequirement,
  resolvePermission,
} from "@/utils/accessControl";
import { useCallback } from "react";

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

  return {
    permissions,
    accessPermissions: access_permissions,
    can,
    canView,
    canManage,
    canAdmin,
    hasPermission,
    getAccessLevel,
    isExcluded: checkExcluded,
  };
};

