
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";
import ChurchLogo from "../../../components/ChurchLogo";
// import SearchBar from "../../../components/SearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import ProfilePicture from "/src/components/ProfilePicture";
import { useAuth } from "../../../auth/AuthWrapper";

function Header() {
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
    <>
      <header className="flex justify-between h-16 items-center bg-whit px-3 w-full z-20">
        {/* <ChurchLogo /> */}
        <div className="w-[40.9%]">
          {/* <SearchBar placeholder="Search here" value="" onChange={() => {}}/> */}
        </div>

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          <img src={bell} alt="" />
          {/* <div> */}
          {/* <img src={decodeToken().profile_img} alt="profile pic" className="w-10 h-10 rounded-full" /> */}
          <div className="flex border border-[#6539C3] rounded-xl px-2 gap-x-2">
          <ProfilePicture src={decodeToken().profile_img} className={"w-8 h-8    "} name={decodeToken().name} alt="profile picture" />
          {/* <span>{decodeToken().name}</span> */}
          <img src={arrowDown} alt="arrow down" onClick={handleClick} />
          </div>
          {showLogOut ? (
            <div onClick={handleLogOut} className="absolute top-16 right-0 h-16 w-32 bg-white flex justify-center items-center hover:bg-neutralGray cursor-pointer ">
              LogOut
            </div>
          ) : null}
          {/* </div> */}
        </div>
      </header>
    </>
  );
}

export default Header;
