import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import ChurchLogo from "@/components/ChurchLogo";
import PropTypes from "prop-types";
import { useState } from "react";
import { useAuth } from "../../../context/AuthWrapper";
// import { sideTabs } from "../utils/helperFunctions";
import RequestIcon from "@/assets/sidebar/RequestIcon";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";
import { sideTabs } from "/src/routes/appRoutes";
const icons = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  "Users": UsersIcon, // TODO: replace this
  // Attendance: AttendanceIcon,
  Events: ManagementIcon,
  // Finance: FinanceIcon,
  Assets: InstrumentIcon,
  Settings: SettingsIcon,
  Requests: RequestIcon,
};

const SideBar = ({ show, ...props }) => {
  const items = sideTabs;
  const {
    user: { permissions },
  } = useAuth();

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  function handleClick() {
    props.onClick();
  }

  return (
    <div
      className="mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`space-y-8 mx-auto px-2 lg:h-[100vh] xs:h-[6vh] xs:rounded-t-2xl lg:rounded-2xl pt-1 bg-whit z-10 ${!show ? "lg:w-10 lg:min-w-[3.7vw]" : " lg:min-w-[200px]"
          } transition-all duration-400 linear xs:min-h-[initial] xs:h-[70px] xs:w-full xs:bottom-0 xs:left-0 xs:flex xs:flex-row lg:flex-col  `}
        style={props.style}
      >
        <div
          className={`xs:hidden lg:inline  mt-4 ${!show ? "mx-auto " : ""
            } xs:pb-0 xs:flex xs:items-center`}
        >
          {/* {show ? ( */}
          <div className="flex gap-x-4 ">
            <ChurchLogo show={show} className={''} />

          </div>

        </div>


        {/* navigation links */}
        <div className="xs:flex lg:flex-col  justify-around xs:w-full overflow-y-auto">
          {items.map((item, index) => {
            const IconComponent = icons[item.name];

            if (!IconComponent) {
              console.error(`Icon component for ${item.name} not found`);
              return null;
            }
            // return permissions["view_" + item["key"]] && (
            return (
              <div key={item.name}>
                {
                  item.children ? (
                    <SideBarSubMenu item={item} parentPath={item.path} show={show} > <IconComponent className={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`} /> </SideBarSubMenu>
                  ) : (<NavigationLink item={item} index={index} show={show}>
                    <IconComponent
                      className={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                        }`}
                    /> {show && item.name}</NavigationLink>)
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

SideBar.propTypes = {
  onClick: PropTypes.func,
  style: PropTypes.object,
  show: PropTypes.bool,
  className: PropTypes.string,
};

export default SideBar;
