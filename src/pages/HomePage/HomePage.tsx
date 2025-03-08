import { useFetch } from "@/CustomHooks/useFetch";
import Dialog from "@/components/Dialog";
import NotificationCard from "@/components/NotificationCard";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { changeAuth } from "../../axiosInstance.js";
import { useAuth } from "../../context/AuthWrapper";
import { getToken } from "../../utils/helperFunctions";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import SideBarMobile from "./Components/SideBarMobile";
import LoaderComponent from "./Components/reusable/LoaderComponent";
import useSettingsStore from "./pages/Settings/utils/settingsStore";
import Breadcrumb from "./Components/BreadCrumb";

export const navigateRef = {
  current: null as
    | ((path: string, options?: { state: { mode: string } }) => void)
    | null,
};

function HomePage() {
  const { data: membersData, loading: membersLoading } = useFetch(
    api.fetch.fetchAllMembers
  );
  const { data: userStatsData } = useFetch(api.fetch.fetchUserStats);
  const { data: upcomingEventsData, loading: upcomingEventsLoading } = useFetch(
    api.fetch.fetchEvents
  );
  const { data: positionsData } = useFetch(api.fetch.fetchPositions);
  const settingsStore = useSettingsStore();
  const store = useStore();
  const members = store.members;
  const userStats = store.userStats;
  const token = getToken();
  //@ts-ignore
  const { user } = useAuth();

  //side nav
  const [show, setShow] = useState(false);
  const { screenWidth } = useWindowSize();
  const handleShowNav = () => {
    setShow((prev) => !prev);
  };

  //minimize side nav based on screen width
  useEffect(() => {
    if (screenWidth < 768) {
      setShow(false);
    }
  }, [screenWidth]);

  useEffect(() => {
    changeAuth(token);

    if (membersData) {
      store.setMembers(membersData.data.data);
    }

    if (userStatsData) {
      store.setUserStats(userStatsData.data);
    }

    if (upcomingEventsData) {
      store.setEvents(upcomingEventsData.data.data);
    }

    if (positionsData) {
      settingsStore.setPositions(positionsData.data.data);
    }
  }, [user, userStatsData, positionsData, upcomingEventsData, membersData]);

  useEffect(() => {
    api.fetch.fetchDepartments().then((res) => {
      settingsStore.setDepartments(res.data.data);
    });
  }, []);

  //table manipulation
  const [filter, setFilter] = useState("");

  const handleSearchChange = (val: string) => {
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

  //custom navigation
  const navigate = useNavigate();
  navigateRef.current = navigate;

  return (
    <div className="">
      {token ? (
        <main className="  flex ">
          <div className={` hidden sm:hidden md:hidden lg:inline `}>
            <SideBar
              className=""
              style={{
                marginTop: "",
                backgroundImage:
                  "url('https://res.cloudinary.com/akwaah/image/upload/v1718973564/wavescx_brypzu.sv')",
              }}
              onClick={handleShowNav}
              show={show}
            />
          </div>

          <div className="inline lg:hidden">
            <SideBarMobile show={show} onClick={handleShowNav} />
          </div>
             <div className="w-full p-3 space-y-3">
             <div className="">
             <Header handleShowNav={handleShowNav} />
              </div>
          <div className={` my-auto lg:mr-3 xs:w-full   overflow-auto mx-auto rounded-xl  p-4 bg-[#E5E5EA] `}>
            
            <div className="hideScrollbar lg:h-[88.5vh] 2xl:h-[90.5vh] overflow-y-auto rounded-xl">
            {/* <Breadcrumb /> */}
              <Outlet
                context={{
                  members,
                  filter,
                  setFilter,
                  handleSearchChange,
                  userStats,
                }}
              />
            </div>
            {membersLoading || (upcomingEventsLoading && <LoaderComponent />)}
          </div>
             </div>
          <NotificationCard />
          <Dialog />
        </main>
      ) : (
        <Navigate to="/login" />
      )}
      {membersLoading && <LoaderComponent/>}
    </div>
  );
}

export default HomePage;
