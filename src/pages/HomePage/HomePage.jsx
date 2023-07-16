import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";

function HomePage() {
  return (
    <>
      <Header />
      <main className="h-screen w-screen">
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA]">
            <Outlet/>
        </section>
      </main>
    </>
  );
}

export default HomePage;
