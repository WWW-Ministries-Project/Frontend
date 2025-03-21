import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../../context/AuthWrapper";
import { removeToken } from "@/utils/helperFunctions";
import { logOut } from "@/pages/Authentication/utils/helpers";
import { sideTabs } from "/src/routes/appRoutes";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";

import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import RequestIcon from "@/assets/sidebar/RequestIcon";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import LogoutIcon from "@/assets/sidebar/Logout";
import MinistrySchoolIcon from "@/assets/sidebar/MinistrySchoolIcon";

const icons = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
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

  // Handle hover effects
  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

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
      [menuName]: !prev[menuName], // ✅ Toggle specific menu without affecting others
    }));
  };

    // ✅ Function to close all submenus when route changes
    const closeAllSubMenus = () => {
      setOpenMenus({});
    };
  
    // 🔥 useEffect: Close submenus when route changes
    useEffect(() => {
      closeAllSubMenus();
    }, [location.pathname]);

  return (
    <div
      className={`h-full flex flex-col justify-between b transition-all duration-300 ${
        isExpanded ? "w-64" : "w-15"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Navigation */}
      <div className="flex flex-col space-y-2">
  {sideTabs.map((item) => {
    const IconComponent = icons[item.name];
    if (!IconComponent) return null;

    const isActive =
      location.pathname === item.path ||
      location.pathname.startsWith(item.path) ||
      location.pathname.includes(item.path);

      useEffect(() => {
        if (isActive) {
          setOpenMenus((prev) => ({
            ...prev,
            [item.name]: true,
          }));
        } else {
          setOpenMenus((prev) => ({
            ...prev,
            [item.name]: false,
          }));
        }

        console.log("openMenus", openMenus);
        
      }, [isActive]);
    
      
      

    return (
      
      <div key={item.name} className="cursor-pointer" >
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
                  {(isActive|| openMenus[item.name]) && (
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
                    {isExpanded && <span>{item.name}</span>}
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
      <div className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-100 rounded-md" onClick={handleLogOut}>
        <LogoutIcon className="w-6 h-6 text-gray-600" />
        {isExpanded && <span>Logout</span>}
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
