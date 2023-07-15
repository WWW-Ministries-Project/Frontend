import SideBar from "../HomePage/Components/SideBar";

function DashBoard() {
  return (
    <>
      <header className="flex justify-between h-16 items-center bg-white px-3 fixed w-full z-10">
        <div className="flex">
          <img src="/logo/main-logo.svg" alt="logo" className="inline w-[60px] " />
          <div className="flex flex-col justify-center items-center text-sm">
            <span className="text-black font-bold text-bold ">Worldwide Word</span>
          <span className="text-black tracking-[.2em]">MINISTRIES</span>
          </div>
          
        </div>
        <div className="w-[40.9%] bg-[#F4FAF7F7] rounded-md py-1 opacity-50 ">
          <form className="w-full text-wwwGrey2 flex items-center  px-2 text-sm font-normal leading-6">
            <img role="submit button" src="/src/assets/search.svg" alt="search"  className="inline mr-2"/>
              
            <input type="text" placeholder="Search here" name="search" className="bg-inherit border-0 focus:outline-none focus:border-2 w-full px-2" />
          </form>
        </div>
        <div className="w-[246px] flex justify-between items-center">
            <img src="/src/assets/bell.svg" alt="" />
            {/* <div> */}
                <img src="/src/assets/images/profilePic.png" alt="profile pic" />
                <span>Apostle Chris</span>
                <img src="/src/assets/down.svg" alt="arrow down" />
            {/* </div> */}
        </div>
      </header>
      <main className=" w-screen h-screen">
        <SideBar style={{ paddingTop: "90px" }}/>
      </main>
    </>
  );
}

export default DashBoard;
