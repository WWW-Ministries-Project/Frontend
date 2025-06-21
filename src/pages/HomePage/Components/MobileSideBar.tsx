import type { AppRoute } from "@/routes/appRoutes";
import { sideTabs } from "@/routes/appRoutes";
import { useState } from "react";
import { sidebarIcons } from "../utils";
import { NavigationLink } from "./NavigationLink";
import { SideBarSubMenu } from "./SidebarSubmenu";

interface IProps {
  show: boolean;
  onClick: () => void;
}

export const MobileSideBar = ({ show, onClick }: IProps) => {
  const items: AppRoute[] = sideTabs;
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const handleToggleSubMenu = (name: string) => {
    setOpenSubMenu((prev) => (prev === name ? null : name));
  };

  const handleLinkClick = () => {
    setOpenSubMenu(null);
    if (onClick) onClick();
  };

  return (
    <div
      className={`absolute top-14 left-0 h-full bg-white transition-transform duration-300 ease-in-out transform overflow-auto ${
        show ? "translate-x-0" : "-translate-x-full"
      } z-50`}
    >
      <div className="h-full w-[250px] p-4">
        {/* navigation links */}
        <div className="overflow-y-auto">
          {items.map((item) => {
            const IconComponent = sidebarIcons[item.name];

            if (!IconComponent) {
              console.error(`Icon component for ${item.name} not found`);
              return null;
            }

            return (
              <div key={item.name}>
                {item.children ? (
                  <SideBarSubMenu
                    item={{ ...item, children: item.children ?? [] }}
                    parentPath={item.path}
                    show={show}
                    showChildren={openSubMenu === item.name}
                    toggleSubMenu={() => handleToggleSubMenu(item.name)}
                  >
                    <IconComponent
                      className={`${
                        show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`}
                    />
                  </SideBarSubMenu>
                ) : (
                  <NavigationLink item={item} show={show}>
                    <div
                      onClick={handleLinkClick}
                      className="w-full flex items-center gap-2"
                    >
                      <IconComponent
                        className={`${
                          show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                        }`}
                      />
                      {show && item.name}
                    </div>
                  </NavigationLink>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
