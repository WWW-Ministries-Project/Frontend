import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
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
import LoaderComponent from "./Components/reusable/LoaderComponent";

function HomePage() {
  const [userStats, setUserStats] = useState({
    stats: { adults: { male: 0, female: 0, total: 0 }, children: { male: 0, female: 0, total: 0 } },
  });
  const [displayForm, setDisplayForm] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);
  const [updatedDepartment, setUpdatedDepartment] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const settingsStore = useSettingsStore();
  const store = useStore();
  const members = store.members;
  const token = getToken();
  const { user } = useAuth();

  //side nav
  const [show, setShow] = useState(true);
  const { screenWidth } = useWindowSize();
  const handleShowNav = () => {
    setShow((prev) => !prev);
  };

  const CloseForm = () => {
    setDisplayForm(false);
  };

  //minimize side nav based on screen width
  useEffect(() => {
    if (screenWidth < 768) {
      setShow(false);
    }
  }, [screenWidth]);

  //initial data fetching
  useEffect(() => {
    changeAuth(token);
    setQueryLoading(true);
    fetchAllMembers().then((res) => {
      store.setMembers(res.data.data);
    });
    axios.get(`${baseUrl}/user/stats-users`).then((res) => {
      setUserStats(res.data);
    });
    axios.get("event/upcoming-events").then((res) => {
      setQueryLoading(false);
      setUpcomingEvents(res.data.data);
    });

    axios.get(`${baseUrl}/position/list-positions`).then((res) => {
      settingsStore.setPositions(res.data.data);
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
    setFilter(val);
  };

  // scroll event to show/hide the browser UI
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        // scrolling down
        document.body.classList.add("hide-browser-ui");
      } else {
        // scrolling up
        document.body.classList.remove("hide-browser-ui");
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {"token" ? (
          <main onClick={CloseForm} className="bg-white   flex  overflow-auto ">
            <div className={` ${!show ? "lg:w-[4vw]" : "lg:w-[15vw]"}`}>
            <SideBar
              className=""
              style={{ marginTop: "", backgroundImage: "url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')" }}
              onClick={handleShowNav}
              show={show}
            />
            </div>
            
            {/* <div className={`h-lvh w-5/6 overflow-auto mx-auto rounded-xl h-dhv px-5 bg-[#dcdde7] ${!show ? "lg:ml-16" : "lg:ml-[15.55%]"}`}> */}
            <div className={`h-lvh lg:m-2 xs:w-full ${!show ? "lg:w-[95vw]" : "lg:w-[84vw]"} overflow-auto mx-auto rounded-xl h-dhv px-5 bg-[#d9d9d9] `}>
              <Header />
              <div className="hideScrollbar h-[90vh] mb-4  overflow-y-auto rounded-xl">
                <Outlet
                context={{
                  setDisplayForm,
                  CloseForm,
                  members,
                  filter,
                  setFilter,
                  handleSearchChange,
                  departmentData,
                  setDepartmentData,
                  userStats,
                  upcomingEvents,
                }}
              />
              </div>
              {queryLoading && <LoaderComponent />}
            </div>
          </main>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
}

export default HomePage;
