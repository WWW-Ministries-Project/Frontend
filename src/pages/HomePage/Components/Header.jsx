
import arrowDown from "/src/assets/down.svg";
import hamburger from "/src/assets/hamburger.svg";
// import SearchBar from "../../../components/SearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import ProfilePicture from "/src/components/ProfilePicture";
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
    <div className="">
      <header className="flex justify-between  items-center  w-full  ">
        <div className="flex gap-x-4 ">
                    <ChurchLogo show={true} className={''} />
                    <img src={hamburger} alt="" onClick={handleShowNav} className="cursor-pointer inline sm:inline md:inline text-dark900" />
                  </div>
        
        <div className="w-[40.9%]">
        </div>

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          {/* <img src={bell} alt="" /> */}
          {/* <div> */}
          <div className="flex items-center rounded-xl  gap-x-3">
            <ProfilePicture src={decodeToken()?.profile_img} className={"w-[2rem] h-[2rem]  border border-2 border-dark900 text-dark900 "} name={decodeToken()?.name} alt="profile picture" />
            <span className="text-dark900 font-semibold">{decodeToken()?.name}</span>
            <img src={arrowDown} alt="arrow down  text-dark900" onClick={handleClick} />
          </div>
          {showLogOut ? (
            <div onClick={handleLogOut} className="absolute top-16 lg:right-8 p-5 rounded-lg bg-white flex shadow-xl  items-center hover:bg-neutralGray cursor-pointer ">
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
