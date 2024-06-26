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
import useSettingsStore from "./pages/Settings/utils/settingsStore";
import { useStore } from "@/store/useStore";
import { fetchAllMembers } from "./pages/Members/utils/apiCalls";


function HomePage() {
  const [userStats, setUserStats] = useState({ stats: { adults: { male: 0, female: 0, total: 0 }, children: { male: 0, female: 0, total: 0 } } });
  const [displayForm, setDisplayForm] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);
  const [updatedDepartment, setUpdatedDepartment] = useState(false);
  const settingsStore = useSettingsStore();
  const store = useStore();
  const members = store.members;
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
    fetchAllMembers().then((res) => {
      store.setMembers(res.data.data);
    })
    axios.get(`${baseUrl}/user/stats-users`).then((res) => {
      setUserStats(res.data);
      // console.log(res.data)
    })
    // axios.get(`${baseUrl}/department/list-departments`).then((res) => {
    //   setDepartmentData(res.data.data);

    // });

    axios.get(`${baseUrl}/position/list-positions`).then((res) => {
      settingsStore.setPositions(res.data.data)
    });
  }, [user]);
  useEffect(() => {
    axios.get(`${baseUrl}/department/list-departments`).then((res) => {
      setDepartmentData(res.data.data);
      settingsStore.setDepartments(res.data.data);
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
        (<div className="bg-white p-2  overflow-hidden overscoll-contain ">
          {/* <Header /> */}
          <main className=" max-w-screen " onClick={CloseForm}>
            <SideBar style={{ marginTop: "", backgroundImage:"url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')" }} onClick={handleShowNav} show={show} />
            <div className={`xs:h-[88vh] sm:h-[90vh] md:h-[92vh] lg:h-[98vh] rounded-xl  px-5 bg-[#dcdde7] ${!show ? "lg:ml-16" : "lg:ml-[15.55%] "} `}>
            <Header />
              <Outlet context={{ setDisplayForm, CloseForm, members, filter, setFilter, handleSearchChange, departmentData, setDepartmentData, userStats }} />
            </div>
          </main>
        </div>) : (<Navigate to="/login" />)}
    </>
  );
}

export default HomePage;
