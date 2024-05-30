import { useEffect, useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useState from "react-usestateref";
import axios from "../../axiosInstance.js";
import { getToken } from "../../utils/helperFunctions";
import { baseUrl } from "../Authentication/utils/helpers";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import NewMember from "./Components/NewMember";
import { useAuth } from "../../auth/AuthWrapper";


function HomePage() {
  const [userValue, setUserValue, userValueRef] = useState({ "password": "123456", "department_id": "", "name": "", "email": "", "primary_number": "", "date_of_birth": "", "gender": "", "is_active": true, "address": "", "occupation": "", "company": "", "department_head": 0, "country": "", link: "" });
  const [userStats, setUserStats] = useState({ stats: { adults: { male: 0, female: 0, total: 0 }, children: { male: 0, female: 0, total: 0 } } });
  const [displayForm, setDisplayForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [updatedDepartment, setUpdatedDepartment] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = getToken();
  const { user } = useAuth();

  //side nav
  const [show, setShow] = useState(true);
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
      console.log(user, "name");	
      setMembers(res.data.data);
    });
    axios.get(`${baseUrl}/user/stats-users`).then((res) => {
      setUserStats(res.data);
      // console.log(res.data)
    })
    // axios.get(`${baseUrl}/department/list-departments`).then((res) => {
    //   setDepartmentData(res.data.data);

    // });
  }, [user]);
  useEffect(() => {
    axios.get(`${baseUrl}/department/list-departments`).then((res) => {
      setDepartmentData(res.data.data);
    });
  }, [updatedDepartment]);


  //adding new users
  function handleChange(name, value) {
    if (name === "department_id") {
      setUserValue((prev) => ({ ...prev, [name]: parseInt(value) }));
    }
    else
      setUserValue((prev) => ({ ...prev, [name]: value }));
  }
  const addNewMember = () => {
    // const addNewMember = (value) => {// moving user to parent component 
    setLoading(true);
    axios
      .post(`${baseUrl}/user/register`, userValueRef.current)
      .then((response) => {
        setLoading(false);
        setUserValue({ "password": "123456", "department_id": 0, "name": "", "email": "", "primary_number": "", "date_of_birth": "", "gender": "", "is_active": true, "address": "", "occupation": "", "company": "", "country": "", "last_visited": "", "member_since": "" });
        setDisplayForm(false);
        setMembers([response.data.data, ...members]);
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

  const handlePictureUpdate = (obj) => {
    setUserValue(prev => ({ ...prev, photo: obj }))
  }

  return (
    <>
      {token ?
        (<><Header />
          <main className="min-h-screen max-w-screen" onClick={CloseForm}>
            <SideBar style={{ paddingTop: "90px" }} onClick={handleShowNav} show={show} />
            <section className={` h-screen pt-20 px-5 pb-5 bg-[#FAFAFA] ${!show ? "ml-10" : "ml-[15.55%]"} `}>
              <Outlet context={{ setDisplayForm, CloseForm, members, filter, setFilter, handleSearchChange, departmentData, setDepartmentData, userStats }} />
            </section>
          </main>

          <NewMember CloseForm={CloseForm} userValue={userValue} onChange={handleChange} onSubmit={addNewMember} selectOptions={selectOptions} className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1500 ${displayForm ? "translate-x-0" : "translate-x-full"}`} loading={loading} disabled={!userValue.name} handlePictureUpdate={handlePictureUpdate} />
        </>) : (<Navigate to="/login" />)}
    </>
  );
}

export default HomePage;
