
import arrowDown from "/src/assets/down.svg";
import hamburger from "/src/assets/sidenav.svg";
// import SearchBar from "../../../components/SearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import {ProfilePicture} from "@/components";
import ChurchLogo from "@/components/ChurchLogo";

function Header({ handleShowNav }) {
  const navigate = useNavigate();
  const [showLogOut, setShowLogOut] = useState(false);
  const { logout } = useAuth();
  const handleClick = () => {
    setShowLogOut(prev => !prev);
  };
  const handleLogOut = () => {
    removeToken();
    logout();
    navigate("/login");
  }
  return (
    <div className="flex items-center ">
      <header className="flex justify-between  items-center  w-full  pb-3">
        <div className="flex items-center gap-x-6  ">
        
                    <div className="">
                    <ChurchLogo show={true} className={'h-3'} />
                    </div>
                    <img src={hamburger} alt="" onClick={handleShowNav} className="cursor-pointer inline sm:inline md:inline text-primary lg:hidden" />
                   
                  </div>
        
        <div className="w-[40.9%]">
        </div>

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          {/* <img src={bell} alt="" /> */}
          {/* <div> */}
          <div className="flex items-center rounded-xl  gap-x-3 cursor-pointer" onClick={handleClick}>
            <ProfilePicture src={decodeToken()?.profile_img} className={"w-[2rem] h-[2rem] bg-lightGray/50 border  border-primary text-primary "} name={decodeToken()?.name} alt="profile picture" />
            <span className="text-primary font-semibold">{decodeToken()?.name}</span>
            {/* <img src={arrowDown} alt="arrow down  text-primary" onClick={handleClick} /> */}
          </div>
          {showLogOut ? (
            <div onClick={handleLogOut} className="absolute z-100 top-16 lg:right-8 p-5 rounded-lg bg-white flex shadow-xl  items-center hover:bg-neutralGray cursor-pointer ">
              LogOut
            </div>
          ) : null}
          {/* </div> */}
        </div>
      </header>
    </div>
  );
}

export default Header;
