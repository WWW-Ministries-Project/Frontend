import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarNavList } from "./SidebarNavList";
import { useSideNavTabs } from "./useSideNavTabs";

interface IProps {
  show: boolean;
  onClick?: () => void;
}

export const MobileSideBar = ({ show, onClick }: IProps) => {
  const location = useLocation();
  const { groups, activeTabNames } = useSideNavTabs();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!show) setOpenMenus({});
  }, [show]);

  useEffect(() => {
    setOpenMenus({});
  }, [location.pathname]);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        if (onClick) onClick();
        setOpenMenus({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClick]);

  const handleToggleSubMenu = (menuName: string) => {
    setOpenMenus((prev) => (prev[menuName] ? {} : { [menuName]: true }));
  };

  const handleLinkClick = () => {
    setOpenMenus({});
    if (onClick) onClick();
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        top: "var(--app-header-height)",
        height: "calc(100dvh - var(--app-header-height))",
      }}
      className={`fixed left-0 z-[60] w-[250px] rounded-r-xl bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${
        show ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col p-4">
        {/* navigation links */}
        <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden touch-pan-y">
          <SidebarNavList
            groups={groups}
            show={show}
            openMenus={openMenus}
            activeTabNames={activeTabNames}
            onToggleSubMenu={handleToggleSubMenu}
            onNavigate={handleLinkClick}
            iconClassName={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"}`}
          />
        </div>
      </div>
    </div>
  );
};
