import { useAuth } from "@/context/AuthWrapper";
import type { AppRoute } from "@/routes/appRoutes";
import { sideTabs } from "@/routes/appRoutes";
import { filterRoutesByAccess } from "@/routes/routeAccess";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { isPathActive, resolveHomePath } from "../utils/navPaths";

/**
 * Resolves the permission-filtered top level navigation (the icon rail) and
 * which of those modules the current URL belongs to. The sub navigation reads
 * the active module from here so both stay in sync.
 */
export const useSideNavTabs = () => {
  const location = useLocation();
  const { user } = useAuth();

  const tabs: AppRoute[] = useMemo(
    () =>
      filterRoutesByAccess(sideTabs, user.access_permissions, user.permissions),
    [user.access_permissions, user.permissions]
  );

  const activeTabNames = useMemo(() => {
    const names: Record<string, boolean> = {};
    tabs.forEach((item) => {
      names[item.name] = isPathActive(
        location.pathname,
        resolveHomePath(item.path)
      );
    });
    return names;
  }, [tabs, location.pathname]);

  const activeTab = useMemo(
    () => tabs.find((item) => activeTabNames[item.name]),
    [tabs, activeTabNames]
  );

  return { tabs, activeTab, activeTabNames };
};
