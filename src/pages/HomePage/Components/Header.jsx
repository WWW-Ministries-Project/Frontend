
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";
// import SearchBar from "../../../components/SearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";
import ProfilePicture from "/src/components/ProfilePicture";

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
      <header className="flex justify-between header items-center  w-full rounded-t-md ">
        {/* <ChurchLogo /> */}
        <div className="w-[40.9%]">
        </div>

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          {/* <img src={bell} alt="" /> */}
          {/* <div> */}
          <div className="flex items-center rounded-xl  gap-x-3">
            <ProfilePicture src={decodeToken().profile_img} className={"w-6 h-6 outline outline-1  "} name={decodeToken().name} alt="profile picture" />
            <span>{decodeToken().name}</span>
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
