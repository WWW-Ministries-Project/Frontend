import { NavLink } from "react-router-dom";
import PropTypes from 'prop-types';
import Home from "/src/assets/sidebar/home.svg";
import Reports from "/src/assets/sidebar/report.svg";
import Members from "/src/assets/sidebar/members.svg";
import Users from "/src/assets/sidebar/user.svg";
import Management from "/src/assets/sidebar/management.svg";
import Settings from "/src/assets/sidebar/settings.svg";
import leftArrow from "/src/assets/leftArrow.svg";
import rightArrow from "/src/assets/rightArrow.svg";
// import Reports from "../assets/images/icons/Reports.png"
// import Support from "../../../assets/images/icons/Support.png";


const SideBar = ({ show, ...props }) => {
    const items = ['Dashboard', 'Members', 'Reports', "Manage users", "Assets management", "Settings"];
    const icons = [Home, Members, Reports, Users, Management, Settings];

    function handleClick() {
        props.onClick()

    }

    return (
        // <>
        // <div className='w-[15.5%] min-w-[200px] min-h-screen text-white fixed z-10 bg-white shadow-md  ' style={props.style}>
        <div className={`min-h-screen text-white fixed z-10 bg-white shadow-md  } ${!show ? "w-10 min-w-[40px]" : "w-[15%] min-w-[200px]"} transition-all duration-400  
            linear `} style={props.style}>
            {items.map((item, index) =>
                <NavLink to={items[index]} className="hover:bg-[#9D7ED7] hover:text-white h-10 text-[#8C8C8C]" style={({ isActive }) =>
                    (isActive ? { background: '#6539C3', color: "white" } : null)} key={index} >
                    <div className=' p-4 flex items-center bg-inherit' >
                        <img src={icons[index]} alt={icons[index] + " icon"} className="mr-5" />
                        {show && <div>{item}</div>}
                    </div>
                </NavLink>

            )}
            {/* <div className="h-10 bg-red-400 text-center cursor-pointer" onClick={handleClick}>{show ? "minimize" : ">"}</div> */}
            <span
                className={`max-[1200px]:hidden absolute bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105 h-6 w-6 rounded-full flex items-center py-0 px-2 shadow-md z-40 m-8 top-10 hideNav ${show ? "left-[80%]" : "left-0"} `} onClick={handleClick}>
                {/* <ArrowLeftIcon v-if="store.showAll" /> */}
                {show ? <img src={leftArrow} alt="expand side" className="divs" /> : <img src={rightArrow} alt="minimize side" />}
                {/* <ArrowRightIcon v-else /> */}
            </span>
        </div>
        // </>
    )
};

SideBar.propTypes = {
    onClick: PropTypes.func,
    style: PropTypes.object,
}
export default SideBar