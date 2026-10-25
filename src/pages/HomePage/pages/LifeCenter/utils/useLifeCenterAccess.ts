import { useMemo } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";

const DOMAIN = "Life Center";

/**
 * Life center controls, matching what the API allows: the role's Life Center
 * actions, plus leader tools (record meetings and souls won, export) for
 * people on a center's leadership team, passed in as `leadsCenter`.
 */
export const useLifeCenterAccess = (leadsCenter = false) => {
  const { hasAction, canManage, scopeFor, accessPermissions } = useAccessControl();

  return useMemo(() => {
    const can = (action: string) => hasAction(`${DOMAIN}.${action}`);
    // Roles saved before actions existed keep managing center roles at Manage.
    const legacy =
      normalizePermissionPayload(accessPermissions as PermissionMap).Actions === undefined;
    return {
      /** Every center in the branch, not only the ones they lead. */
      wholeBranch: scopeFor(DOMAIN) === "branch",
      editCenters: canManage(DOMAIN),
      createCenters: canManage(DOMAIN) && scopeFor(DOMAIN) === "branch",
      recordMeeting: can("record_meeting") || leadsCenter,
      recordSouls: can("record_souls") || leadsCenter,
      exportData: can("export") || leadsCenter,
      assignMembers: can("assign_members"),
      assignLeader: can("assign_leader"),
      remindLeader: can("remind_leader"),
      editRoles: can("manage_roles") || (legacy && canManage(DOMAIN)),
      deleteRoles: can("manage_roles"),
      remove: can("delete"),
    };
  }, [hasAction, canManage, scopeFor, accessPermissions, leadsCenter]);
};
