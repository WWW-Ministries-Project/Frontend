import profilePic from "/src/assets/images/profilePic.png";
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";
import ChurchLogo from "../../../components/ChurchLogo";
import SearchBar from "../../../components/SearchBar";

function Header() {
  return (
    <>
      <header className="flex justify-between h-16 items-center bg-white px-3 fixed w-full z-10">

        <ChurchLogo/>
        <div className="w-[40.9%]"><SearchBar placeholder="Search here"/></div>
        
        <div className="w-[246px] flex justify-between items-center">
          <img src={bell} alt="" />
          {/* <div> */}
          <img src={profilePic} alt="profile pic" />
          <span>Apostle Chris</span>
          <img src={arrowDown} alt="arrow down" />
          {/* </div> */}
        </div>
      </header>
    </>
  );
}

export default Header;
