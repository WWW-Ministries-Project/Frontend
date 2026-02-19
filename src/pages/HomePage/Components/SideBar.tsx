import { logOut } from "@/pages/Authentication/utils/helpers";
import { sideTabs } from "@/routes/appRoutes";
import { removeToken } from "@/utils/helperFunctions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { SidebarItem } from "./SidebarItem";

import LogoutIcon from "@/assets/sidebar/Logout";
import { sidebarIcons } from "../utils";

interface IProps {
  className?: string;
  show?: boolean;
  onClick?: () => void;
}

const hoverDelayMs = 300;
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

export const SideBar = ({ className }: IProps) => {
  const {
    user: { permissions },
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const hoverTimerRef = useRef<number | null>(null);

  // Memoize filtered tabs for performance
  const filteredTabs = useMemo(
    () =>
      sideTabs.filter(
        (item) =>
          !item.isPrivate ||
          !item.permissionNeeded ||
          permissions[item.permissionNeeded]
      ),
    [permissions]
  );

  // Handle sidebar expand/collapse on hover
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(
      () => setIsExpanded(true),
      hoverDelayMs
    );
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsExpanded(false);
    setOpenMenus({});
  };

  // Close all submenus when route changes
  useEffect(() => {
    setOpenMenus({});
  }, [location.pathname]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleLogOut = () => {
    removeToken();
    logOut();
    navigate("/login");
  };

  const toggleSubMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Precompute active states for all tabs
  const activeTabNames = useMemo(() => {
    const names: Record<string, boolean> = {};
    filteredTabs.forEach((item) => {
      const resolvedPath = resolveHomePath(item.path);
      const isActive = isPathActive(location.pathname, resolvedPath);
      names[item.name] = isActive;
    });
    return names;
  }, [filteredTabs, location.pathname]);

  // Open submenu if active and has children
  useEffect(() => {
    filteredTabs.forEach((item) => {
      if (activeTabNames[item.name] && item.children) {
        setOpenMenus((prev) => ({
          ...prev,
          [item.name]: true,
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabNames, filteredTabs]);

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      } ${className || ""}`}
      style={{ height: "calc(100dvh - var(--app-header-height))" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Main navigation sidebar"
      role="navigation"
    >
      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll ">
        <div className="flex flex-col space-y-2 py-4">
          {/* Render sidebar items */}
          {filteredTabs.map((item) => {
            const IconComponent = sidebarIcons[item.name!];
            if (!IconComponent) return null;

            const isActive = activeTabNames[item.name];

            return (
              <SidebarItem
                key={item.name}
                item={item}
                IconComponent={IconComponent}
                isActive={isActive}
                isExpanded={isExpanded}
                openMenus={openMenus}
                toggleSubMenu={toggleSubMenu}
              />
            );
          })}
        </div>
      </div>

      {/* Fixed logout section at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <button
          type="button"
          onClick={handleLogOut}
          className="w-full flex items-center gap-2 p-4 hover:bg-gray-100 rounded-md transition-colors text-left"
          aria-label="Logout"
        >
          <LogoutIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
          {isExpanded && (
            <span className="transition-opacity duration-200 whitespace-nowrap">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
