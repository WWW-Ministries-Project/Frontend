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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1–12
  const currentYear = currentDate.getFullYear();

  /*api calls */
  const { data, refetch } = useFetch(api.fetch.fetchEvents, {}, false);
  const { screenWidth } = useWindowSize();
  const { executeDelete } = useDelete(api.delete.deleteEvent);

  // const [events, setEvents] = useState<eventType[]>([]);
  const { events, setEvents } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date>(currentDate);
  const [filterEvents, setFilterEvents] = useState<string>("");
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [tableView, setTableView] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("tableView") || "false");
    } catch (_) {
      return false;
    }
  });

  const [showUpcoming, setShowUpcoming] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("showUpcoming") || "false");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("showUpcoming", JSON.stringify(showUpcoming));
  }, [showUpcoming]);

  type GroupMode = "date" | "type";

  const [groupMode, setGroupMode] = useState<GroupMode>("date");

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refetch({
      month: String(currentMonth),
      year: String(currentYear),
    });
  }, [currentMonth, currentYear, refetch]);

  // Deleted the effect that synced data → events to avoid overwriting filtered results

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
  const handleFilter = useCallback(
    async (val: { year: number; month: number; date: Date }) => {
      const month = val.month; // 0–11 → 1–12
      const year = val.year;

      setFilterDate(val.date);

      const response = await refetch({
        month: String(month),
        year: String(year),
      });

      // IMPORTANT: apply filtered result
      const result = response?.data ?? response;

      if (!Array.isArray(result)) return;

      setEvents(
        result.map((event: any) => ({
          ...event,
          event_name: event.event_name ?? event.name ?? "",
          event_name_id: event.event_name_id ?? event.id ?? "",
        }))
      );
    },
    [refetch, setEvents]
  );

  // Search handler
  const handleSearchChange = useCallback((val: string) => {
    setFilterEvents(val);
  }, []);

  const handleResetFilters = useCallback(async () => {
    // reset UI state
    setFilterEvents("");
    setFilterDate('');
    setGroupMode("date");
    setOpenAccordions({});
    setShowUpcoming(false);

    // clear persisted filters
    localStorage.removeItem("showUpcoming");

    // refetch default data (current month/year)
    const response = await refetch({
      month: String(currentMonth),
      year: String(currentYear),
    });

    const result = response?.data ?? response;

    if (!Array.isArray(result)) return;

    setEvents(
      result.map((event: any) => ({
        ...event,
        event_name: event.event_name ?? event.name ?? "",
        event_name_id: event.event_name_id ?? event.id ?? "",
      }))
    );
  }, [
    refetch,
    setEvents,
    currentDate,
    currentMonth,
    currentYear,
  ]);

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
          return refetch({
            month: String(currentMonth),
            year: String(currentYear),
          });
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
    [executeDelete, refetch, currentMonth, currentYear, setEvents]
  );

  // Delete modal handler
  const handleDeleteModal = useCallback(
    (event: eventType) => {
      showDeleteDialog(event, handleDelete);
    },
    [handleDelete]
  );

  const isPresentOrUpcomingEvent = (event: eventType) => {
    if (!event.start_date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(event.start_date);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate >= today;
  };

  // Filtered events based on search and year filter
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (showUpcoming) {
          return isPresentOrUpcomingEvent(event);
        }
        return true;
      })
      .filter((event) =>
        event?.event_name?.toLowerCase().includes(filterEvents.toLowerCase())
      );
  }, [events, filterEvents, showUpcoming]);

  const getMonthKey = (label: string) => {
    const date = new Date(label);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const groupedEvents = useMemo(() => {
    const groups: Record<string, eventType[]> = {};

    filteredEvents.forEach((event) => {
      let key = "";

      if (groupMode === "date") {
        if (event.start_date) {
          const date = new Date(event.start_date);
          key = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
        } else {
          key = "Unknown Month";
        }
      } else {
        key = event.event_type || "Other";
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(event);
    });

    if (groupMode === "date") {
      return Object.entries(groups).sort(
        ([a], [b]) => getMonthKey(b) - getMonthKey(a)
      );
    }

    return Object.entries(groups);
  }, [filteredEvents, groupMode]);

  useEffect(() => {
    if (groupMode !== "date") return;
    if (!groupedEvents.length) return;

    const [mostRecent] = groupedEvents;

    setOpenAccordions({
      [mostRecent[0]]: true,
    });
  }, [groupMode, groupedEvents]);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
        btnName="Schedule Event"
        
      />
      <div className="flex items-center gap-2 mb-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showUpcoming}
            onChange={(e) => setShowUpcoming(e.target.checked)}
            className="accent-primary"
          />
          Show present & upcoming events
        </label>
      </div>
      {!tableView && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Group by:</span>
          <button
            onClick={() => setGroupMode("date")}
            className={`px-3 py-1 rounded text-sm ${
              groupMode === "date" ? "bg-primary text-white" : "bg-gray-100"
            }`}
          >
            Event Date
          </button>
          <button
            onClick={() => setGroupMode("type")}
            className={`px-3 py-1 rounded text-sm ${
              groupMode === "type" ? "bg-primary text-white" : "bg-gray-100"
            }`}
          >
            Event Type
          </button>
        </div>
      )}
      <div className={`flex gap-4 pb-4 ${!tableView ? "" : ""}`}>
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
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Conditional Rendering of Events */}
      {!tableView ? (
        filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {groupedEvents.map(([groupKey, events]) => {
              const isOpen = openAccordions[groupKey] ?? false;

              return (
                <div key={groupKey} className=" rounded-md">
                  <button
                    onClick={() => toggleAccordion(groupKey)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 font-medium"
                  >
                    <span>
                      {groupKey} ({events.length})
                    </span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="p-4">
                      <GridComponent
                        columns={eventColumns}
                        data={events}
                        displayedCount={screenWidth <= 540 ? 10 : 24}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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