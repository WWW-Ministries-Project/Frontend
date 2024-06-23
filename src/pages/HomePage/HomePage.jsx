import { useEffect, useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useState from "react-usestateref";
import axios, { changeAuth } from "../../axiosInstance.js";
import { getToken } from "../../utils/helperFunctions";
import { baseUrl } from "../Authentication/utils/helpers";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import NewMember from "./Components/NewMember";
import { useAuth } from "../../auth/AuthWrapper";
import useWindowSize from "../../CustomHooks/useWindowSize";
import waves from "../../assets/wavescx.svg"


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
  const {screenWidth} = useWindowSize();
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

  //minimize side nav based on screen width
  useEffect(() => {
    if (screenWidth < 768) {
      setShow(false);
    }
  }, [screenWidth])

  //initial data fetching
  useEffect(() => {
    changeAuth(token);
    axios.get(`${baseUrl}/user/list-users`).then((res) => {
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
        (<div className="bg-white p-2 mx-1 overflow-hidden overscoll-contain">
          {/* <Header /> */}
          <main className=" max-w-screen " onClick={CloseForm}>
            <div className="flex justify-center"></div>
            <SideBar style={{ marginTop: "", backgroundImage:"url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')" }} onClick={handleShowNav} show={show} />
            <div className={` h-[98vh] rounded-xl  px-5  bg-[#dcdde7] ${!show ? "ml-10" : "ml-[15.55%]"} `}>
            <Header />
              <Outlet context={{ setDisplayForm, CloseForm, members, filter, setFilter, handleSearchChange, departmentData, setDepartmentData, userStats }} />
            </div>
          </main>

          <NewMember CloseForm={CloseForm} userValue={userValue} onChange={handleChange} onSubmit={addNewMember} selectOptions={selectOptions} className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1500 ${displayForm ? "translate-x-0" : "translate-x-full"}`} loading={loading} disabled={!userValue.name} handlePictureUpdate={handlePictureUpdate} />
        </div>) : (<Navigate to="/login" />)}
    </>
  );
}

export default HomePage;
