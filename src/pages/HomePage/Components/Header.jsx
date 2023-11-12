import profilePic from "/src/assets/images/profilePic.png";
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";
import ChurchLogo from "../../../components/ChurchLogo";
import SearchBar from "../../../components/SearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeToken, getToken } from "../../../utils/helperFunctions";

function Header() {
  const navigate = useNavigate();
  const [showLogOut, setShowLogOut] = useState(false);
  const token = getToken();
  const handleClick = () => {
    setShowLogOut(prev => !prev);
  };
  const handleLogOut = () => {
    navigate("/login");
  }
  return (
    <>
      <header className="flex justify-between h-16 items-center bg-white px-3 fixed w-full z-10">
        <ChurchLogo />
        <div className="w-[40.9%]">
          <SearchBar placeholder="Search here" />
        </div>

        <div className="w-[246px] flex justify-between items-center">
          <img src={bell} alt="" />
          {/* <div> */}
          <img src={profilePic} alt="profile pic" />
          <span>{decodeToken(token).name}</span>
          <img src={arrowDown} alt="arrow down" onClick={handleClick} />
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
