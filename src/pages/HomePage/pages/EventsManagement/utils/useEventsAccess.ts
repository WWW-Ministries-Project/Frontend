import { useMemo } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";

/**
 * Events actions for the signed-in user, matching the API's route guards
 * (Backend events/eventRoute.ts). Event types moved to Full; a role saved
 * before actions existed keeps them at Manage, as the API does.
 */
export const useEventsAccess = () => {
  const { hasAction, canManage, accessPermissions } = useAccessControl();
  const legacyRole = useMemo(
    () => normalizePermissionPayload(accessPermissions as PermissionMap).Actions === undefined,
    [accessPermissions]
  );

  return useMemo(
    () => ({
      create: hasAction("Events.create"),
      edit: hasAction("Events.edit"),
      manageSeries: hasAction("Events.manage_series"),
      manageOnlineLinks: hasAction("Events.manage_online_links"),
      sendReminders: hasAction("Events.send_reminders"),
      viewRegistrations: hasAction("Events.view_registrations"),
      exportRegistrants: hasAction("Events.export_registrants"),
      manageTypes: hasAction("Events.manage_types") || (legacyRole && canManage("Events")),
      delete: hasAction("Events.delete"),
    }),
    [hasAction, canManage, legacyRole]
  );
};

export type EventsAccess = ReturnType<typeof useEventsAccess>;
