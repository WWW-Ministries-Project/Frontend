import type { AppRoute } from "@/routes/appRoutes";
import { sideTabs } from "@/routes/appRoutes";
import { useEffect, useRef, useState } from "react";
import { sidebarIcons } from "../utils";
import { NavigationLink } from "./NavigationLink";
import { SideBarSubMenu } from "./SidebarSubmenu";

interface IProps {
  show: boolean;
  onClick?: () => void;
}

export const MobileSideBar = ({ show, onClick }: IProps) => {
  const items: AppRoute[] = sideTabs;
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!show) setOpenSubMenu(null);
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        if (onClick) onClick();
        setOpenSubMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClick]);

  const handleToggleSubMenu = (name: string) => {
    setOpenSubMenu((prev) => (prev === name ? null : name));
  };

  const handleLinkClick = () => {
    setOpenSubMenu(null);
    if (onClick) onClick();
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        top: "var(--app-header-height)",
        height: "calc(100dvh - var(--app-header-height))",
      }}
      className={`fixed left-0 z-[60] rounded-r-xl bg-white shadow-xl transition-transform duration-300 ease-in-out transform overflow-auto ${
        show ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-full w-[250px] p-4">
        {/* navigation links */}
        <div className="overflow-y-auto">
          {items.map((item) => {
            const IconComponent = sidebarIcons[item.name];

            if (!IconComponent) {
              if (process.env.NODE_ENV === "development") {
                console.error(`Icon component for ${item.name} not found`);
              }
              return null;
            }

            return (
              <div key={item.name}>
                {item.children && item.children.some((child) => child.sideTab) ? (
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
                    <button
                      type="button"
                      onClick={handleLinkClick}
                      className="w-full flex items-center gap-2 text-left"
                      aria-label={item.name}
                    >
                      <IconComponent
                        className={`${
                          show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                        }`}
                      />
                      {show && item.name}
                    </button>
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
