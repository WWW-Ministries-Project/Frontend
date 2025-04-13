import { logOut } from "@/pages/Authentication/utils/helpers";
import { removeToken } from "@/utils/helperFunctions";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";
import { sideTabs } from "/src/routes/appRoutes";

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

const icons = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  Visitors: VisitorIcon,
  Users: UsersIcon,
  Events: ManagementIcon,
  Assets: InstrumentIcon,
  "School of Ministry": MinistrySchoolIcon,
  Settings: SettingsIcon,
  Requests: RequestIcon,
};

const SideBar = ({ className, show, ...props }) => {
  const {
    user: { permissions },
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const hoverTimerRef = useRef(null);
  const hoverDelayMs = 300; // Delay in milliseconds before expanding sidebar

  // Handle hover effects with delay
  const handleMouseEnter = () => {
    // Clear any existing timeout to prevent multiple timers
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set a new timeout
    hoverTimerRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, hoverDelayMs);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if mouse leaves before delay completes
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Immediately collapse sidebar
    setIsExpanded(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Handle Logout
  const handleLogOut = () => {
    removeToken();
    logOut();
    navigate("/login");
  };

  function handleClick() {
    if (props.onClick) props.onClick();
  }

  const toggleSubMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Function to close all submenus when route changes
  const closeAllSubMenus = () => {
    setOpenMenus({});
  };

  // Close submenus when route changes
  useEffect(() => {
    closeAllSubMenus();
  }, [location.pathname]);

  return (
    <div
      className={`h-full flex flex-col justify-between transition-all duration-300 ${isExpanded ? "w-64" : "w-16"
        } ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Navigation */}
      <div className="flex flex-col space-y-2 py-4">
        {sideTabs.map((item) => {
          const IconComponent = icons[item.name];
          if (!IconComponent) return null;

          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path) ||
            location.pathname.includes(item.path);

          // Set submenu open state based on active path
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
                  {/* Apply shape only when active */}
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
                    toggleSubMenu={() => toggleSubMenu(item.name)}
                  >
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </SideBarSubMenu>

                  {/* Apply Bshape only when active */}
                  {(isActive || openMenus[item.name]) && (
                    <div className="flex justify-end">
                      <div className="Bshape"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Apply shape only when active */}
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

                  {/* Apply Bshape only when active */}
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
  );
};

SideBar.propTypes = {
  className: PropTypes.string,
  show: PropTypes.bool,
  onClick: PropTypes.func,
};

export default SideBar;