import PropTypes from 'prop-types';
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthWrapper";
import { sideTabs } from "../utils/helperFunctions";
import leftArrow from "/src/assets/leftArrow.svg";
import rightArrow from "/src/assets/rightArrow.svg";
import Home from "/src/assets/sidebar/home.svg";
import Management from "/src/assets/sidebar/management.svg";
import Members from "/src/assets/sidebar/members.svg";
import Reports from "/src/assets/sidebar/report.svg";
import Settings from "/src/assets/sidebar/settings.svg";
import Users from "/src/assets/sidebar/user.svg";
import Wavesb from "../../../assets/wavesb.svg";
import ChurchLogo from '@/components/ChurchLogo';

const SideBar = ({ show, ...props }) => {
    const items = sideTabs;
    const icons = [Home, Members, Management, Reports, Users, Management, Settings];
    const { user: { permissions } } = useAuth();

    function handleClick() {
        props.onClick();
    }

    return (
        <div className="fixed top-0">
        <div className={`min-h-screen pt-4 text-black  bg-white shadow-sm z-10 ${!show ? "w-10 min-w-[2vw]" : "w-[15%] min-w-[200px]"} transition-all duration-400 linear`} style={props.style}>
            {items.map((item, index) => permissions["view_" + item["key"]] &&
                <NavLink 
                    to={items[index]["key"]} 
                    className={`hover:bg-[#9D7ED7] hover:text-white h-10 z-10  flex items-center  py-7 ${!show ? " justify-center" : "px-2 py-7 mx-2"}   my-2 rounded-xl `}
                    style={({ isActive }) => 
                        (isActive ? { background: '#6539C3', color: "white", boxShadow:"2px 2px 5px 2px #00000040" } : null)} 
                    key={index}
                >
                    <img src={icons[index]} alt={`${icons[index]} icon`} className={`${show ? "mr-2" : " min-w-[1rem] min-h-[20px]"}`} />
                    {show && <div>{item["name"]}</div>}
                </NavLink>
            )}
            <span
                className={`absolute gradientBtn h-6 w-6 rounded-full flex items-center py-0 px-2 shadow-md z-40 my-2  top-0 hideNav ${show ? "left-[80%] mx-10" : "left-0 mx-7"}`} 
                onClick={handleClick}
            >
                {show ? <img src={leftArrow} alt="expand side" className="divs" /> : <img src={rightArrow} alt="minimize side" />}
            </span>

            {/* <img className='absolute bottom-0 border' src={Wavesb} alt=""  /> */}
        </div>
        {/* <img className='absolute bottom-0 border' src={Wavesb} alt=""  /> */}
        </div>
    );
};

SideBar.propTypes = {
    onClick: PropTypes.func,
    style: PropTypes.object,
    show: PropTypes.bool,
};

export default SideBar;
