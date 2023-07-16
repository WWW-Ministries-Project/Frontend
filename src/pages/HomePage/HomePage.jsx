import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";

function HomePage() {
  return (
    <>
      <Header />
      <main className=" w-screen">
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] pt-16">
            <Outlet/>
        </section>
      </main>
    </>
  );
}

export default HomePage;
