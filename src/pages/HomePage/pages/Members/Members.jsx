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
import TableComponent from "../../Components/reusable/TableComponent";
import { membersColumns } from "../../utils/helperFunctions";
import MemberCard from "./Components/MemberCard";
import GridAsset from "/src/assets/GridAsset";
import TableAsset from "/src/assets/TableAssets";
import { useDelete } from "@/CustomHooks/useDelete";
function Members() {
  const members = useStore().members;
  const removeMember = useStore().removeMember;

  const location = useLocation();
  const isNew = location.state?.new;

  const navigate = useNavigate();
  const { screenWidth } = useWindowSize();
  const [filterMembers, setFilterMembers] = useState("");
  const [tableView, setTableView] = useState(localStorage.getItem('membersTableView') === 'false' ? false : true);
  const [showOptions, setShowOptions] = useState(false);
  const [modal, setModal] = useState({ show: false,data:{} });
  const [notification, setNotification] = useState({ type: '', message: '', show: false });
  const [queryLoading, setQueryLoading] = useState(false);
  const {executeDelete,loading,error,success} = useDelete(api.delete.deleteMember);

  const columns = membersColumns;

  useEffect(() => {
    if (screenWidth <= 540) {
      setTableView(false);
      document.getElementById("switch").classList.add("hidden")
    } else {
      document.getElementById("switch").classList.remove("hidden")
    }
  }, [screenWidth])


  //HANDLE ROUTIING AFTER SUCCESFULLY ADDING MEMBER
  useEffect(() => {
    if (isNew) {
      setNotification({ type: 'success', message: 'Member Added Successfully', show: true })
      // Clear the 'new' state after showing the notification
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isNew, location.pathname, navigate])


  const handleSearchChange = (e) => {
    setFilterMembers(e.target.value);
  };

  const handleNavigation = () => {
    navigate('add-member')
  }
  const handleDelete = () => {
    const id = modal.data.id
    setModal({ data: {}, show: false });
    executeDelete(id).then(() => {
      removeMember(id);
      setNotification({ type: 'success', message: 'Member Deleted Successfully', show: true })
      setQueryLoading(false);
    })
  }

  const handleDeleteModal = (val) => {
    if (val) {
      setModal(prev => {
        return { data: val, show: true }
      });
    } else {
      setModal(prev => {
        return { data: {}, show: !prev.show }
      });
    }
  }

  const handleViewMode = (bol) => {
    localStorage.setItem('membersTableView', bol)
    setTableView(bol)
  }

  return (

    <main className={``}>

      {/* Members Table Section */}
      <section className={``}>
        {/* search component and add member */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex justify-start gap-2 items-center  w-2/3">
            <div className="flex gap-1 bg-lightGray p-1 rounded-md" id="switch">
              <div onClick={() => handleViewMode(true)}><TableAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} /></div><div onClick={() => handleViewMode(false)}><GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} /></div>
            </div>
            <SearchBar
              className="w-[40.9%] h-10"
              placeholder="Search members here..."
              value={filterMembers}
              onChange={handleSearchChange}
              id="searchMembers"
            />
          </div>
          <div>
            <Button
              value="Add member"
              className={" text-white min-h-12 max-h-14 p-2 gradientBtn"}
              onClick={handleNavigation}
            />
          </div>
        </div>
        {/* <TableComponent /> */}
        <div className={`w-full mx-auto  ${tableView ? "bg-white p-2" : "bg-transparent "} rounded-xl`}>
          {!true ? <GridSkeleton />
            : (tableView ? <TableComponent
              columns={columns}
              data={members}
              displayedCount={12}
              filter={filterMembers}
              setFilter={setFilterMembers}
              tableView={tableView}
            /> :
              <GridComponent
                columns={columns}
                data={members}
                displayedCount={24}
                filter={filterMembers}
                setFilter={setFilterMembers}
                tableView={tableView}
                renderRow={(row) => (<MemberCard member={row.original} key={row.id} showOptions={showOptions === row.original.id} onShowOptions={() => setShowOptions(row.original.id)} onDelete={handleDeleteModal} />)}
              />)}
        </div>
      </section>
      <Dialog showModal={modal.show} data={modal.data} onClick={handleDeleteModal} onDelete={handleDelete} />
      {loading && <LoaderComponent />}
      {notification.show && <NotificationCard type={notification.type} title={"Success"} description={notification.message} onClose={() => setNotification({ type: '', message: '', show: false })} />}
    </main>
  );
}
export default Members;
