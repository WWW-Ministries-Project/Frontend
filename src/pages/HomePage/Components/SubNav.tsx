import type { AppRoute } from "@/routes/appRoutes";
import {
  TEACHING_VIEW_PARAM,
  TEACHING_VIEW_VALUE,
  useSomAccess,
} from "@/pages/HomePage/pages/MinistrySchool/utils/useSomAccess";
import { useMemo } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";

import { isPathActive, joinRelativePaths, normalizePath, resolveHomePath } from "../utils/navPaths";
import { useSideNavTabs } from "./useSideNavTabs";

type SubNavSection = {
  /** Heading above the group; empty renders the plain module name. */
  heading: string;
  items: AppRoute[];
  /** Instructor cut ("My teaching" / "My classes"): relabels and routes to the teaching view. */
  teaching: boolean;
};

/**
 * Pages of the module the icon rail currently has selected. Rendered inside the
 * content card so the rail stays icon-only.
 *
 * Modules that offer an instructor cut of their navigation (today, School of
 * Ministry) carry `instructorTab` on the pages an instructor should see. A user
 * who only teaches gets that trimmed, relabelled list; a whole-school admin who
 * also teaches gets both — their full admin pages under "Administration" and
 * their teaching pages under "My teaching" — and everyone else keeps the normal
 * `sideTab` pages.
 */
export const SubNav = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeTab } = useSideNavTabs();
  const { instructorView, instructor } = useSomAccess();

  const teachingParam =
    searchParams.get(TEACHING_VIEW_PARAM) === TEACHING_VIEW_VALUE;

  const sections = useMemo<SubNavSection[]>(() => {
    const children = activeTab?.children ?? [];
    const adminItems = children.filter((child) => child.sideTab);
    const instructorItems = children.filter((child) => child.instructorTab);
    const hasInstructorCut = instructorItems.length > 0;

    // Only an instructor with teaching pages here sees the instructor list. The
    // admin list hides only for a pure instructor (teaches, no whole-school
    // read) on this instructor-cut module — every other module and user keeps
    // its normal `sideTab` pages.
    const showInstructor = instructor && hasInstructorCut;
    const showAdmin = adminItems.length > 0 && !(hasInstructorCut && instructorView);
    const combined = showAdmin && showInstructor;

    if (combined) {
      return [
        { heading: "Administration", items: adminItems, teaching: false },
        { heading: "My teaching", items: instructorItems, teaching: true },
      ];
    }
    if (showInstructor) {
      return [{ heading: activeTab?.name ?? "", items: instructorItems, teaching: true }];
    }
    if (showAdmin) {
      return [{ heading: activeTab?.name ?? "", items: adminItems, teaching: false }];
    }
    return [];
  }, [activeTab, instructorView, instructor]);

  const combined = sections.length > 1;

  if (!activeTab || sections.every((section) => section.items.length === 0)) {
    return null;
  }

  const renderItem = (child: AppRoute, teaching: boolean) => {
    const childPath = resolveHomePath(joinRelativePaths(activeTab.path, child.path));
    const pathMatch = child.path
      ? isPathActive(location.pathname, childPath)
      : normalizePath(location.pathname) === normalizePath(childPath);

    // In the combined nav the admin "Dashboard"/"Cohorts" and the instructor
    // "My teaching"/"My classes" share a URL, so the `?view=teaching` flag is
    // what tells them apart — both for where the link goes and for which one
    // reads as active.
    const to =
      combined && teaching
        ? `${childPath}?${TEACHING_VIEW_PARAM}=${TEACHING_VIEW_VALUE}`
        : childPath;
    const isActive = combined
      ? pathMatch && teachingParam === teaching
      : pathMatch;

    return (
      <NavLink
        key={`${teaching ? "teach" : "admin"}-${child.name}-${child.path}`}
        to={to}
        end={!child.path}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center justify-between rounded-lg px-3 py-[9px] text-left text-sm transition-colors ${
          isActive
            ? "bg-gray-200 font-semibold text-primary"
            : "text-gray-600 hover:bg-gray-200 hover:text-primary"
        }`}
      >
        <span>{teaching ? child.instructorLabel ?? child.name : child.name}</span>
      </NavLink>
    );
  };

  return (
    <aside
      className="hidden w-[212px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gray-200 bg-gray-50 px-3 py-5 lg:flex"
      aria-label={`${activeTab.name} pages`}
    >
      {sections.map((section, index) => (
        <div key={section.heading || index} className="flex flex-col gap-0.5">
          <p
            className={`px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 ${
              index > 0 ? "pt-3.5" : ""
            }`}
          >
            {section.heading}
          </p>
          {section.items.map((child) => renderItem(child, section.teaching))}
        </div>
      ))}
    </aside>
  );
};
