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
import { useNavigate } from "react-router-dom";
import { removeToken } from "@/utils/helperFunctions";
import { logOut } from "@/pages/Authentication/utils/helpers";
import LogoutIcon from "@/assets/sidebar/Logout";

// const navigate = useNavigate();
//  const { logout } = useAuth();
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

   const handleLogOut = () => {
      removeToken();
      logOut();
      navigate("/login");
    }

  return (
    <div
      className="h-full mx-auto flex flex-col justify-between items-center  pr-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={` space-y-6  mx-auto  lg:h-full xs:h-[6vh] xs:rounded-t-2xl lg:rounded-2xl pt-1 bg-whit z-10 ${!show ? "" : " "
          } transition-all duration-400 linear xs:min-h-[initial] xs:h-[70px] xs:w-full xs:bottom-0 xs:left-0 xs:flex xs:flex-row lg:flex-col  `}
        style={props.style}
      >
        


        {/* navigation links */}
        <div className="xs:flex lg:flex-col  justify-around xs:w-full overflow-y-auto">
          {items.map((item) => {
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
                    <SideBarSubMenu item={item} parentPath={item.path} show={show} > <IconComponent className={`${show ? "" : ""
                      }`} /> </SideBarSubMenu>
                  ) : (<NavigationLink item={item} show={show}>
                    <IconComponent
                      className={`${show ? "" : ""
                        }`}
                    /> {show && item.name}</NavigationLink>)
                }
              </div>
            );
          })}
        </div>
        
      </div>
     <div className="xs:hidden lg:flex  items-center w-full  bg-white mx-auto" >
     {/* <img src={LogoutIcon} alt="" onClick={''} className="cursor-pointer inline sm:inline md:inline text-dark900" /> */}
     <div className="flex items-center gap-1 rounded-lg hover:bg-gray-100 hover:border cursor-pointer p-2 " onClick={()=>logOut()}>
     <LogoutIcon/>
     {show&&<p>Logout</p>}
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
