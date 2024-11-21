import { useFetch } from "@/CustomHooks/useFetch";
import GridAsset from "@/assets/GridAsset";
import axios from "@/axiosInstance";
import Dialog from "@/components/Dialog";
import NotificationCard from "@/components/NotificationCard";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import CalendarAssets from "../../../../assets/CalendarAsset";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import Calendar from "./Components/Calenda";
import EventsCard from "./Components/EventsCard";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { eventColumns } from "./utils/eventHelpers";

//TODO: work on delete ui
const EventsManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterEvents, setFilterEvents] = useState("");
  const [modal, setModal] = useState({ show: false });
  const [showOptions, setShowOptions] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({});
  const [tableView, setTableView] = useState(
    JSON.parse(localStorage.getItem("tableView") || "false")
  );
  const { data, refetch } = useFetch(api.fetch.fetchEvents);
  const { screenWidth } = useWindowSize();

  useEffect(() => {
    if (screenWidth <= 540) {
      setTableView(false);
      document.getElementById("switch")?.classList.add("hidden");
    } else {
      document.getElementById("switch")?.classList.remove("hidden");
    }
  }, [screenWidth]);
  useEffect(() => {
    if (data) {
      setEvents(data.data.data);
    }
  }, [data]);
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  const handleClose = () => {
    setShowNotification(false);
    setNotificationData({});
  };

  const handleFilter = (val: { year: number; month: number; date: Date }) => {
    setFilterDate(val.date);
    const queryParams = {
      month: val.month,
      year: val.year,
    };
    refetch(queryParams);
  };
  const handleSearchChange = (val: string) => {
    setFilterEvents(val);
  };

  const handleToggleView = (view: boolean) => {
    setTableView(view);
    localStorage.setItem("tableView", JSON.stringify(view));
  };

  const handleShowOptions = (eventId: any) => {
    setShowOptions((prevId) => (prevId === eventId ? null : eventId));
  };
  const handleDelete = () => {
    const id = modal.data.id;
    setModal({ data: {}, show: false });
    setQueryLoading(true);
    axios
      .delete(`/event/delete-event/?id=${id}`)
      .then((res) => {
        setEvents(events.filter((event) => event.id !== id));
        setShowNotification(true);
        setQueryLoading(false);
      })
      .catch((error) => {
        setQueryLoading(false);
        setShowNotification(true);
        setNotificationData({ type: "error" });
      });
  };
  const handleDeleteModal = (val) => {
    if (val) {
      setModal((prev) => {
        return { data: val, show: true };
      });
    } else {
      setModal((prev) => {
        return { data: {}, show: !prev.show };
      });
    }
  };

  return (
    <PageOutline>
      <div className={`flex gap-4 mb-4 ${!tableView ? " my-" : " mt-"}`}>
        <div
          className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer"
          id="switch"
        >
          <div onClick={() => handleToggleView(true)}>
            <CalendarAssets
              stroke={tableView ? "#8F95B2" : "#8F95B2"}
              className={tableView ? "bg-white rounded-md" : ""}
            />
          </div>
          <div onClick={() => handleToggleView(false)}>
            <GridAsset
              stroke={tableView ? "#8F95B2" : "#8F95B2"}
              className={
                tableView ? "bg-lightGray rounded-md" : "bg-white  rounded-md"
              }
            />
          </div>
        </div>
        <div className="w-full">
          <EventsManagerHeader
            onNavigate={handleNavigation}
            onFilter={handleFilter}
            viewfilter={!tableView}
            filterEvents={filterEvents}
            filterDate={filterDate}
            onSearch={handleSearchChange}
          />
        </div>
      </div>
      {!tableView ? (
        <GridComponent
          columns={eventColumns}
          data={events}
          displayedCount={24}
          renderRow={(row) => (
            <EventsCard
              event={row.original}
              key={row.id}
              onNavigate={handleNavigation}
              onDelete={handleDeleteModal}
              showOptions={showOptions === row.original.id}
              onShowOptions={() => handleShowOptions(row.original.id)}
            />
          )}
          filter={filterEvents}
          setFilter={setFilterEvents}
        />
      ) : (
        <Calendar
          events={events}
          onDelete={handleDeleteModal}
          onShowOptions={handleShowOptions}
          showOptions={showOptions}
        />
      )}
      {queryLoading && <LoaderComponent />}

      <Dialog
        showModal={modal.show}
        data={modal.data}
        onClick={handleDeleteModal}
        onDelete={handleDelete}
      />
      {showNotification && (
        <NotificationCard
          title="Deleted Successfully"
          onClose={handleClose}
          description="Event has been deleted successfully"
          type={notificationData.type}
        />
      )}
    </PageOutline>
  );
};

export default EventsManagement;
