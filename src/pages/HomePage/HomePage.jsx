import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { useAuth } from "../../auth/AuthWrapper";
import { changeAuth } from "../../axiosInstance.js";
import { getToken } from "../../utils/helperFunctions";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import LoaderComponent from "./Components/reusable/LoaderComponent";
import useSettingsStore from "./pages/Settings/utils/settingsStore";
import { useFetch } from "@/CustomHooks/useFetch";
import SideBarMobile from "./Components/SideBarMobile";

function HomePage() {
  const [userStats, setUserStats] = useState({
    stats: { adults: { male: 0, female: 0, total: 0 }, children: { male: 0, female: 0, total: 0 } },
  });
  const [displayForm, setDisplayForm] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);
  const [updatedDepartment, setUpdatedDepartment] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const { data: membersData, loading: membersLoading, error: membersError } = useFetch(api.fetch.fetchAllMembers);
  const { data: userStatsData, loading: userStatsLoading, error: userStatsError } = useFetch(api.fetch.fetchUserStats);
  const { data: upcomingEventsData, loading: upcomingEventsLoading, error: upcomingEventsError } = useFetch(api.fetch.fetchUpcomingEvents);
  const { data: positionsData, loading: positionsLoading, error: positionsError } = useFetch(api.fetch.fetchPositions); 
  const [queryLoading, setQueryLoading] = useState(false);
  const settingsStore = useSettingsStore();
  const store = useStore();
  const members = store.members;
  const token = getToken();
  const { user } = useAuth();

  //side nav
  const [show, setShow] = useState(false);
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
  // useEffect(() => {
  //   changeAuth(token);
  //   setQueryLoading(true);
  //   api.fetch.fetchAllMembers().then((res) => {
  //     store.setMembers(res.data.data);
  //   });

  //   api.fetch.fetchUserStats().then((res) => {
  //     setUserStats(res.data);
  //   });
  //   api.fetch.fetchUpcomingEvents().then((res) => {
  //     setQueryLoading(false);
  //     setUpcomingEvents(res.data.data);
  //   });

  //   api.fetch.fetchPositions().then((res) => {
  //     settingsStore.setPositions(res.data.data);
  //   });
  // }, [user]);

  useEffect(() => {
    changeAuth(token);
    
    if (membersData) {
      store.setMembers(membersData.data.data);
    }

    if (userStatsData) {
      setUserStats(userStatsData.data);
    }

    if (upcomingEventsData) {
      setUpcomingEvents(()=>upcomingEventsData.data.data);
    }

    if (positionsData) {
      settingsStore.setPositions(positionsData.data.data);
    }
    
  }, [user,userStatsData,positionsData,upcomingEventsData,membersData]);

  useEffect(() => {
    api.fetch.fetchDepartments().then((res) => {
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
      {token ? (
        <main onClick={CloseForm} className="bg-white   flex  overflow-auto ">
          <div className={` hidden sm:hidden md:hidden lg:inline `}>
            <SideBar
              className=""
              style={{ marginTop: "", backgroundImage: "url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')" }}
              onClick={handleShowNav}
              show={show}
            />
          </div>

          <div className="inline lg:hidden">
         <SideBarMobile show={show} onClick={handleShowNav} />
         </div>

          {/* <div className={`m-5`}> */}
          <div className={` my-auto lg:mr-3 xs:w-full   overflow-auto mx-auto rounded-xl  p-3 bg-[#E5E5EA] `}>
            <Header handleShowNav={handleShowNav} />
            <div className="hideScrollbar lg:h-[90vh]  overflow-y-auto rounded-xl">
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
            {queryLoading||membersLoading||upcomingEventsLoading && <LoaderComponent />}
          </div>
          {/* </div> */}
        </main>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
}

export default HomePage;
