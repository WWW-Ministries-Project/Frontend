import { useMemo } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";

/**
 * True for a role saved before the role editor had actions (no `Actions` key).
 * Such a role keeps the old rule for rights that moved to a new action, until
 * an admin saves it in the new editor. Mirrors the API's `isLegacyRole`.
 */
export const useIsLegacyRole = () => {
  const { accessPermissions } = useAccessControl();
  return useMemo(
    () => normalizePermissionPayload(accessPermissions as PermissionMap).Actions === undefined,
    [accessPermissions]
  );
};
