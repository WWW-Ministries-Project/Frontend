import Dialog from "@/components/Dialog";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import GridSkeleton from "../../Components/GridSkeleton";
import GridComponent from "../../Components/reusable/GridComponent";
import TableComponent from "../../Components/reusable/TableComponent";
import { membersColumns } from "../../utils/helperFunctions";
import MemberCard from "./Components/MemberCard";
import GridAsset from "/src/assets/GridAsset";
import TableAsset from "/src/assets/TableAssets";
import axios from "/src/axiosInstance";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
function Members() {
  const members = useStore().members;
  const  removeMember = useStore().removeMember;

  const navigate = useNavigate();
  const { screenWidth } = useWindowSize();
  const [filterMembers, setFilterMembers] = useState("");
  const [tableView, setTableView] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [modal, setModal] = useState({ show: false });
  const [queryLoading, setQueryLoading] = useState(false);

  const columns = membersColumns;

  useEffect(() => {
    if (screenWidth <= 540) {
      setTableView(false);
      document.getElementById("switch").classList.add("hidden")
    } else {
      document.getElementById("switch").classList.remove("hidden")
    }
  }, [screenWidth])
  const handleSearchChange = (e) => {
    setFilterMembers(e.target.value);
  };

  const handleNavigation = () => {
    navigate('add-member')
  }
  const handleDelete = () => {
    const id = modal.data.id
    setModal({ data: {}, show: false });
    setQueryLoading(true);
    axios.delete(`/user/delete-user?id=${id}`).then((res) => {
        removeMember(id);
        // setEvents(events.filter((event) => event.id !== id));
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

  return (

    <main className={``}>

      {/* Members Table Section */}
      <section className={``}>
        {/* search component and add member */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex justify-start gap-2 items-center  w-2/3">
            <div className="flex gap-1 bg-lightGray p-1 rounded-md" id="switch">
              <div onClick={() => setTableView(true)}><TableAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} /></div><div onClick={() => setTableView(false)}><GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} /></div>
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
      {queryLoading && <LoaderComponent />}
    </main>
  );
}
export default Members;
