import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useState from "react-usestateref";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { useAuth } from "../../auth/AuthWrapper";
import axios, { changeAuth } from "../../axiosInstance.js";
import { getToken } from "../../utils/helperFunctions";
import { baseUrl } from "../Authentication/utils/helpers";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";


function HomePage() {
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


  //table manipulation
  const [filter, setFilter] = useState("");

  const handleSearchChange = (val) => {
    // setFilter(val);
  };


  return (
    <>
      {token ?
        (<div className="bg-white p-2 mx-1 overflow-hidden overscoll-contain ">
          {/* <Header /> */}
          <main className=" max-w-screen " onClick={CloseForm}>
            <div className="flex justify-center"></div>
            <SideBar style={{ marginTop: "", backgroundImage:"url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')" }} onClick={handleShowNav} show={show} />
            <div className={` h-[98vh] rounded-xl  px-5  bg-[#dcdde7] ${!show ? "ml-24" : "ml-[15.55%]"} `}>
            <Header />
              <Outlet context={{ setDisplayForm, CloseForm, members, filter, setFilter, handleSearchChange, departmentData, setDepartmentData, userStats }} />
            </div>
          </main>
        </div>) : (<Navigate to="/login" />)}
    </>
  );
}

export default HomePage;
