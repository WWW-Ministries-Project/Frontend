import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import { useState } from "react";
import NewMember from "./Components/NewMember";

function HomePage() {
  const [displayForm, setDisplayForm] = useState(false);
  const CloseForm = () => {
    setDisplayForm(false);
  }
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-screen">
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ">
          <Outlet context={{ setDisplayForm }} />
        </section>
      </main>
      {displayForm ? (
         <NewMember CloseForm={CloseForm} />
      ) : null}
    </>
  );
}

export default HomePage;
