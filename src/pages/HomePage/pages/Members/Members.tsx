import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import FilterIcon from "@/assets/FilterIcon";
import GridAsset from "@/assets/GridAsset";
import SearchIcon from "@/assets/SearchIcon";
import TableAsset from "@/assets/TableAssets";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { ColumnFilter } from "@tanstack/react-table";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import SearchBar from "../../../../components/SearchBar";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import MembersCount from "../../Components/reusable/MembersCount";
import TableComponent from "../../Components/reusable/TableComponent";
import { showDeleteDialog, showNotification } from "../../utils";
import MemberCard from "./Components/MemberCard";
import MembersFilter from "./Components/MembersFilter";
import { membersColumns } from "./utils";
import { UserType } from "./utils/membersInterfaces"; // ✅ Import the reusable component
import HeaderControls from "@/components/headerControls";

function Members() {
  const location = useLocation();
  const isNew = location.state?.new;
  const navigate = useNavigate();

  const [filterMembers, setFilterMembers] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [columnVisibility] = useState({
    membership_type: false,
    is_user: false,
  });
  const [tableView, setTableView] = useState(
    localStorage.getItem("membersTableView") === "false" ? false : true
  );
  const [showOptions, setShowOptions] = useState(false);
  const [, setDataToDelete, dataToDeleteRef] = useState<UserType | {}>({});

  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const { screenWidth } = useWindowSize();
  const { executeDelete, loading, success, error } = useDelete(
    api.delete.deleteMember
  );
  const { refetch: refetchUserStats } = useFetch(
    api.fetch.fetchUserStats,
    undefined,
    true
  );
  const store = useStore();
  const members = store.members;
  const userStats = store.userStats;
  const removeMember = store.removeMember;
  const columns = membersColumns;

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
        const userStatsData = await refetchUserStats();
        userStatsData && store.setUserStats(userStatsData.data);
      }
      if (error) {
        showNotification("Something went wrong");
      }
    };
    handleEffect();
  }, [success, error]);

  // Show notification after adding a member
  useEffect(() => {
    if (isNew) {
      showNotification("Member Added Successfully");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isNew, location.pathname, navigate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterMembers(e.target.value);
  };

  const handleNavigation = () => {
    navigate("add-member");
  };
  
  const handleDelete = async () => {
    if (!("id" in dataToDeleteRef.current)) return;
    const id = dataToDeleteRef.current.id;
    await executeDelete(id!);
    removeMember(id!);
  };

  const handleDeleteModal = (val?: UserType) => {
    if (val) {
      setDataToDelete(val);
      showDeleteDialog(val, handleDelete);
    }
  };

  const handleViewMode = (bol: boolean) => {
    localStorage.setItem("membersTableView", bol + "");
    setTableView(bol);
  };

  const handleFilterChange = (val: string, id: string) => {
    setColumnFilters((prev) => {
      const temp = !val ? prev.filter((obj) => obj.id !== id) : prev;
      return [...temp, { id, value: val }];
    });
  };

  const membersCount = [
    { count: userStats.members?.total_members, label: "Members" },
    { count: userStats.members?.stats.adults.Male, label: "Adult male" },
    { count: userStats.members?.stats.adults.Female, label: "Adult female" },
    { count: userStats.members?.stats.children.Male, label: "Children male" },
    { count: userStats.members?.stats.children.Female, label: "Children female" },
  ];
  
  const visitorsCount = [
    { count: userStats.visitors?.total_members, label: "Visitors" },
    { count: userStats.visitors?.stats.adults.Male, label: "Adult male" },
    { count: userStats.visitors?.stats.adults.Female, label: "Adult female" },
    { count: userStats.visitors?.stats.children.Male, label: "Children male" },
    { count: userStats.visitors?.stats.children.Female, label: "Children female" },
  ];

  return (
    <main className={`p-4`}>
      {/* Members Table Section */}
      <section className={`flex flex-col gap-5 bg-white p-4 rounded-xl`}>
        
        {/* ✅ Reusable HeaderControls Component */}
        <HeaderControls
          title="Church Memberships"
          totalMembers={userStats.members?.total_members + userStats.visitors?.total_members}
          tableView={tableView}
          handleViewMode={handleViewMode}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleNavigation={handleNavigation}
          screenWidth={screenWidth}
          btnName="Add Membership"
        />

        {/* Search & Filter Components */}
        <div className={`${showSearch ? "block" : "hidden"} w-full flex gap-2`}>
          <SearchBar
            className="h-10"
            placeholder="Search members here..."
            value={filterMembers}
            onChange={handleSearchChange}
            id="searchMembers"
          />
        </div>
        
        <div className={`${showFilter ? "block" : "hidden"} w-full flex gap-2`}>
          <MembersFilter onChange={handleFilterChange} />
        </div>

        {/* Members & Visitors Count */}
        <div className="hidden gap-4 sm:hidden md:flex lg:flex md:flex-col lg:flex-row xl:flex-row w-full">
          <MembersCount items={membersCount} />
          <MembersCount items={visitorsCount} />
        </div>

        {/* Table or Grid View */}
        <div className={`w-full mx-auto ${tableView ? "bg-white p-2" : "bg-transparent"} rounded-xl`}>
          {tableView ? (
            <TableComponent
              columns={columns}
              data={members}
              displayedCount={12}
              filter={filterMembers}
              setFilter={setFilterMembers}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              columnVisibility={columnVisibility}
            />
          ) : (
            <GridComponent
              columns={columns}
              data={members}
              displayedCount={24}
              filter={filterMembers}
              setFilter={setFilterMembers}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              columnVisibility={columnVisibility}
              renderRow={(row) => (
                <MemberCard
                  member={row.original}
                  key={row.id}
                  showOptions={showOptions === row.original.id}
                  onShowOptions={() => setShowOptions(row.original.id)}
                  onDelete={handleDeleteModal}
                />
              )}
            />
          )}
        </div>
      </section>
      
      {loading && <LoaderComponent />}
    </main>
  );
}

export default Members;
