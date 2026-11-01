import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSomData } from "./somDataContext";
import { somPaths } from "./somUtils";
import { useSomAccess } from "../utils/useSomAccess";
import { SubNav, SubNavItem } from "./uiLayout";

type NavDef = SubNavItem & { match: "exact" | "prefix" };

/**
 * Persistent School-of-Ministry sub-navigation (prototype SUBNAV_ADMIN).
 * Vertical rail on desktop, horizontal scroll row on small screens. Counts and
 * item visibility come from the shared SoM data + the signed-in user's rights.
 */
export const SomShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { programs, cohorts, learners, instructors } = useSomData();
  const access = useSomAccess();

  const defs: (NavDef | false)[] = [
    { label: "Dashboard", to: somPaths.dashboard, match: "exact" },
    access.viewsAll && {
      label: "Programs",
      to: somPaths.programs,
      count: programs.length || undefined,
      match: "prefix",
    },
    access.viewsAll && {
      label: "Cohorts",
      to: somPaths.cohorts,
      count: cohorts.length || undefined,
      match: "prefix",
    },
    { label: "Content library", to: somPaths.contentLibrary, match: "prefix" },
    access.viewsAll && {
      label: "Learners",
      to: somPaths.learners,
      count: learners.length || undefined,
      match: "prefix",
    },
    access.viewsAll && {
      label: "Instructors",
      to: somPaths.instructors,
      count: instructors.length || undefined,
      match: "prefix",
    },
    access.can("view_reports") && { label: "Reports", to: somPaths.reports, match: "prefix" },
  ];

  const resolved = defs.filter(Boolean) as NavDef[];
  // Longest matching path wins so detail routes keep their parent highlighted.
  const activeTo = resolved
    .filter((d) =>
      d.match === "exact" ? pathname === d.to : pathname === d.to || pathname.startsWith(`${d.to}/`)
    )
    .sort((a, b) => (b.to?.length ?? 0) - (a.to?.length ?? 0))[0]?.to;

  const items: SubNavItem[] = resolved.map(({ match: _match, ...it }) => ({
    ...it,
    active: it.to === activeTo,
  }));

  const footer = (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-mainGray">
      Viewing as <span className="font-semibold text-primary">{access.viewsAll ? "Admin" : "Instructor"}</span>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Mobile: horizontal nav strip */}
      <div className="border-b border-gray-100 px-4 py-3 lg:hidden">
        <SubNav eyebrow="School of Ministry" items={items} orientation="horizontal" />
      </div>
      {/* Desktop: sticky vertical rail */}
      <div className="hidden flex-shrink-0 self-start lg:sticky lg:top-0 lg:block lg:border-r lg:border-gray-100 lg:py-6 lg:pl-4 lg:pr-3">
        <SubNav eyebrow="School of Ministry" items={items} footer={footer} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};
