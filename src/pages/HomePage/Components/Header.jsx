
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
      <header className="flex justify-between header items-center bg-[#dcdde7] p w-full rounded-t-md ">
        {/* <ChurchLogo /> */}
        <div className="w-[40.9%]">
        </div>

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          <img src={bell} alt="" />
          {/* <div> */}
          <div className="flex border border-[#6539C3] rounded-xl  gap-x-6">
            <ProfilePicture src={decodeToken().profile_img} className={"w-8 h-8 outline-transparent  "} name={decodeToken().name} alt="profile picture" />
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
