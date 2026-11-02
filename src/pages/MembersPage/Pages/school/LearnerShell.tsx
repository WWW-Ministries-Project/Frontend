import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthWrapper";
import { SubNav, SubNavItem } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { activeMenuPath, learnerMenu } from "./learnerPaths";

/**
 * Shared chrome for the member-facing School of Ministry area: the horizontal
 * sub-navigation from the prototype, above the page's own content. Each learner
 * page renders its content (and PageHeader) as children.
 */
export const LearnerShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const menu = learnerMenu(Boolean(user?.instructor));
  const active = activeMenuPath(pathname, menu.map((m) => m.path));

  const items: SubNavItem[] = menu.map((m) => ({
    label: m.label,
    to: m.path,
    active: m.path === active,
  }));

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="School of Ministry" className="border-b border-gray-100 pb-1">
        <SubNav items={items} orientation="horizontal" />
      </nav>
      {children}
    </div>
  );
};
