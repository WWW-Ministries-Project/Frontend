import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import LoginIcon from "@/assets/sidebar/LoginIcon";
import LogoutIcon from "@/assets/sidebar/Logout";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import ChurchLogo from "@/components/ChurchLogo";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../auth/AuthWrapper";
// import { sideTabs } from "../utils/helperFunctions";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";
import { sideTabs } from "/src/routes/appRoutes";
const icons = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  "Manage User": MembersIcon, // TODO: replace this
  // Attendance: AttendanceIcon,
  Events: ManagementIcon,
  // Finance: FinanceIcon,
  Assets: InstrumentIcon,
  Settings: SettingsIcon,
  Requests: ManagementIcon,
};

const SideBarMobile = ({ show, ...props }) => {
  const items = sideTabs;
  const {
    user: { permissions },
  } = useAuth();

  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        props.onClick(); // Close the sidebar
      }
    }

    // Only add the event listener if the sidebar is shown
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, props]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed  top-14 left-0 h-full bg-white transition-transform duration-300 ease-in-out transform shadow-xl ${
        show ? "translate-x-0" : "-translate-x-full"
      } z-50`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-full w-[250px] p-4">
        {/* navigation links */}
        <div className=" overflow-y-auto">
          {items.map((item, index) => {
            const IconComponent = icons[item.name];

            if (!IconComponent) {
              console.error(`Icon component for ${item.name} not found`);
              return null;
            }
            // return permissions["view_" + item["key"]] && (
            return (
              <>
                {item.children ? (
                  <SideBarSubMenu
                    item={item}
                    parentPath={item.path}
                    show={show}
                  >
                    {" "}
                    <IconComponent
                      className={`${
                        show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`}
                    />{" "}
                  </SideBarSubMenu>
                ) : (
                  <NavigationLink item={item} index={index} show={show}>
                    <IconComponent
                      className={`${
                        show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`}
                    />{" "}
                    {show && item.name}
                  </NavigationLink>
                )}
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
};

SideBarMobile.propTypes = {
  onClick: PropTypes.func,
  style: PropTypes.object,
  show: PropTypes.bool,
  className: PropTypes.string,
};

export default SideBarMobile;
