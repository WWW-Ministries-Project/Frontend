import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import LoginIcon from "@/assets/sidebar/LoginIcon";
import LogoutIcon from "@/assets/sidebar/Logout";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import ChurchLogo from "@/components/ChurchLogo";
import PropTypes from "prop-types";
import { useState } from "react";
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

  const returnChild = (child, parentPath) => {
    return {
      path: `${parentPath}/${child.path}`,
      name: child.name,
    };
  };

  return (
    <div
      className="mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`borde mx-auto px-1 lg:h-full xs:h-[6vh] xs:rounded-t-2xl lg:rounded-2xl pt-1 fixed bg-whit z-10 ${!show ? "lg:w-10 lg:min-w-[3.7vw]" : "lg:w-[15%] lg:min-w-[200px]"
          } transition-all duration-400 linear xs:min-h-[initial] xs:h-[70px] xs:w-full xs:bottom-0 xs:left-0 xs:flex xs:flex-row lg:flex-col  `}
        style={props.style}
      >
        <div
          className={`xs:hidden lg:inline mb-10 mt-4 ${!show ? "mx-auto " : ""
            } xs:pb-0 xs:flex xs:items-center`}
        >
          {show ? (
            <div className="flex gap-x-4 ">
              <ChurchLogo show={show} />
              <div
                className="flex my-auto cursor-pointer"
                onClick={handleClick}
              >
                <LogoutIcon />
              </div>
            </div>
          ) : (
            <div onClick={handleClick}>
              <div>
                {isHovered ? (
                  <div className="flex justify-center rounded-xl  p-2 shadow-xl shadow-inner cursor-pointer bg-[#6539C310] border-[#6539C3] text-[#6539C3] border border-1 shadow-inner drop-shadow shadow-2xl">
                    {" "}
                    <LoginIcon />{" "}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <ChurchLogo />
                  </div>
                )}
              </div>
            </div>
          )}
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
              <>
                {
                  item.children ? (
                    console.log(item, "item"),
                      <SideBarSubMenu item={item} parentPath={item.path} show={show} > <IconComponent className={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`} /> </SideBarSubMenu>
                  ) : (<NavigationLink item={item} index={index} show={show}>
                    <IconComponent
                      className={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                        }`}
                    /> {show && item.name}</NavigationLink>)
                }
              </>
            );
          })}
        </div>
        {/* <div className='flex pb-2 hover:border-[#6539C3] hover:border-l-2  transition h-10 z-10 flex items-center py-7 lg:my-5 ${!show ? " justify-center" : "px-2 py-7 mx-2"} my-2 rounded-xl ${isActive ? "bg-[#6539C3] text-white shadow-lg" : "hover:text-primaryViolet"} xs:my-0 xs:flex- xs:p-2 xs:h-full'>
                <LogoutIcon />{show && <div className='xs:hidden lg:block'>{'Logout'}</div>}
                </div> */}
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
// {item.children?.length ? (
//   <>
//     {!show && (
//       <>
//         {item?.children?.map((child, idx) => {
//           if (!IconComponent) {
//             return null;
//           }
//           return (
//             <NavigationLink item={returnChild(child,item["path"])} index={idx} show={show}>
//             {IconComponent && (
//               <IconComponent
//                 className={`${
//                   show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
//                 }`}
//               />
//             )}
//             {/* {item.key} */}
//             {show && (
//               <div className="xs:hidden lg:block">{item["name"]}</div>
//             )}
//           </NavigationLink>
//           );
//         })}
//       </>
//     ) }
//   </>
// ) : (
//   <NavigationLink item={item} index={index} show={show}>
//     {IconComponent && (
//       <IconComponent
//         className={`${
//           show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
//         }`}
//       />
//     )}
//     {/* {item.key} */}
//     {show && (
//       <div className="xs:hidden lg:block">{item["name"]}</div>
//     )}
//   </NavigationLink>
// )}