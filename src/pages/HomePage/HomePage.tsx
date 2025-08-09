import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { Dialog } from "@/components/Dialog";
import { NotificationCard } from "@/components/NotificationCard";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { changeAuth } from "../../axiosInstance.js";
import { useAuth } from "../../context/AuthWrapper";
import { getToken } from "../../utils/helperFunctions";
import Breadcrumb from "./Components/BreadCrumb";
import { Header } from "./Components/Header";
import { MobileSideBar } from "./Components/MobileSideBar";
import { SideBar } from "./Components/SideBar";
import { LoaderComponent } from "./Components/reusable/LoaderComponent";
import useSettingsStore from "./pages/Settings/utils/settingsStore";

export const navigateRef = {
  current: null as
    | ((path: string, options?: { state: { mode: string } }) => void)
    | null,
};

export function HomePage() {
  //custom navigation
  const navigate = useNavigate();
  navigateRef.current = navigate;

  const { data: membersData, refetch: refetchMembers } = useFetch(
    api.fetch.fetchAllMembers
  );
  const { data: userStatsData } = useFetch(api.fetch.fetchUserStats);
  const { data: eventsData } = useFetch(api.fetch.fetchEvents);
  const { data: positionsData, refetch: refetchPositions } = useFetch(
    api.fetch.fetchPositions
  );
  const { data: departmentsData, refetch: refetchDepartments } = useFetch(
    api.fetch.fetchDepartments
  );
  const settingsStore = useSettingsStore();
  const store = useStore();
  const members = store.members;
  const userStats = store.userStats;
  const token = getToken();
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
      store.setMembers(membersData.data, membersData.meta?.total ?? 0);
    }

    if (userStatsData) {
      store.setUserStats(userStatsData.data);
    }

    if (eventsData) {
      store.setEvents(eventsData.data);
    }

    if (positionsData) {
      settingsStore.setPositions(
        positionsData.data,
        positionsData.meta?.total ?? 0
      );
    }
    if (departmentsData) {
      settingsStore.setDepartments(
        departmentsData.data,
        departmentsData.meta?.total ?? 0
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    userStatsData,
    positionsData,
    eventsData,
    membersData,
    departmentsData,
  ]);

  // useEffect(() => {
  //   api.fetch.fetchDepartments().then((res) => {
  //     settingsStore.setDepartments(res.data);
  //   });
  // }, []);

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

  if (!token) return null;
  return (
    <div className="lg:fixed ">
      <main className="h-screen w-screen p-3  ">
        <div className="">
          <Header handleShowNav={handleShowNav} />
        </div>
        <div className="flex">
          <div className={` hidden sm:hidden md:hidden lg:inline  `}>
            <SideBar className="" onClick={handleShowNav} show={show} />
          </div>

          <div className="inline lg:hidden">
            <MobileSideBar show={show} onClick={handleShowNav} />
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
                    refetchPositions,
                    refetchDepartments,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <NotificationCard />
        <Dialog />
        <LoaderComponent />
      </main>
    </div>
  );
}
