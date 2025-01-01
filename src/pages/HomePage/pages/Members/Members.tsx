import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import FilterIcon from "@/assets/FilterIcon";
import GridAsset from "@/assets/GridAsset";
import SearchIcon from "@/assets/SearchIcon";
import TableAsset from "@/assets/TableAssets";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import MembersCount from "../../Components/reusable/MembersCount";
import TableComponent from "../../Components/reusable/TableComponent";
import {
  showDeleteDialog,
  showNotification,
} from "../../utils";
import MemberCard from "./Components/MemberCard";
import { UserType } from "./utils/membersInterfaces";
import { membersColumns } from "./utils/tableColums";

function Members() {
  const location = useLocation();
  const isNew = location.state?.new;
  const navigate = useNavigate();

  const [filterMembers, setFilterMembers] = useState("");
  const [tableView, setTableView] = useState(
    localStorage.getItem("membersTableView") === "false" ? false : true
  );
  const [showOptions, setShowOptions] = useState(false);
  const [, setDataToDelete, dataToDeleteRef] = useState<UserType | {}>({});

  const [showSearch, setShowSearch] = useState(false);

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

  //showing notification and sideEffects on delete
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

  //HANDLE ROUTIING AFTER SUCCESFULLY ADDING MEMBER
  useEffect(() => {
    if (isNew) {
      showNotification("Member Added Successfully");
      // Clear the 'new' state after showing the notification
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

  const membersCount = [
    { count: userStats.total_members, label: "Members" },
    { count: userStats.stats.adults.Male, label: "Adult male" },
    { count: userStats.stats.adults.Female, label: "Adult female" },
    { count: userStats.stats.children.Male, label: "Children male" },
    { count: userStats.stats.children.Female, label: "Children female" },
  ];

  return (
    <main className={`bg-white p-8`}>
      {/* Members Table Section */}
      <section className={`flex flex-col gap-5`}>
        {/* search component and add member */}
        <div className="flex justify-between items-center">
          <p className="text-dark900 text-2xl font-semibold">
            Church Members ({userStats.total_members})
          </p>
          <div className="flex justify-between items-center ">
            <div className="flex justify-start gap-2 items-center  w-2/3">
              <div className="flex gap-2 items-center">
                <div
                  className="flex gap-1 bg-lightGray p-1 rounded-md"
                  id="switch"
                >
                  <div onClick={() => handleViewMode(true)}>
                    <TableAsset
                      stroke={tableView ? "#8F95B2" : "#8F95B2"}
                      className={tableView ? "bg-white rounded-md" : ""}
                    />
                  </div>
                  <div onClick={() => handleViewMode(false)}>
                    <GridAsset
                      stroke={tableView ? "#8F95B2" : "#8F95B2"}
                      className={
                        tableView
                          ? "bg-lightGray rounded-md"
                          : "bg-white  rounded-md"
                      }
                    />
                  </div>
                </div>
                <FilterIcon
                  className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
                  onClick={() => setShowSearch(!showSearch)}
                />
                <SearchIcon
                  className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
                  onClick={() => setShowSearch(!showSearch)}
                />
              </div>
              <Button
                value={screenWidth <= 700 ? "+" : "Add member"}
                className={
                  "text-white px-5 min-h-12 max-h-14 p-3 bg-primaryViolet whitespace-nowrap" +
                  (screenWidth <= 540 ? " w-12 px-3" : "")
                }
                onClick={handleNavigation}
              />
            </div>
          </div>
        </div>
        <div className={`${showSearch ? "block" : "hidden"} w-full flex gap-2`}>
          <SearchBar
            className=" h-10"
            placeholder="Search members here..."
            value={filterMembers}
            onChange={handleSearchChange}
            id="searchMembers"
          />
        </div>
        {/* <TableComponent /> */}
        <div className="hidden gap-4 sm:hidden md:flex lg:flex  md:flex-col lg:flex-row xl:flex-row w-full">
          <MembersCount items={membersCount} />
          <MembersCount items={membersCount} />
        </div>
        <div
          className={`w-full mx-auto bg-white  ${
            tableView ? "bg-white p-2" : "bg-transparent "
          } rounded-xl`}
        >
          {tableView ? (
            <TableComponent
              columns={columns}
              data={members}
              displayedCount={12}
              filter={filterMembers}
              setFilter={setFilterMembers}
            />
          ) : (
            <GridComponent
              columns={columns}
              data={members}
              displayedCount={24}
              filter={filterMembers}
              setFilter={setFilterMembers}
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
