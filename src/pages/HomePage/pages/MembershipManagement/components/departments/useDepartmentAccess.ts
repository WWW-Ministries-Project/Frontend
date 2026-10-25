import { useCallback, useMemo } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";

/**
 * Departments actions for the current user, matching what the API enforces
 * (`department/*` and `department-join-request/*`).
 */
export const useDepartmentAccess = () => {
  const { hasAction, scopeFor, accessPermissions } = useAccessControl();
  const { user } = useAuth();
  const userId = Number(user?.id) || null;

  return useMemo(() => {
    const scope = scopeFor("Departments");
    const scoped = scope === "department" || scope === "department_member";
    const canEdit = hasAction("Departments.edit");
    // A role saved before actions existed keeps assigning heads at Manage, as the API does.
    const legacy =
      normalizePermissionPayload(accessPermissions as PermissionMap).Actions === undefined;
    const canDecideAny = hasAction("Membership_Management.decide_join_request");
    return {
      scoped,
      // A role limited to its departments can't add new ones.
      canCreate: hasAction("Departments.create") && !scoped,
      canEdit,
      canManageMembers: hasAction("Departments.manage_members"),
      canAssignPositions: hasAction("Departments.assign_positions"),
      canAssignHead: hasAction("Departments.assign_head") || (legacy && canEdit),
      canDelete: hasAction("Departments.delete"),
      canDecideAny,
      userId,
    };
  }, [accessPermissions, hasAction, scopeFor, userId]);
};

/** Whether the user may see and decide join requests for a department with this head. */
export const useCanDecideJoinRequests = () => {
  const { canDecideAny, userId } = useDepartmentAccess();
  return useCallback(
    (headId: number | null | undefined) =>
      canDecideAny || (userId !== null && headId === userId),
    [canDecideAny, userId]
  );
};
