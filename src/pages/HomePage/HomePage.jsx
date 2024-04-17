import { Outlet, Navigate } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import { useEffect, useState } from "react";
import NewMember from "./Components/NewMember";
import axios from "../../axiosInstance.js";
import { baseUrl } from "../Authentication/utils/helpers";
import { useMemo } from "react";
import { decodeToken, getToken } from "../../utils/helperFunctions";


function HomePage() {
  const [userValue, setUserValue] = useState({"password": "123456","department_id": "","name": "","email": "","primary_number": "","date_of_birth": "","gender": "","is_active": true,"address": "","occupation": "","company": "","department_head": 0,"country": ""});
  const [userStats, setUserStats] = useState({males: 0, females: 0, total: 0});
  const [displayForm, setDisplayForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [updatedDepartment, setUpdatedDepartment] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = getToken();

  //side nav
  const [show,setShow]=useState(true);
  const handleShowNav = () => {
    setShow((prev) => !prev);
  }

  const selectOptions = useMemo(() => {
    return departmentData.map((department) => {
      return { name: department.name, value: department.id };
    });
  })

  const CloseForm = () => {
    setDisplayForm(false);
  }

  //initial data fetching
  useEffect(() => {
    axios.get(`${baseUrl}/user/list-users`).then((res) => {
      setMembers(res.data.data);
    });
    axios.get(`${baseUrl}/user/stats-users`).then((res) => {
      setUserStats(res.data.data);
    })
    // axios.get(`${baseUrl}/department/list-departments`).then((res) => {
    //   setDepartmentData(res.data.data);

    // });
  },[]);
  useEffect(() => {
    axios.get(`${baseUrl}/department/list-departments`).then((res) => {
      setDepartmentData(res.data.data);
    });
  },[updatedDepartment]);


  //adding new users
  function handleChange(name, value) {
    if(name === "department_id"){
      setUserValue((prev) => ({ ...prev, [name]: parseInt(value) }));
    }
    else
    setUserValue((prev) => ({ ...prev, [name]: value }));
  }
  const addNewMember = () => {
  // const addNewMember = (value) => {// moving user to parent component 
    setLoading(true);
    axios
    .post(`${baseUrl}/user/register`, userValue)
    .then((response) => {
      setLoading(false);
      setUserValue({"password": "123456","department_id": 0,"name": "","email": "","primary_number": "","date_of_birth": "","gender": "","is_active": true,"address": "","occupation": "","company": "","country": "","last_visited":"","member_since":""});
      setDisplayForm(false);
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
    // setFilter(val);
  };
  return (
    <>
      {token ?
      (<><Header />
      <main className="min-h-screen max-w-screen" onClick={CloseForm}>
        <SideBar style={{ paddingTop: "90px" }} onClick={handleShowNav} show={show} />
        <section className={` h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ${!show ? "ml-10" : "ml-[15.55%]"} `}>
          <Outlet context={{ setDisplayForm, CloseForm, members, filter,setFilter, handleSearchChange, departmentData, setDepartmentData, userStats}} />
        </section>
      </main>
      {true ? (
         <NewMember CloseForm={CloseForm} userValue={userValue} onChange={handleChange} onSubmit={addNewMember} selectOptions={selectOptions} className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1500 ${displayForm ? "translate-x-0" : "translate-x-full"}`} loading={loading} />
      ) : null}</>):(<Navigate to="/login" />)}
    </>
  );
}

export default HomePage;
