import type { AppRoute } from "@/routes/appRoutes";
import { sidebarIcons } from "../utils";
import { SidebarItem } from "./SidebarItem";

interface Props {
  items: AppRoute[];
  show: boolean;
  openMenus: Record<string, boolean>;
  activeTabNames: Record<string, boolean>;
  onToggleSubMenu: (menuName: string) => void;
  onNavigate?: () => void;
  iconClassName?: string;
}

export const SidebarNavList = ({
  items,
  show,
  openMenus,
  activeTabNames,
  onToggleSubMenu,
  onNavigate,
  iconClassName,
}: Props) => {
  return (
    <>
      {items.map((item) => {
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
            iconClassName={iconClassName}
          />
        );
      })}
    </>
  );
};

export default SidebarNavList;
