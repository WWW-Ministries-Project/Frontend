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
      setMembers(res.data);
    });
  },[]);
  const addNewMember = (value) => {
    axios
    .post(`${baseUrl}/member/create-member`, value)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });
  }
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-screen" onClick={CloseForm}>
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ">
          <Outlet context={{ setDisplayForm, members }} />
        </section>
      </main>
      {true ? (
         <NewMember CloseForm={CloseForm} onSubmit={addNewMember} className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} />
      ) : null}
    </>
  );
}

export default HomePage;
