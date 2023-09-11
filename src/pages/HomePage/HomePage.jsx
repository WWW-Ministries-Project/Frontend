import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import { useEffect, useState } from "react";
import NewMember from "./Components/NewMember";
import axios from "axios";
import { baseUrl } from "../Authentication/utils/helpers";


function HomePage() {
  const [displayForm, setDisplayForm] = useState(false);
  const [members, setMembers] = useState([]);
  const CloseForm = () => {
    setDisplayForm(false);
  }
  useEffect(() => {
    axios.get(`${baseUrl}/member/all`).then((res) => {
      console.log(res);
      setMembers(res.data);
    });
  },[]);
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-screen">
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ">
          <Outlet context={{ setDisplayForm, members }} />
        </section>
      </main>
      {displayForm ? (
         <NewMember CloseForm={CloseForm} />
      ) : null}
    </>
  );
}

export default HomePage;
