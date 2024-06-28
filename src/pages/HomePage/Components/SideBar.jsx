import PropTypes from 'prop-types';
import { useState } from 'react';
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthWrapper";
import { sideTabs } from "../utils/helperFunctions";
import DashboardIcon from '/src/assets/sidebar/DashboardIcon';
import InstrumentIcon from '/src/assets/sidebar/InstrumentIcon';
import LoginIcon from '/src/assets/sidebar/LoginIcon';
import LogoutIcon from '/src/assets/sidebar/Logout';
import ManagementIcon from '/src/assets/sidebar/ManagementIcon';
import MembersIcon from '/src/assets/sidebar/MembersIcon';
import SettingsIcon from '/src/assets/sidebar/SettingIcon';
import ChurchLogo from '/src/components/ChurchLogo';

const icons = {
    // DashboardIcon, 
    // MembersIcon, 
    // ManagementIcon, 
    // // Reports, 
    // // Users, 
    // InstrumentIcon, 
    // SettingsIcon,
    Dashboard: DashboardIcon,
    Members: MembersIcon,
    Events: ManagementIcon,
    // reports: ReportsIcon,
    // users: UsersIcon,
    Assets: InstrumentIcon,
    Settings: SettingsIcon
};


const SideBar = ({ show, ...props }) => {
    const items = sideTabs;
    const { user: { permissions } } = useAuth();

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
        <div className="" onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
            <div className={`min-h-screen pt-4  fixed bg-white shadow-sm z-10 ${!show ? "w-10 min-w-[3vw]" : "w-[15%] min-w-[200px]"} transition-all duration-400 linear`} style={props.style}>
                <div className={` pb-8  ${!show ? "mx-auto " : ""}`}>
                {show?<div className='flex gap-x-4 '><ChurchLogo show={show} /><div className='flex my-auto' onClick={handleClick}><LogoutIcon/></div></div>:<div onClick={handleClick}><div>
      {isHovered ? <div className='flex justify-center'> <LoginIcon/> </div>: <ChurchLogo/> }
    </div></div>}
               

                </div>
                {items.map((item, index) => {
                    const IconComponent = icons[item.key];

                    if (!IconComponent) {
                        console.error(`Icon component for ${item.key} not found`);
                        return null;
                    }

                    return permissions["view_" + item["key"]] && (
                        <NavLink 
                            to={item["key"]} 
                            className={({ isActive }) => 
                                `hover:border-[#6539C3]  hover:border-l-2 transition h-10 z-10 flex items-center py-7 my-5 ${!show ? " justify-center" : "px-2 py-7 mx-2"} my-2 rounded-xl ${isActive ? "bg-[#6539C3] text-white shadow-lg" : "hover:text-primaryViolet"}`}
                            key={index}
                        >
                            <IconComponent className={`${show ? "mr-2" : "min-w-[1rem] min-h-[20px]"}`} />
                            {show && <div>{item["name"]}</div>}
                        </NavLink>
                    );
                })}
                {/* <span
                    className={`absolute gradientBtn h-6 w-6 rounded-full flex items-center py-0 px-2 shadow-md z-40 my-2 top-0 hideNav ${show ? "left-[80%] mx-10" : "left-0 mx-7"}`} 
                    onClick={handleClick}
                >
                    {show ? <img src={leftArrow} alt="expand side" className="divs" /> : <img src={rightArrow} alt="minimize side" />}
                </span> */}
            </div>
        </div>
    );
};

SideBar.propTypes = {
    onClick: PropTypes.func,
    style: PropTypes.object,
    show: PropTypes.bool,
};

export default SideBar;