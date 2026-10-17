import type { AppRoute } from "@/routes/appRoutes";
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { isPathActive, joinRelativePaths, normalizePath, resolveHomePath } from "../utils/navPaths";
import { useSideNavTabs } from "./useSideNavTabs";

/**
 * Pages of the module the icon rail currently has selected. Rendered inside the
 * content card so the rail stays icon-only.
 */
export const SubNav = () => {
  const location = useLocation();
  const { activeTab } = useSideNavTabs();

  const items: AppRoute[] = useMemo(
    () => (activeTab?.children ?? []).filter((child) => child.sideTab),
    [activeTab]
  );

  if (!activeTab || items.length === 0) return null;

  return (
    <aside
      className="hidden w-[212px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gray-200 bg-gray-50 px-3 py-5 lg:flex"
      aria-label={`${activeTab.name} pages`}
    >
      <p className="px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        {activeTab.name}
      </p>

      {items.map((child) => {
        const childPath = resolveHomePath(
          joinRelativePaths(activeTab.path, child.path)
        );
        const isActive = child.path
          ? isPathActive(location.pathname, childPath)
          : normalizePath(location.pathname) === normalizePath(childPath);

        return (
          <NavLink
            key={`${child.name}-${child.path}`}
            to={childPath}
            end={!child.path}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center justify-between rounded-lg px-3 py-[9px] text-left text-sm transition-colors ${
              isActive
                ? "bg-gray-200 font-semibold text-primary"
                : "text-gray-600 hover:bg-gray-200 hover:text-primary"
            }`}
          >
            <span>{child.name}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
