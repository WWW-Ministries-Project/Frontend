import { useMemo } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";

import type { QueueAccess } from "./queueActions";

/** Reads the role's explicit switch for "Domain.action", if it set one. */
const overrideOf = (permissions: unknown, qualified: string): boolean | undefined => {
  const [domain, action] = qualified.split(".");
  const actions = (permissions as { Actions?: Record<string, Record<string, unknown>> } | null)?.Actions;
  const value = actions?.[domain]?.[action];
  return typeof value === "boolean" ? value : undefined;
};

/** What the caller's role allows for Home queue actions (mirrors the workspace builders). */
export const useQueueAccess = (): QueueAccess => {
  const { hasAction, canView, canAdmin, accessPermissions } = useAccessControl();
  return useMemo(
    () => ({
      hasAction,
      switchedOff: (qualified) => overrideOf(accessPermissions, qualified) === false,
      // Same sign-off rule as department reports: Reports Full, or the action switched on.
      canSignOffDeptReports: () => {
        const override = overrideOf(accessPermissions, "Reports.dept_approve");
        return override !== undefined ? override && canView("Reports") : canAdmin("Reports");
      },
    }),
    [hasAction, canView, canAdmin, accessPermissions]
  );
};
