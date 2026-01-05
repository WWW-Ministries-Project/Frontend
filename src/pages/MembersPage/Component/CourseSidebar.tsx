import React from "react";
import { cn } from "@/utils/cn";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, } from "@heroicons/react/24/solid";

export interface NavItem {
  id: string | number;
  name: string;
  active: boolean;
}

export type NavItems = NavItem[];

type CourseSidebarProps = {
  navItems?: NavItems;
  heading?: string;
  /** Called when an item is clicked. Parent should update active state. */
  onSelect?: (id: string | number) => void;
};

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  navItems = [],
  heading = "Topic",
  onSelect,
}) => {
  return (
    <aside className="w-full  lg:flex-shrink-0 " aria-label={`${heading} sidebar`}>
      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </h2>

        <nav className="space-y-6" role="navigation" aria-label={heading}>
          {navItems.map((nav, index) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => onSelect && onSelect(nav.id)}
              aria-pressed={nav.active}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all",
                nav.active
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-primary/15 hover:text-foreground"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              
              <span className="flex items-center gap-4">
                <div><CheckCircleIcon className="h-6 w-6 text-lime-700"/>
                </div> {nav.name}</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CourseSidebar;
