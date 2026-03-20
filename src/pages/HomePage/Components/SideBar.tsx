import { sideTabs } from "@/routes/appRoutes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthWrapper";
import { SidebarNavList } from "./SidebarNavList";

import LogoutIcon from "@/assets/sidebar/Logout";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Keep all modules visible. Route-level guards handle access denial on navigation.
  const filteredTabs = useMemo(() => sideTabs, []);

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
    logout();
    navigate("/login", { replace: true });
  };

  const handleParentMenuActivate = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsExpanded(true);
  };

  const toggleSubMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const updateScrollFades = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const canScroll = scrollHeight - clientHeight > 1;

    if (!canScroll) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    const threshold = 4;
    setShowTopFade(scrollTop > threshold);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - threshold);
  }, []);

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
  }, [activeTabNames, filteredTabs]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(updateScrollFades);
    const handleResize = () => updateScrollFades();
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [filteredTabs, isExpanded, openMenus, location.pathname, updateScrollFades]);

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
      <div
        className={`sidebar-scroll-shell flex-1 ${
          showTopFade ? "sidebar-scroll-shell--top" : ""
        } ${showBottomFade ? "sidebar-scroll-shell--bottom" : ""}`}
      >
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollFades}
          className="sidebar-scroll h-full overflow-y-auto overflow-x-hidden"
        >
          <div className="flex flex-col space-y-2 py-4">
            <SidebarNavList
              items={filteredTabs}
              show={isExpanded}
              openMenus={openMenus}
              activeTabNames={activeTabNames}
              onToggleSubMenu={toggleSubMenu}
              onParentMenuActivate={handleParentMenuActivate}
            />
          </div>
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
