import type { AppRoute } from "@/routes/appRoutes";
import { Fragment } from "react";
import { sidebarIcons } from "../utils";
import { SidebarItem } from "./SidebarItem";

interface Props {
  /** Sections of the rail; a divider is drawn between them. */
  groups: AppRoute[][];
  show: boolean;
  openMenus: Record<string, boolean>;
  activeTabNames: Record<string, boolean>;
  onToggleSubMenu: (menuName: string) => void;
  onNavigate?: () => void;
  onParentMenuActivate?: () => void;
  iconClassName?: string;
}

export const SidebarNavList = ({
  groups,
  show,
  openMenus,
  activeTabNames,
  onToggleSubMenu,
  onNavigate,
  onParentMenuActivate,
  iconClassName,
}: Props) => {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <Fragment key={group[0]?.name ?? groupIndex}>
          {groupIndex > 0 && (
            <div aria-hidden="true" className="mx-3 my-2 h-px bg-lightGray" />
          )}
          {group.map((item) => {
            const IconComponent = sidebarIcons[item.name];
            if (!IconComponent) return null;

            return (
              <SidebarItem
                key={`${item.name}-${item.path}`}
                item={item}
                IconComponent={IconComponent}
                isActive={activeTabNames[item.name] || false}
                isExpanded={show}
                openMenus={openMenus}
                toggleSubMenu={onToggleSubMenu}
                onNavigate={onNavigate}
                onParentMenuActivate={onParentMenuActivate}
                iconClassName={iconClassName}
              />
            );
          })}
        </Fragment>
      ))}
    </>
  );
};

export default SidebarNavList;
