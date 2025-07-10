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
    setOpenMenus({})
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
      const isActive =
        location.pathname === item.path ||
        location.pathname.startsWith(item.path) ||
        location.pathname.includes(item.path);
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
      className={`h-screen flex flex-col justify-between transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      } ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col space-y-2 py-4 flex-1">
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

        {/* Logout Section */}
        <div
          className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-100 rounded-md mt-auto mb-4"
          onClick={handleLogOut}
          aria-label="Logout"
        >
          <LogoutIcon className="w-6 h-6 text-gray-600" />
          {isExpanded && (
            <span className="transition-opacity duration-200">Logout</span>
          )}
        </div>
      </div>
    </div>
  );
};
