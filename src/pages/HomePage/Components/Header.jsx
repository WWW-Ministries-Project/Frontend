import search from "/src/assets/search.svg";
import profilePic from "/src/assets/images/profilePic.png";
import bell from "/src/assets/bell.svg";
import arrowDown from "/src/assets/down.svg";

function Header() {
  return (
    <>
      <header className="flex justify-between h-16 items-center bg-error px-3 fixed w-full z-10">
        <div className="flex">
          <img
            src="/logo/main-logo.svg"
            alt="logo"
            className="inline w-[60px] "
          />
          <div className="flex flex-col justify-center items-center text-sm">
            <span className="text-black font-bold text-bold ">
              Worldwide Word
            </span>
            <span className="text-black tracking-[.2em]">MINISTRIES</span>
          </div>
        </div>
        <div className="w-[40.9%] bg-[#F4FAF7F7] rounded-md py-1 opacity-50 ">
          <form className="w-full text-wwwGrey2 flex items-center  px-2 text-sm font-normal leading-6">
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
