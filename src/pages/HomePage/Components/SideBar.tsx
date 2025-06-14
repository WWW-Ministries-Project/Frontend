import { logOut } from "@/pages/Authentication/utils/helpers";
import { sideTabs } from "@/routes/appRoutes";
import { removeToken } from "@/utils/helperFunctions";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";

import { MembersIcon } from "@/assets";
import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import LogoutIcon from "@/assets/sidebar/Logout";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MinistrySchoolIcon from "@/assets/sidebar/MinistrySchoolIcon";
import RequestIcon from "@/assets/sidebar/RequestIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import VisitorIcon from "@/assets/sidebar/VisitorIcon";
import LifeCenterIcon from "@/assets/sidebar/LifeCenterIcon";

interface IProps {
  className?: string;
  show?: boolean;
  onClick?: () => void;
}

const icons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  Visitors: VisitorIcon,
  Users: UsersIcon,
  Events: ManagementIcon,
  Assets: InstrumentIcon,
  "School of Ministry": MinistrySchoolIcon,
  Settings: SettingsIcon,
  Requests: RequestIcon,
  "Life Centers": LifeCenterIcon,
};

const SideBar = ({ className }: IProps) => {
  const {
    user: { permissions },
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const hoverTimerRef = useRef<number | null>(null);
  const hoverDelayMs = 300;

  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, hoverDelayMs);
  }, [hoverDelayMs]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsExpanded(false);
  }, []);

  const handleLogOut = useCallback(() => {
    removeToken();
    logOut();
    navigate("/login");
  }, [navigate]);

  const toggleSubMenu = useCallback((menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  }, []);

  const closeAllSubMenus = useCallback(() => {
    setOpenMenus({});
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Close submenus when location changes
  useEffect(() => {
    closeAllSubMenus();
  }, [location.pathname, closeAllSubMenus]);

  // Set active menu as open
  useEffect(() => {
    sideTabs.forEach((item) => {
      const isActive =
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/") ||
        (item.path !== "/" && location.pathname.includes(item.path));

      if (isActive && item.children && item.name) {
        setOpenMenus((prev) => ({
          ...prev,
          [item.name!]: true,
        }));
      }
    });
  }, [location.pathname]);

  return (
    <div
      className={`h-screen flex flex-col justify-between transition-all duration-300 bg-white  ${
        isExpanded ? "w-64" : "w-16"
      } ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col space-y-2 py-4 flex-1 overflow-y-auto">
        {sideTabs
          .filter((item) => {
            // Filter out items that don't have required permissions
            if (item.isPrivate && !permissions?.[item.permissionNeeded]) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const IconComponent = item.name ? icons[item.name] : null;
            if (!IconComponent || !item.name) return null;

            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/") ||
              (item.path !== "/" && location.pathname.includes(item.path));

            return (
              <div key={item.name} className="cursor-pointer">
                {item.children ? (
                  <div>
                    {(isActive || openMenus[item.name]) && (
                      <div className="flex justify-end">
                        <div className="shape"></div>
                      </div>
                    )}
                    <SideBarSubMenu
                      item={item}
                      parentPath={item.path}
                      show={isExpanded}
                      showChildren={openMenus[item.name] || false}
                      toggleSubMenu={() => toggleSubMenu(item.name!)}
                    >
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </SideBarSubMenu>
                    {(isActive || openMenus[item.name]) && (
                      <div className="flex justify-end">
                        <div className="Bshape"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isActive && (
                      <div className="flex justify-end">
                        <div className="shape"></div>
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
                    {isActive && (
                      <div className="flex justify-end">
                        <div className="Bshape"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Logout Section - Fixed positioning */}
      <div className="border-t border-gray-200 p-2">
        <div
          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors duration-200"
          onClick={handleLogOut}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogOut();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Logout"
        >
          <LogoutIcon className="w-6 h-6 text-gray-600" />
          {isExpanded && (
            <span className="transition-opacity duration-200 text-gray-700">
              Logout
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;