import { logOut } from "@/pages/Authentication/utils/helpers";
import { sideTabs } from "@/routes/appRoutes";
import { removeToken } from "@/utils/helperFunctions";
import { useEffect, useRef, useState } from "react";
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
  "Life Centers":UsersIcon
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

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, hoverDelayMs);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsExpanded(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
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

  const closeAllSubMenus = () => {
    setOpenMenus({});
  };

  useEffect(() => {
    closeAllSubMenus();
  }, [location.pathname]);

  return (
    <div
      className={`h-screen flex flex-col justify-between transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      } ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col space-y-2 py-4">
        {sideTabs.map(
          (item) => {
            const IconComponent = icons[item.name!];
            if (!IconComponent) return null;
            if (item.isPrivate && !permissions[item.permissionNeeded])
              return null;

            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path) ||
              location.pathname.includes(item.path);

            useEffect(() => {
              if (isActive && item.children) {
                setOpenMenus((prev) => ({
                  ...prev,
                  [item.name]: true,
                }));
              }
            }, [isActive, item.name, item.children]);

            return (
              <div key={item.name} className="cursor-pointer">
                {item.children ? (
                  <div>
                    {(isActive || openMenus[item.name!]) && (
                      <div className="flex justify-end">
                        <div className="shape"></div>
                      </div>
                    )}
                    {/* TODO: fix this before production */}
                    <SideBarSubMenu
                      item={item}
                      parentPath={item.path}
                      show={isExpanded}
                      showChildren={openMenus[item.name] || false}
                      toggleSubMenu={() => toggleSubMenu(item.name)}
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
          }
        )}

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

export default SideBar;
