import type { ColumnFilter } from "@tanstack/react-table";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import useState from "react-usestateref";

import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { useQueryParams } from "@/CustomHooks/useQueryParams";
import { HeaderControls } from "@/components/HeaderControls";
import { useAuth } from "@/context/AuthWrapper";
import { useStore } from "@/store/useStore";
import { MembersType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { QueryType } from "@/utils/interfaces";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import { SearchBar } from "../../../../components/SearchBar";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { MembersCount } from "../../Components/reusable/MembersCount";
import TableComponent from "../../Components/reusable/TableComponent";
import { showDeleteDialog, showNotification } from "../../utils";
import { MemberCard } from "./Components/MemberCard";
import MembersFilter from "./Components/MembersFilter";
import { membersColumns } from "./utils";
import { UserType } from "./utils/membersInterfaces";

export function Members() {
  const location = useLocation();
  const task = location.state?.task;
  const navigate = useNavigate();

  const {
    user: { permissions },
  } = useAuth();

  const { refetchMembersOptions } = useOutletContext<{
    refetchMembersOptions: (query?: QueryType) => void;
  }>();

  const { data: allMembers, refetch: refetchMembers } = useFetch(
    api.fetch.fetchAllMembers
  );
  const members = allMembers?.data||[];
  const total = allMembers?.meta?.total||0;

  const { params, updateParam } = useQueryParams(["search", "membership_type", "ministry_worker"]);
  const [searchInput, setSearchInput] = useState(params.search || "");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const columnVisibility = useMemo(() => {
    return {
      membership_type: false,
      ministry_worker: false,
      department_id: false,
      Actions: permissions.manage_members,
    };
  }, [permissions]);
  const [tableView, setTableView] = useState(
    localStorage.getItem("membersTableView") === "false" ? false : true
  );
  const [showOptions, setShowOptions] = useState(false);
  const [, setDataToDelete, dataToDeleteRef] = useState<UserType | object>({});

  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const { screenWidth } = useWindowSize();
  const { executeDelete, success } = useDelete(api.delete.deleteMember);
  const { refetch: refetchUserStats } = useFetch(
    api.fetch.fetchUserStats,
    undefined,
    true
  );
  const store = useStore();
  const { userStats } = store;

  const columns = membersColumns;
  const crumbs = [
    { label: "Home", link: "/home" },
    { label: "Members", link: "/members" },
  ];

  useEffect(() => {
    const switchElement = document.getElementById("switch");
    if (screenWidth <= 540) {
      setTableView(false);
      switchElement?.classList.add("hidden");
    } else {
      switchElement?.classList.remove("hidden");
    }
  }, [screenWidth]);

  // Handle notifications on delete
  useEffect(() => {
    const handleEffect = async () => {
      if (success) {
        showNotification("Member Deleted Successfully");
        refetchMembers();
        refetchMembersOptions();
        const userStatsData = await refetchUserStats();
        if (userStatsData) store.setUserStats(userStatsData.data);
      }
    };
    handleEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Show notification after adding a member
  useEffect(() => {
    if (task) {
      showNotification(
        task === "add"
          ? "Member Added Successfully"
          : "Member Updated Successfully"
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [task, location.pathname, navigate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  const handleSearchSubmit = () => {
    updateParam("search", searchInput);
    refetchMembers({
      ...(searchInput && { name: searchInput }),
      page: "1",
      limit: "12",
      ...(params.membership_type && { membership_type: params.membership_type }),
      ...(params.ministry_worker && { ministry_worker: params.ministry_worker }),
    });
  };

  const handleNavigation = () => {
    navigate("manage-member");
  };

  const handleDelete = async () => {
    if (!("id" in dataToDeleteRef.current)) return;
    const id = dataToDeleteRef.current.id;
    await executeDelete({ id: String(id) });
  };

  const handleDeleteModal = (val?: MembersType) => {
    if (val) {
      setDataToDelete(val);
      showDeleteDialog(val, handleDelete);
    }
  };

  const handleViewMode = (bol: boolean) => {
    localStorage.setItem("membersTableView", bol + "");
    setTableView(bol);
  };

  const buildBackendFilterParams = (id: string, val: string): Record<string, string> => {
    const filterParams: Record<string, string> = {};

    if (id === "membership_type") {
      if (val) filterParams.membership_type = val;
      if (params.ministry_worker) filterParams.ministry_worker = params.ministry_worker;
    }

    if (id === "ministry_worker") {
      if (val) filterParams.ministry_worker = val;
      if (params.membership_type) filterParams.membership_type = params.membership_type;
    }

    return filterParams;
  };

  const handleBackendFilter = (val: string, id: string) => {
    updateParam(id, val);
    const filterParams = buildBackendFilterParams(id, val);

    refetchMembers({
      page: "1",
      limit: "12",
      ...(params.search && { name: params.search }),
      ...filterParams,
    });
  };

  const handleClientSideFilter = (val: string, id: string) => {
    setColumnFilters((prev) => {
      if (!val) return prev.filter((f) => f.id !== id);

      const exists = prev.some((f) => f.id === id);
      if (exists) {
        return prev.map((f) => (f.id === id ? { id, value: val } : f));
      }
      return [...prev, { id, value: val }];
    });
  };

  const handleFilterChange = (val: string, id: string) => {
    const isBackendFilter = id === "membership_type" || id === "ministry_worker";

    if (isBackendFilter) {
      handleBackendFilter(val, id);
    } else {
      handleClientSideFilter(val, id);
    }
  };

  const membersCount = [
    {
      count: userStats.inhouse.total_members,
      label: "In person church family",
    },
    { count: userStats.inhouse.stats.adults.Male, label: "Adult male" },
    { count: userStats.inhouse.stats.adults.Female, label: "Adult female" },
    { count: userStats.inhouse.stats.children.Male, label: "Children male" },
    {
      count: userStats.inhouse.stats.children.Female,
      label: "Children female",
    },
  ];

  const visitorsCount = [
    {
      count: userStats.online.total_members,
      label: "Online e-church family",
    },
    { count: userStats.online.stats.adults.Male, label: "Adult male" },
    { count: userStats.online.stats.adults.Female, label: "Adult female" },
    { count: userStats.online.stats.children.Male, label: "Children male" },
    {
      count: userStats.online.stats.children.Female,
      label: "Children female",
    },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      {/* Members Table Section */}
      <section className={`flex flex-col gap-5 bg-white p-4 rounded-xl`}>
        {/* ✅ Reusable HeaderControls Component */}
        <HeaderControls
          title={`Church Memberships (${
            userStats.online?.total_members + userStats.inhouse?.total_members
          })`}
          tableView={tableView}
          handleViewMode={handleViewMode}
          hasFilter={true}
          hasSearch={true}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleClick={handleNavigation}
          screenWidth={screenWidth}
          btnName={permissions?.manage_members ? "Add Membership" : ""}
        />

        {/* Search & Filter Components */}
        <div className={`${showSearch ? "block" : "hidden"} w-full flex gap-2`}>
          <SearchBar
            className="h-10"
            placeholder="Search members here..."
            value={searchInput}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
            id="searchMembers"
          />
        </div>

        <div className={`${showFilter ? "block" : "hidden"} w-full flex gap-2`}>
          <MembersFilter
            onChange={handleFilterChange}
            membershipType={params.membership_type}
            ministryWorker={params.ministry_worker}
          />
        </div>

        {/* Members & Visitors Count */}
        <div className="hidden gap-4 sm:hidden md:flex lg:flex md:flex-col lg:flex-row xl:flex-row w-full">
          <MembersCount items={membersCount} />
          <MembersCount items={visitorsCount} />
        </div>

        {/* Table or Grid View */}
        <div
          className={`w-full mx-auto ${
            tableView ? "bg-white p-2" : "bg-transparent"
          } rounded-xl`}
        >
          {tableView ? (
            <TableComponent<UserType>
              columns={columns}
              data={members}
              displayedCount={12}
              total={total}
              filter={params.search}
              setFilter={() => {}}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              columnVisibility={columnVisibility}
              onPageChange={(page, limit) => {
                refetchMembers({
                  limit: String(limit),
                  page: String(page),
                  ...(params.search && { name: params.search }),
                  ...(params.membership_type && { membership_type: params.membership_type }),
                  ...(params.ministry_worker && { ministry_worker: params.ministry_worker }),
                });
              }}
            />
          ) : (
            <GridComponent
              columns={columns}
              data={members}
              displayedCount={24}
              total={total}
              filter={params.search}
              setFilter={() => {}}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              columnVisibility={columnVisibility}
              onPageChange={(page, limit) => {
                refetchMembers({
                  limit: String(limit),
                  page: String(page),
                  ...(params.search && { name: params.search }),
                  ...(params.membership_type && { membership_type: params.membership_type }),
                  ...(params.ministry_worker && { ministry_worker: params.ministry_worker }),
                });
              }}
              renderRow={(row) => (
                <MemberCard
                  member={row.original}
                  key={row.id}
                  showOptions={showOptions === row.original.id}
                  onShowOptions={() => setShowOptions(row.original.id)}
                  onDelete={handleDeleteModal}
                  canManage={permissions?.manage_members}
                />
              )}
            />
          )}
        </div>
      </section>
    </PageOutline>
  );
}
