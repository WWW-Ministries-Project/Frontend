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
}: IProps) => {
  return (
    <div className="cursor-pointer">
      {item.children && item.children.some((child) => child.sideTab) ? (
        <div>
          {/* Submenu rendering */}
          <SideBarSubMenu
            item={{ ...item, children: item.children ?? [] }}
            parentPath={item.path}
            show={isExpanded}
            showChildren={openMenus[item.name] || false}
            toggleSubMenu={() => toggleSubMenu(item.name)}
          >
            <IconComponent className="w-6 h-6 text-gray-600" />
          </SideBarSubMenu>
        </div>
      ) : (
        <div>
          {/* Navigation link rendering */}
          {isActive && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-top"></div>
            </div>
          )}
          <NavigationLink item={item} show={isExpanded}>
            <IconComponent className="w-6 h-6 text-gray-600" />
            {isExpanded && (
              <span className="ml-2 whitespace-nowrap transition-opacity duration-200">
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