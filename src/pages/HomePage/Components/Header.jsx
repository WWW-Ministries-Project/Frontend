import search from "/src/assets/search.svg";
import profilePic from "/src/assets/images/profilePic.png";
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";
import ChurchLogo from "../../../components/ChurchLogo";

function Header() {
  return (
    <>
      <header className="flex justify-between h-16 items-center bg-white px-3 fixed w-full z-10">

        <ChurchLogo></ChurchLogo>
        <div className="w-[40.9%] bg-white rounded-md py-1 opacity-50 border border-[#f2f2f2]">
          <form className="w-full text-lightGray flex items-center  px-2 text-sma font-normal leading-6">
            <img
              role="submit button"
              src={search}
              alt="search"
              className="inline mr-2"
            />

            <input
              type="text"
              placeholder="Search here"
              name="search"
              className="bg-inherit border-0 focus:outline-none focus:border-2 w-full px-2"
            />
          </form>
        </div>
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
