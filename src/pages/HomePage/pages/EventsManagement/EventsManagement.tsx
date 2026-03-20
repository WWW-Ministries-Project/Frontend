import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";
import { api } from "@/utils/api/apiCalls";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { PaginationComponent } from "../../Components/reusable/PaginationComponent";
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
import { CalendarEvent } from "./Components/calenda/utils/CalendaHelpers";

const SHOW_UPCOMING_STORAGE_KEY = "eventsShowUpcoming_v2";

const EventsManagement = () => {
  const navigate = useNavigate();
  const DEFAULT_EVENTS_PAGE_SIZE = 99;
  const { page, take, setPage } = usePaginationQueryParams(
    DEFAULT_EVENTS_PAGE_SIZE
  );

  /*api calls */
  const { refetch } = useFetch(api.fetch.fetchEvents, {}, false);
  const { screenWidth } = useWindowSize();
  const { executeDelete } = useDelete(api.delete.deleteEvent);

  // const [events, setEvents] = useState<eventType[]>([]);
  const { events, setEvents } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterEvents, setFilterEvents] = useState<string>("");
  const [totalEvents, setTotalEvents] = useState(0);
  const [showOptions, setShowOptions] = useState<string | number | null>(null);
  const [tableView, setTableView] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("tableView") || "false");
    } catch {
      return false;
    }
  });

  const [showUpcoming, setShowUpcoming] = useState<boolean>(() => {
    try {
      const storedValue = localStorage.getItem(SHOW_UPCOMING_STORAGE_KEY);
      if (storedValue === null) {
        return true;
      }

      const parsedValue = JSON.parse(storedValue);
      return typeof parsedValue === "boolean" ? parsedValue : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      SHOW_UPCOMING_STORAGE_KEY,
      JSON.stringify(showUpcoming)
    );
  }, [showUpcoming]);

  type GroupMode = "date" | "type";
  type MonthYearFilter = { month: number; year: number };

  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [activeDateFilter, setActiveDateFilter] =
    useState<MonthYearFilter | null>(null);

  const [openAccordions, setOpenAccordions] = useState<
    Record<string, boolean>
  >({});

  const normalizeEvents = useCallback((data: unknown[]): eventType[] => {
    return data.map((event) => {
      const normalizedEvent = event as eventType & { name?: string };
      return {
        ...normalizedEvent,
        event_name: normalizedEvent.event_name ?? normalizedEvent.name ?? "",
        event_name_id: normalizedEvent.event_name_id ?? normalizedEvent.id ?? "",
      };
    });
  }, []);

  const fetchEventsPage = useCallback(
    async (
      pageNumber: number,
      pageSize: number,
      monthYearFilter: MonthYearFilter | null
    ) => {
      const query: QueryType = {
        page: pageNumber,
        page_size: pageSize,
        take: pageSize,
      };

      if (monthYearFilter) {
        query.month = monthYearFilter.month;
        query.year = monthYearFilter.year;
      }

      const response = await refetch(query);
      const result = response?.data ?? [];
      const normalized = Array.isArray(result) ? normalizeEvents(result) : [];

      setEvents(normalized);
      setTotalEvents(response?.meta?.total ?? normalized.length);

      return normalized.length;
    },
    [normalizeEvents, refetch, setEvents]
  );

  useEffect(() => {
    fetchEventsPage(page, take, activeDateFilter);
  }, [activeDateFilter, fetchEventsPage, page, take]);

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
    (val: { year: number; month: number; date: Date }) => {
      setFilterDate(val.date);
      setActiveDateFilter({ month: val.month, year: val.year });
      setPage(1);
    },
    [setPage]
  );

  // Search handler
  const handleSearchChange = useCallback((val: string) => {
    setFilterEvents(val);
  }, []);

  const handleResetFilters = useCallback(() => {
    // reset UI state
    setFilterEvents("");
    setFilterDate(null);
    setGroupMode("date");
    setOpenAccordions({});
    setShowUpcoming(true);
    setActiveDateFilter(null);

    // clear persisted filters
    localStorage.removeItem(SHOW_UPCOMING_STORAGE_KEY);
    setPage(1);
  }, [
    setPage,
  ]);

  // Toggle view handler
  const handleToggleView = useCallback((view: boolean) => {
    setTableView(view);
    localStorage.setItem("tableView", JSON.stringify(view));
  }, []);

  // Show options handler
  const handleShowOptions = useCallback((eventId: string | number) => {
    setShowOptions((prevId) => (prevId === eventId ? null : eventId));
  }, []);

  // Delete handler
  const handleDelete = useCallback(
    async (id: string | number) => {
      await executeDelete({ id: String(id) })
        .then(() => {
          showNotification("Event deleted successfully");
          return fetchEventsPage(page, take, activeDateFilter);
        })
        .then((currentPageItemCount) => {
          if (currentPageItemCount === 0 && page > 1) {
            setPage(page - 1);
          }
        })
        .catch(() => {
          showNotification("Event could not be deleted", "error");
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDateFilter, executeDelete, fetchEventsPage, page, setPage, take]
  );

  // Delete modal handler
  const handleDeleteModal = useCallback(
    (event: CalendarEvent) => {
      showDeleteDialog(
        {
          id: event.id,
          name: event.name ?? event.event_name ?? "Event",
        },
        handleDelete
      );
    },
    [handleDelete]
  );

  const handleOpenEventDetails = useCallback(
    (event: CalendarEvent) => {
      navigate(`/home/events/events/view-event?event_id=${event.id}`);
    },
    [navigate]
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const getEventDayMs = (event: eventType) => {
      if (!event.start_date) return Number.POSITIVE_INFINITY;
      const eventDay = new Date(event.start_date);
      if (isNaN(eventDay.getTime())) return Number.POSITIVE_INFINITY;
      eventDay.setHours(0, 0, 0, 0);
      return eventDay.getTime();
    };

    const getEventDateTimeMs = (event: eventType) => {
      if (!event.start_date) return Number.POSITIVE_INFINITY;
      const dateTime = event.start_time
        ? new Date(`${event.start_date}T${event.start_time}`)
        : new Date(event.start_date);
      return isNaN(dateTime.getTime())
        ? Number.POSITIVE_INFINITY
        : dateTime.getTime();
    };

    const getSortBucket = (eventDayMs: number) => {
      if (!Number.isFinite(eventDayMs)) return 2;
      return eventDayMs >= todayMs ? 0 : 1;
    };

    return events
      .filter((event) => {
        if (showUpcoming) {
          return isPresentOrUpcomingEvent(event);
        }
        return true;
      })
      .filter((event) =>
        event?.event_name?.toLowerCase().includes(filterEvents.toLowerCase())
      )
      .sort((a, b) => {
        const aDayMs = getEventDayMs(a);
        const bDayMs = getEventDayMs(b);
        const aBucket = getSortBucket(aDayMs);
        const bBucket = getSortBucket(bDayMs);

        if (aBucket !== bBucket) return aBucket - bBucket;

        const aDateTimeMs = getEventDateTimeMs(a);
        const bDateTimeMs = getEventDateTimeMs(b);
        if (aDateTimeMs !== bDateTimeMs) return aDateTimeMs - bDateTimeMs;

        return String(a.event_name || "").localeCompare(
          String(b.event_name || "")
        );
      });
  }, [events, filterEvents, showUpcoming]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, eventType[]>();

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

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)?.push(event);
    });

    const groupedEntries = Array.from(groups.entries());
    if (groupMode === "type") {
      return groupedEntries.sort(([a], [b]) => a.localeCompare(b));
    }
    return groupedEntries;
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
    <PageOutline>
      <HeaderControls
        title={`Events (${totalEvents || filteredEvents.length})`}
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
                            onSelect={handleOpenEventDetails}
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
            scope="page"
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
          onViewEvent={handleOpenEventDetails}
        />
      )}

      {totalEvents > take && (
        <PaginationComponent
          total={totalEvents}
          take={take}
          onPageChange={() => {}}
        />
      )}
    </PageOutline>
  );
};

export default EventsManagement;
