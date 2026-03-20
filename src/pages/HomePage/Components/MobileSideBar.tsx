import type { AppRoute } from "@/routes/appRoutes";
import { sideTabs } from "@/routes/appRoutes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarNavList } from "./SidebarNavList";

interface IProps {
  show: boolean;
  onClick?: () => void;
}

const HOME_ROUTE_BASE = "/home";

const normalizePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "");
  if (!trimmed) return "/";
  return trimmed.replace(/\/{2,}/g, "/");
};

const resolveHomePath = (path: string) => {
  if (!path) return HOME_ROUTE_BASE;
  if (path.startsWith("/")) return normalizePath(path);
  return normalizePath(`${HOME_ROUTE_BASE}/${path}`);
};

const isPathActive = (pathname: string, path: string) => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedPath = normalizePath(path);
  return (
    normalizedPathname === normalizedPath ||
    normalizedPathname.startsWith(`${normalizedPath}/`)
  );
};

export const MobileSideBar = ({ show, onClick }: IProps) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  // Keep all modules visible. Route-level guards handle access denial on navigation.
  const items: AppRoute[] = useMemo(() => sideTabs, []);
  const activeTabNames = useMemo(() => {
    const names: Record<string, boolean> = {};

    items.forEach((item) => {
      const resolvedPath = resolveHomePath(item.path);
      names[item.name] = isPathActive(location.pathname, resolvedPath);
    });

    return names;
  }, [items, location.pathname]);

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
            items={items}
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
