import { useDelete } from "@/CustomHooks/useDelete";
import FilterIcon from "@/assets/FilterIcon";
import GridAsset from "@/assets/GridAsset";
import SearchIcon from "@/assets/SearchIcon";
import TableAsset from "@/assets/TableAssets";
import Dialog from "@/components/Dialog";
import NotificationCard from "@/components/NotificationCard";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import GridSkeleton from "../../Components/GridSkeleton";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import MembersCount from "../../Components/reusable/MembersCount";
import TableComponent from "../../Components/reusable/TableComponent";
import { membersColumns } from "../../utils/helperFunctions";
import MemberCard from "./Components/MemberCard";
import { UserType } from "./utils/membersInterfaces";

function Members() {
  const location = useLocation();
  const isNew = location.state?.new;
  const navigate = useNavigate();

  const [filterMembers, setFilterMembers] = useState("");
  const [tableView, setTableView] = useState(
    localStorage.getItem("membersTableView") === "false" ? false : true
  );
  const [showOptions, setShowOptions] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; data: UserType|{} }>({ show: false, data: { } });
  const [notification, setNotification] = useState<{
    type?: "error" | "success";
    message: string;
    show: boolean;
  }>({
    type: undefined,
    message: "",
    show: false,
  });
  const [showSearch, setShowSearch] = useState(false);

  const { screenWidth } = useWindowSize();
  const { executeDelete, loading } = useDelete(api.delete.deleteMember);
  const members = useStore().members;
  const removeMember = useStore().removeMember;
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

  //HANDLE ROUTIING AFTER SUCCESFULLY ADDING MEMBER
  useEffect(() => {
    if (isNew) {
      setNotification({
        type: "success",
        message: "Member Added Successfully",
        show: true,
      });
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
  const handleDelete = () => {
    if (!("id"in modal.data)) return;
    const id = modal.data.id;
    setModal({ data: { id: "" }, show: false });
    executeDelete(id!).then(() => {
      removeMember(id!);
      setNotification({
        type: "success",
        message: "Member Deleted Successfully",
        show: true,
      });
    });
  };

  const handleDeleteModal = (val?: UserType) => {
    if (val) {
      setModal(() => {
        return { data: val, show: true };
      });
    } else {
      setModal((prev) => {
        return { data: {}, show: !prev.show };
      });
    }
  };

  const handleViewMode = (bol: boolean) => {
    localStorage.setItem("membersTableView", bol+"");
    setTableView(bol);
  };

  const membersCount = [
    { count: members?.length, label: "Members" },
    { count: members?.length, label: "Adult male" },
    { count: members?.length, label: "Adult female" },
    { count: members?.length, label: "Children male" },
    { count: members?.length, label: "Children female" },
  ];

  return (
    <main className={`bg-white p-8`}>
      {/* Members Table Section */}
      <section className={`flex flex-col gap-5`}>
        {/* search component and add member */}
        <div className="flex justify-between items-center">
          <p className="text-dark900 text-2xl font-semibold">
            Church Members ({members?.length})
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
        <div className="flex gap-8 sm:flex-col md:flex-col lg:flex-row xl:flex-row w-full">
          <MembersCount items={membersCount} />
          <MembersCount items={membersCount} />
        </div>
        <div
          className={`w-full mx-auto bg-white  ${
            tableView ? "bg-white p-2" : "bg-transparent "
          } rounded-xl`}
        >
          {!true ? (
            <GridSkeleton />
          ) : tableView ? (
            <TableComponent
              columns={columns}
              data={members}
              displayedCount={12}
              filter={filterMembers}
              setFilter={setFilterMembers}
              tableView={tableView}
            />
          ) : (
            <GridComponent
              columns={columns}
              data={members}
              displayedCount={24}
              filter={filterMembers}
              setFilter={setFilterMembers}
              tableView={tableView}
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
      <Dialog
        showModal={modal.show}
        data={modal.data}
        onClick={handleDeleteModal}
        onDelete={handleDelete}
      />
      {loading && <LoaderComponent />}
      {notification.show && (
        <NotificationCard
          type={notification?.type}
          title={"Success"}
          description={notification.message}
          onClose={() =>
            setNotification({ type: undefined, message: "", show: false })
          }
        />
      )}
    </main>
  );
}
export default Members;
