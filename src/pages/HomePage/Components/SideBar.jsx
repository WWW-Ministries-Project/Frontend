    import { NavLink } from "react-router-dom";
import PropTypes from 'prop-types';
import home from "/src/assets/sidebar/home.svg";
import Reports from "/src/assets/sidebar/report.svg";
import Members from "/src/assets/sidebar/members.svg";
import Users from "/src/assets/sidebar/user.svg";
import Management from "/src/assets/sidebar/management.svg";
import Settings from "/src/assets/sidebar/settings.svg";
// import Reports from "../assets/images/icons/Reports.png"
// import Support from "../../../assets/images/icons/Support.png";


const  SideBar = (props)=> {
    const items=['Dashboard','Reports','Members',"Manage users","Assets management","Settings"]
    const icons=[home,Reports,Members,Users,Management,Settings]

    function handleClick() {
        props.onClick(true) 
    }

    return (
        // <>
            <div className='w-[15.5%] min-h-screen text-white fixed bg-red-400' style={props.style}>
                {items.map((item,index)=>
                    <NavLink to={items[index]} className="hover:bg-primaryViolet active:bg-[#59AFFF] h-10 " style={({ isActive }) => 
                    (isActive ? {background: '#6539C3'} : null)} key={index} >
                        <div className=' p-4 flex items-center bg-inherit' onClick={handleClick} >
                        <img src={icons[index]} alt={icons[index] + " icon"} className="mr-5"  />
                            <div>{item}</div>
                            
                        </div>
                    </NavLink>
                    
                )}
            </div>
        // </>
    )
};

SideBar.propTypes = {
    onClick: PropTypes.func,
    style: PropTypes.object,
}
export default SideBar