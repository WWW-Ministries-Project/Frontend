import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { Dialog } from "@/components/Dialog";
import { useStore } from "@/store/useStore";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import useWindowSize from "../../CustomHooks/useWindowSize";
import { changeAuth } from "../../axiosInstance.js";
import { useAuth } from "../../context/AuthWrapper";
import { getToken } from "../../utils/helperFunctions";
import { Header } from "./Components/Header";
import { AiChatbotWidget } from "./Components/AiChatbotWidget";
import { MobileSideBar } from "./Components/MobileSideBar";
import { SideBar } from "./Components/SideBar";
import { LoaderComponent } from "./Components/reusable/LoaderComponent";
import useSettingsStore from "./pages/Settings/utils/settingsStore";
import { navigateRef } from "./navigationRef";

export function HomePage() {
  //custom navigation
  const navigate = useNavigate();
  navigateRef.current = navigate;
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const setBranches = useBranchStore((state) => state.setBranches);
  const branchQuery = useMemo(
    () => buildBranchQuery(activeBranchId),
    [activeBranchId]
  );

  const { data: branchesData, refetch: refetchBranches } = useFetch(
    api.fetch.fetchBranches
  );

  const { data: membersData, refetch: refetchMembersOptions } = useFetch(
    api.fetch.fetchMembersForOptions,
    branchQuery
  );
  const { data: userStatsData } = useFetch(api.fetch.fetchUserStats, branchQuery);
  const { data: eventsData } = useFetch(api.fetch.fetchEvents, branchQuery);
  const { data: positionsData, refetch: refetchPositions } = useFetch(
    api.fetch.fetchPositions,
    branchQuery
  );
  const { data: departmentsData, refetch: refetchDepartments } = useFetch(
    api.fetch.fetchDepartments,
    branchQuery
  );
  const settingsStore = useSettingsStore();
  const store = useStore();
  const userStats = store.userStats;
  const token = getToken();
  const { user } = useAuth();

  //side nav
  const [show, setShow] = useState(false);
  const { screenWidth } = useWindowSize();
  const handleShowNav = () => {
    setShow(v => !v);
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
      store.setMemberOptions(membersData.data);
      // store.setMembers(membersData.data, membersData.meta?.total ?? 0);
    }

    if (branchesData) {
      setBranches(branchesData.data);
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
    branchesData,
    setBranches,
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

  if (!token) return <Navigate to="/login" replace />;
  return (
    <main className="app-shell-padding h-[100dvh] w-full overflow-hidden bg-white">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex-shrink-0">
          <Header handleShowNav={handleShowNav} />
        </div>

        <div className="flex min-h-0 flex-1 gap-0
        ">
          <div className="hidden h-full flex-shrink-0 lg:block">
            <SideBar className="" onClick={handleShowNav} show={show} />
          </div>

          <div className="lg:hidden">
            <MobileSideBar show={show} onClick={handleShowNav} />
          </div>

          <div className="app-surface app-shell-padding flex min-h-0 flex-1 overflow-hidden bg-lightGray">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-t-4 border-lightGray border-t-secondary bg-white">
              <div className="app-page-content app-scrollbar flex-1 min-h-0 overflow-y-auto">
                <Outlet
                  context={{
                    refetchMembersOptions,
                    filter,
                    setFilter,
                    handleSearchChange,
                    userStats,
                    refetchPositions,
                    refetchDepartments,
                    refetchBranches,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <Dialog />
        <LoaderComponent />
        <AiChatbotWidget />
      </div>
    </main>
  );
}
