import { AppRoute } from "@/routes/appRoutes";
import { NavigationLink } from "./NavigationLink";
import { SideBarSubMenu } from "./SidebarSubmenu";

// SidebarItemProps interface for type safety
interface IProps {
  item: AppRoute;
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  isExpanded: boolean;
  openMenus: Record<string, boolean>;
  toggleSubMenu: (menuName: string) => void;
  onNavigate?: () => void;
  onParentMenuActivate?: () => void;
  iconClassName?: string;
}

/**
 * SidebarItem component renders either a submenu or a navigation link,
 * depending on whether the item has children.
 */
export const SidebarItem = ({
  item,
  IconComponent,
  isActive,
  isExpanded,
  openMenus,
  toggleSubMenu,
  onNavigate,
  onParentMenuActivate,
  iconClassName,
}: IProps) => {
  const iconClass = iconClassName ?? "w-6 h-6 text-gray-600";

  return (
    <div className="cursor-pointer overflow-hidden">
      {item.children && item.children.some((child) => child.sideTab) ? (
        <div className="overflow-hidden">
          {/* Submenu rendering */}
          <SideBarSubMenu
            item={{ ...item, children: item.children ?? [] }}
            parentPath={item.path}
            show={isExpanded}
            showChildren={openMenus[item.name] || false}
            toggleSubMenu={() => toggleSubMenu(item.name)}
            onNavigate={onNavigate}
            onParentActivate={onParentMenuActivate}
          >
            <IconComponent className={iconClass} />
          </SideBarSubMenu>
        </div>
      ) : (
        <div className="overflow-hidden">
          {/* Navigation link rendering */}
          {isActive && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-top"></div>
            </div>
          )}
          <NavigationLink item={item} show={isExpanded} onClick={onNavigate}>
            <IconComponent className={iconClass} />
            {isExpanded && (
              <span className="ml-2 whitespace-nowrap truncate transition-opacity duration-200">
                {item.name}
              </span>
            )}
          </NavigationLink>
          {/* Active indicator shape */}
          {isActive && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-bottom"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
