import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { showDeleteDialog, showNotification } from "../../utils";
import { EventsCard } from "./Components/EventsCard";
import { EventsManagerHeader } from "./Components/EventsManagerHeader";
import { eventColumns } from "./utils/eventHelpers";
// import { EventType } from "./utils/eventInterfaces"; // Added proper type definition
import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { useStore } from "@/store/useStore";
import Calendar from "./Components/Calenda";
import { eventType } from "./utils/eventInterfaces";

const EventsManagement = () => {
  const navigate = useNavigate();

  /*api calls */
  const { data, refetch } = useFetch(api.fetch.fetchEvents, {}, true);
  const { screenWidth } = useWindowSize();
  const { executeDelete } = useDelete(api.delete.deleteEvent);

  // const [events, setEvents] = useState<eventType[]>([]);
  const { events, setEvents } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [filterEvents, setFilterEvents] = useState<string>("");
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [tableView, setTableView] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("tableView") || "false");
    } catch (_) {
      return false;
    }
  });

  // Handle screen width changes
  useEffect(() => {
    if (screenWidth <= 540) {
      setTableView(false);
      document.getElementById("switch")?.classList.add("hidden");
    } else {
      document.getElementById("switch")?.classList.remove("hidden");
    }
  }, [screenWidth, tableView]);

  // Navigation handler
  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  // Filter handler
  // const handleFilter = () => {};
  const handleFilter = useCallback(
    (val: { year: number; month: number; date: Date }) => {
      setFilterDate(val.date);
      refetch({ month: val.month + "", year: val.year + "" });
    },
    [refetch]
  );

  // Search handler
  const handleSearchChange = useCallback((val: string) => {
    setFilterEvents(val);
  }, []);

  // Toggle view handler
  const handleToggleView = useCallback((view: boolean) => {
    setTableView(view);
    localStorage.setItem("tableView", JSON.stringify(view));
  }, []);

  // Show options handler
  const handleShowOptions = useCallback((eventId: string) => {
    setShowOptions((prevId) => (prevId === eventId ? null : eventId));
  }, []);

  // Delete handler
  const handleDelete = useCallback(
    async (id: string | number) => {
      await executeDelete({ id: String(id) })
        .then(() => {
          showNotification("Event deleted successfully");
          return refetch();
        })
        .then((response) => {
          setEvents(
            (response?.data || []).map((event: any) => ({
              ...event,
              event_name: event.event_name ?? event.name ?? "",
              event_name_id: event.event_name_id ?? event.id ?? "",
            }))
          );
        })
        .catch((error) => {
          showNotification("Event could not be deleted", "error");
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [executeDelete]
  );

  // Delete modal handler
  const handleDeleteModal = useCallback(
    (event: eventType) => {
      showDeleteDialog(event, handleDelete);
    },
    [handleDelete]
  );

  // Filtered events based on search
  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      event?.event_name?.toLowerCase().includes(filterEvents.toLowerCase())
    );
  }, [events, filterEvents]);

  useEffect(() => {
    console.log("Filtered events", events);
    
  }, [])

  return (
    <PageOutline className="p-6">
      <HeaderControls
        title={`Events (${filteredEvents.length})`}
        tableView={tableView}
        handleViewMode={handleToggleView}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        hasSearch={true}
        hasFilter={!tableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        handleClick={() => handleNavigation("/home/manage-event")}
        screenWidth={screenWidth}
        btnName="Add Event"
      />
      <div className={`flex gap-4  ${!tableView ? "" : ""}`}>
        {/* Events Manager Header */}
        <EventsManagerHeader
          onNavigate={handleNavigation}
          onFilter={handleFilter}
          viewfilter={!tableView}
          filterEvents={filterEvents}
          filterDate={filterDate}
          onSearch={handleSearchChange}
          showSearch={showSearch}
          showFilter={showFilter}
        />
      </div>

      {/* Conditional Rendering of Events */}
      {!tableView ? (
        filteredEvents.length > 0 ? (
          <GridComponent
            columns={eventColumns}
            data={filteredEvents}
            displayedCount={screenWidth <= 540 ? 10 : 24} // Dynamic count based on screen size
            columnFilters={[]}
            setColumnFilters={() => {}}
            renderRow={(row) => (
              <EventsCard
                event={row.original}
                key={row.original.id}
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
          <EmptyState
            className="w-[20rem] mx-auto"
            msg="😞 Sorry, No events yet"
          />
        )
      ) : (
        <Calendar
          events={filteredEvents}
          onDelete={handleDeleteModal}
          onShowOptions={handleShowOptions}
          showOptions={showOptions}
        />
      )}
    </PageOutline>
  );
};

export default EventsManagement;