import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import { useEffect, useState } from "react";
import NewMember from "./Components/NewMember";
import axios from "../../axiosInstance.js";
import { baseUrl } from "../Authentication/utils/helpers";
import { useMemo } from "react";


function HomePage() {
  const [displayForm, setDisplayForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectOptions = useMemo(() => {
    return departmentData.map((department) => {
      return { name: department.name, value: department.id };
    });
  })

  const CloseForm = () => {
    setDisplayForm(false);
  }
  useEffect(() => {
    axios.get(`${baseUrl}/user/list-users`).then((res) => {
      setMembers(res.data.data);
    });
    axios.get(`${baseUrl}/department/list-departments`).then((res) => {
      setDepartmentData(res.data.data);

    });
  },[]);
  const addNewMember = (value) => {
    setLoading(true);
    axios
    .post(`${baseUrl}/user/register`, value)
    .then((response) => {
      setDisplayForm(false);
      setLoading(false);
      setMembers([response.data.data,...members]);
    })
    .catch((error) => {
      setLoading(false);
      console.log(error);
    });
  }

  //table manipulation
  const [filter, setFilter] = useState("");

  const handleSearchChange = (val) => {
    setFilter(val);
  };
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-screen" onClick={CloseForm}>
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ">
          <Outlet context={{ setDisplayForm, members, filter,setFilter, handleSearchChange, departmentData }} />
        </section>
      </main>
      {true ? (
         <NewMember CloseForm={CloseForm} onSubmit={addNewMember} selectOptions={selectOptions} className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} loading={loading} />
      ) : null}
    </>
  );
}

export default HomePage;
