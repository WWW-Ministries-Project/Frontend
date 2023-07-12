function DashBoard() {
  return (
    <>
      <header>
        <div className="">
          <img src="/logo/main-logo.svg" alt="logo" className="inline " />
          <span className="text-[#080808] text-bold">Worldwide Word</span>
          <span className="text-black">MINISTRIES</span>
        </div>
        <div>
          <form>
            <input type="text" placeholder="Search.." name="search" className="" />
            <button type="submit">
              <i class="fa fa-search"></i>
            </button>
          </form>
        </div>
        <div>
            <img src="/src/assets/bell.svg" alt="" />
            <div>
                <img src="/src/assets/images/profilePic.png" alt="profile pic" />
                <span>Apostle Chris</span>
                <img src="/src/assets/down.svg" alt="arrow down" />
            </div>
        </div>
      </header>
      <main>
        
      </main>
    </>
  );
}

export default DashBoard;
