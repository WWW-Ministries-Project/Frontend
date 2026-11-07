import React from "react";
import { cn } from "@/utils/cn";
import { ChevronRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export interface NavItem {
  id: string | number;
  name: string;
  active: boolean;
  completed?:boolean;
  type?: string;
  /** Module heading; consecutive items with the same group render under one heading. */
  group?: string;
  /** Not open yet: rendered muted, with a lock, and not clickable. */
  locked?: boolean;
}

export type NavItems = NavItem[];

type CourseSidebarProps = {
  navItems?: NavItems;
  heading?: string;
  /** Called when an item is clicked. Parent should update active state. */
  onSelect?: (id: string | number) => void;
  /** When set, a progress bar heads the list (course player). */
  progress?: number;
  /** Drop the card chrome (border/background/padding) to sit inside a host surface. */
  bare?: boolean;
};

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  navItems = [],
  heading = "Topic",
  onSelect,
  progress,
  bare = false,
}) => {
  
  // Uniform circle indicators for the course player: a green check for a
  // completed topic, a ring with a dot for the current one, and an empty circle
  // for anything upcoming or locked — matching the prototype. The category
  // filter list (items carry no type, completed or locked state) shows none.
  const renderIcon = (nav: NavItem) => {
    if (nav.completed) {
      return <CheckCircleIcon title="Completed" className="h-5 w-5 text-lime-600" />;
    }

    if (nav.type === undefined && !nav.locked) return null;

    return (
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
          nav.locked
            ? "border-primaryGray/30"
            : nav.active
              ? "border-white"
              : "border-primaryGray/40"
        )}
      >
        {nav.active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
    );
  };

  return (
    <aside className="w-full  lg:flex-shrink-0 " aria-label={`${heading || "Course content"} sidebar`}>
      <div className={bare ? "" : "rounded-xl border border-lightGray bg-white p-4"}>
        {heading && (
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primaryGray">
            {heading}
          </h2>
        )}

        {progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-primaryGray">
              <span>Your progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-lightGray/40">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <nav className="space-y-1" role="navigation" aria-label={heading || "Course content"}>
          {navItems.map((nav, index) => (
            <React.Fragment key={nav.id}>
            {nav.group && nav.group !== navItems[index - 1]?.group && (
              <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-primaryGray first:pt-0">
                {nav.group}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                if (nav.locked) return;
                if (onSelect) onSelect(nav.id);
              }}
              disabled={nav.locked}
              aria-pressed={nav.active}
              aria-disabled={nav.locked}
              title={nav.locked ? "Not open yet" : undefined}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all",
                nav.locked
                  ? "cursor-not-allowed text-primaryGray/40"
                  : nav.active
                    ? "bg-primary text-white"
                    : "text-primaryGray hover:bg-primary/15 hover:text-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >

              <span className="flex items-center gap-4">
                {renderIcon(nav)}
                {nav.name}
                </span>
              {nav.locked ? (
                <LockClosedIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CourseSidebar;
