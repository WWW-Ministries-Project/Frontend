import type { PermissionMap } from "@/utils/accessControl";
import { hasRequiredAccess } from "@/utils/accessControl";
import type { AppRoute } from "./appRoutes";

const isRouteAccessible = (
  route: AppRoute,
  accessPermissions: PermissionMap | null | undefined,
  legacyPermissions: Record<string, boolean> | null | undefined
) => {
  if (!route.isPrivate) {
    return true;
  }

  return hasRequiredAccess(
    route.permissionNeeded,
    accessPermissions,
    legacyPermissions
  );
};

export const filterRoutesByAccess = (
  routes: AppRoute[],
  accessPermissions: PermissionMap | null | undefined,
  legacyPermissions: Record<string, boolean> | null | undefined
): AppRoute[] =>
  routes.reduce<AppRoute[]>((visibleRoutes, route) => {
    const visibleChildren = route.children
      ? filterRoutesByAccess(route.children, accessPermissions, legacyPermissions)
      : undefined;
    const hasVisibleChildren = Boolean(visibleChildren?.length);
    const isAccessible = isRouteAccessible(
      route,
      accessPermissions,
      legacyPermissions
    );

    if (!isAccessible && !hasVisibleChildren) {
      return visibleRoutes;
    }

    visibleRoutes.push({
      ...route,
      children: visibleChildren,
    });

    return visibleRoutes;
  }, []);
