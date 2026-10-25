import { useCallback, useMemo } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";
import { responsibleMemberIds } from "@/utils/api/visitors/visitorActions";
import type { VisitorType } from "@/utils/api/visitors/interfaces";

export type VisitorAction =
  | "log_visit"
  | "assign_responsible"
  | "record_follow_up"
  | "manage_prayer_requests";

/**
 * Visitors actions for the current user, mirroring the API: a role with
 * Visitors Manage follows its actions; a responsible member keeps their
 * rights on their own visitors unless their role switches the action off.
 */
export const useVisitorAccess = () => {
  const { hasAction, canManage, accessPermissions } = useAccessControl();
  const { user } = useAuth();
  const userId = Number(user?.id) || null;
  const canManageVisitors = canManage("Visitors");

  const overrides = useMemo(
    () =>
      (normalizePermissionPayload(accessPermissions as PermissionMap).Actions ?? {}) as Record<
        string,
        Record<string, boolean> | undefined
      >,
    [accessPermissions]
  );

  const isResponsible = useCallback(
    (visitor?: VisitorType | null) =>
      Boolean(visitor && userId !== null && responsibleMemberIds(visitor).includes(userId)),
    [userId]
  );

  /** Edit the visitor's details (no action of its own: Manage, or their responsible member). */
  const canEdit = useCallback(
    (visitor?: VisitorType | null) => canManageVisitors || isResponsible(visitor),
    [canManageVisitors, isResponsible]
  );

  const can = useCallback(
    (action: VisitorAction, visitor?: VisitorType | null) => {
      if (canManageVisitors) return hasAction(`Visitors.${action}`);
      return isResponsible(visitor) && overrides.Visitors?.[action] !== false;
    },
    [canManageVisitors, hasAction, isResponsible, overrides]
  );

  return {
    can,
    canEdit,
    canRegister: canManageVisitors && hasAction("Visitors.log_visit"),
    canExport: hasAction("Visitors.export"),
    canDelete: hasAction("Visitors.delete"),
    canConvert:
      hasAction("Members.create") &&
      (hasAction("Visitors.convert_to_member") ||
        hasAction("Membership_Management.convert_visitor")),
  };
};
