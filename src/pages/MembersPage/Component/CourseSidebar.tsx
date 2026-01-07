import React from "react";
import { cn } from "@/utils/cn";
import { BookOpenIcon, ChevronRightIcon, DocumentCheckIcon, DocumentTextIcon, PlayIcon, UsersIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, } from "@heroicons/react/24/solid";

export interface NavItem {
  id: string | number;
  name: string;
  active: boolean;
  completed?:boolean;
  type?: string;
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
  
  const renderIcon = (nav: NavItem) => {
    const iconClass = cn(
      "h-6 w-6",
      nav.active ? "text-white" : nav.completed?"text-lime-700":"text-primary"
    );

    if (nav.completed) {
      return (
        <CheckCircleIcon
          title="Completed"
          className={iconClass}
        />
      );
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
                {renderIcon(nav)}
                {nav.name}
                </span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CourseSidebar;
