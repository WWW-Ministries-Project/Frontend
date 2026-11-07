import React from "react";
import { cn } from "@/utils/cn";
import { BookOpenIcon, ChevronRightIcon, DocumentCheckIcon, DocumentTextIcon, LockClosedIcon, PlayIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, } from "@heroicons/react/24/solid";

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
  
  const renderIcon = (nav: NavItem) => {
    const iconClass = cn(
      "h-6 w-6",
      nav.locked
        ? "text-primaryGray/40"
        : nav.active
          ? "text-white"
          : nav.completed
            ? "text-lime-700"
            : "text-primary"
    );

    if (nav.completed) {
      return (
        <CheckCircleIcon
          title="Completed"
          className={iconClass}
        />
      );
    }

    if (nav.locked) {
      return <LockClosedIcon title="Locked" className={iconClass} />;
    }

    switch (nav.type) {
      case "live":
        return <VideoCameraIcon className={iconClass} />;
      case "video":
        return <PlayIcon className={iconClass} />;
      case "lesson-note":
        return <BookOpenIcon className={iconClass} />;
      case "pdf":
      case "ppt":
        return <DocumentTextIcon className={iconClass} />;
      case "assignment":
      case "assignment-essay":
        return <DocumentCheckIcon className={iconClass}/>;
      default:
        return null;
    }
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

        <nav className={navItems.some((n) => n.group) ? "space-y-1" : "space-y-6"} role="navigation" aria-label={heading || "Course content"}>
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
