import type { PermissionMap } from "@/utils/accessControl";
import { hasRequiredAccess } from "@/utils/accessControl";
import type { AppRoute } from "./appRoutes";

const isRouteAccessible = (
  route: AppRoute,
  accessPermissions: PermissionMap | null | undefined,
  legacyPermissions: Record<string, boolean> | null | undefined,
  isInstructor = false
) => {
  if (!route.isPrivate) {
    return true;
  }

  // Instructors who teach but hold no whole-school role still reach the School
  // of Ministry pages marked for them (My teaching / My classes and the grading
  // surfaces they open from there).
  if (isInstructor && route.allowInstructor) {
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
  legacyPermissions: Record<string, boolean> | null | undefined,
  isInstructor = false
): AppRoute[] =>
  routes.reduce<AppRoute[]>((visibleRoutes, route) => {
    if (route.redirectOnly) return visibleRoutes;

    const visibleChildren = route.children
      ? filterRoutesByAccess(
          route.children,
          accessPermissions,
          legacyPermissions,
          isInstructor
        )
      : undefined;
    const hasVisibleChildren = Boolean(visibleChildren?.length);
    const isAccessible = isRouteAccessible(
      route,
      accessPermissions,
      legacyPermissions,
      isInstructor
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
