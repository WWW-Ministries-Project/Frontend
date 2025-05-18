import { useFetch } from "@/CustomHooks/useFetch";
import { Dialog } from "@/components/Dialog";
import { NotificationCard } from "@/components/NotificationCard";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { changeAuth } from "../../axiosInstance.js";
import { useAuth } from "../../context/AuthWrapper";
import { getToken } from "../../utils/helperFunctions";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import Breadcrumb from "./Components/BreadCrumb";
import SideBarMobile from "./Components/SideBarMobile";
import { LoaderComponent } from "./Components/reusable/LoaderComponent";
import useSettingsStore from "./pages/Settings/utils/settingsStore";

export const navigateRef = {
  current: null as
    | ((path: string, options?: { state: { mode: string } }) => void)
    | null,
};

function HomePage() {
  const {
    data: membersData,
    loading: membersLoading,
    refetch: refetchMembers,
  } = useFetch(api.fetch.fetchAllMembers);
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
  //@ts-expect-error this auth dey worry
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
      store.setMembers(membersData.data);
    }

    if (userStatsData) {
      store.setUserStats(userStatsData.data);
    }

    if (upcomingEventsData) {
      store.setEvents(upcomingEventsData.data);
    }

    if (positionsData) {
      settingsStore.setPositions(positionsData.data);
    }
  }, [user, userStatsData, positionsData, upcomingEventsData, membersData]);

  useEffect(() => {
    api.fetch.fetchDepartments().then((res) => {
      settingsStore.setDepartments(res.data);
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
    <div className="lg:fixed ">
      {token ? (
        <main className="h-screen w-screen p-3  ">
          <div className="">
            <Header handleShowNav={handleShowNav} />
          </div>
          <div className="flex">
            <div className={` hidden sm:hidden md:hidden lg:inline  `}>
              <SideBar className="" onClick={handleShowNav} show={show} />
            </div>

            <div className="inline lg:hidden">
              <SideBarMobile show={show} onClick={handleShowNav} />
            </div>
            <div className="w-full ">
              <div className="">
                {/* <Header handleShowNav={handleShowNav} /> */}
              </div>
              <div
                className={` my-auto lg:mr-3 xs:w-full   overflow-auto mx-auto rounded-xl border border-1 border-lightGray    bg-lightGray `}
              >
                <div className="hideScrollbar h-[calc(100%+60px)]  lg:h-[90.5vh] 2xl:h-[92.5vh] overflow-y-auto rounded-xl ">
                  <div className="sticky top-0 z-10   rounded-t-xl  backdrop-blur-sm">
                    <Breadcrumb />
                  </div>
                  <Outlet
                    context={{
                      members,
                      refetchMembers,
                      filter,
                      setFilter,
                      handleSearchChange,
                      userStats,
                    }}
                  />
                </div>
                {membersLoading ||
                  (upcomingEventsLoading && <LoaderComponent />)}
              </div>
            </div>
          </div>
          <NotificationCard />
          <Dialog />
          <LoaderComponent />
        </main>
      ) : (
        <Navigate to="/login" />
      )}
    </div>
  );
}

export default HomePage;
