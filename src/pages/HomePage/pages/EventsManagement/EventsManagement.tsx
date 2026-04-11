import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";
import { api } from "@/utils/api/apiCalls";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SeriesScopeModal, { type SeriesScope } from "./Components/SeriesScopeModal";
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

type MonthYearFilter = { month: number; year: number };
type GroupMode = "date" | "type";

const getCurrentMonthSelection = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    date: new Date(now.getFullYear(), now.getMonth(), 1),
  };
};

const getEventSortTimestamp = (event: Pick<eventType, "start_date" | "start_time">) => {
  if (!event.start_date) {
    return Number.POSITIVE_INFINITY;
  }

  const dateTime = event.start_time
    ? new Date(`${event.start_date}T${event.start_time}`)
    : new Date(event.start_date);
  const timestamp = dateTime.getTime();

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const compareEventsBySchedule = (a: eventType, b: eventType) => {
  const aTimestamp = getEventSortTimestamp(a);
  const bTimestamp = getEventSortTimestamp(b);

  if (aTimestamp !== bTimestamp) {
    if (!Number.isFinite(aTimestamp)) return 1;
    if (!Number.isFinite(bTimestamp)) return -1;
    return aTimestamp - bTimestamp;
  }

  const nameComparison = String(a.event_name || "").localeCompare(
    String(b.event_name || "")
  );

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return String(a.id ?? "").localeCompare(String(b.id ?? ""));
};

const compareEventsByReportPageOrder = (a: eventType, b: eventType) => {
  const aDate = new Date(a.start_date || "").getTime();
  const bDate = new Date(b.start_date || "").getTime();

  if (Number.isNaN(aDate) && Number.isNaN(bDate)) return 0;
  if (Number.isNaN(aDate)) return 1;
  if (Number.isNaN(bDate)) return -1;

  return aDate - bDate;
};

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
  const [filterDate, setFilterDate] = useState<Date | null>(
    () => getCurrentMonthSelection().date
  );
  const [filterEvents, setFilterEvents] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [availableEvents, setAvailableEvents] = useState<eventType[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [showOptions, setShowOptions] = useState<string | number | null>(null);

  // ── Series scope modal state ──────────────────────────────────────────────
  type SeriesModalState =
    | { open: false }
    | { open: true; action: "edit" | "delete"; event: CalendarEvent };
  const [seriesModal, setSeriesModal] = useState<SeriesModalState>({ open: false });
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

  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [activeDateFilter, setActiveDateFilter] = useState<MonthYearFilter>(
    () => {
      const { month, year } = getCurrentMonthSelection();
      return { month, year };
    }
  );

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
      monthYearFilter: MonthYearFilter,
      eventId: string
    ) => {
      const query: QueryType = {
        page: pageNumber,
        page_size: pageSize,
        take: pageSize,
        month: monthYearFilter.month,
        year: monthYearFilter.year,
      };

      if (eventId) {
        query.event_id = eventId;
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
    void fetchEventsPage(page, take, activeDateFilter, selectedEventId);
  }, [activeDateFilter, fetchEventsPage, page, selectedEventId, take]);

  useEffect(() => {
    let isActive = true;

    const loadAvailableEvents = async () => {
      try {
        const response = await api.fetch.fetchEvents({
          page: 1,
          page_size: 500,
          take: 500,
          month: activeDateFilter.month,
          year: activeDateFilter.year,
        });
        const result = response?.data ?? [];
        const normalized = Array.isArray(result) ? normalizeEvents(result) : [];

        if (!isActive) {
          return;
        }

        setAvailableEvents(normalized);
      } catch {
        if (isActive) {
          setAvailableEvents([]);
        }
      }
    };

    void loadAvailableEvents();

    return () => {
      isActive = false;
    };
  }, [activeDateFilter, normalizeEvents]);

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
      setSelectedEventId("");
      setActiveDateFilter({ month: val.month, year: val.year });
      setPage(1);
    },
    [setPage]
  );

  const handleEventFilterChange = useCallback(
    (value: string) => {
      setSelectedEventId(value);
      setPage(1);
    },
    [setPage]
  );

  // Search handler
  const handleSearchChange = useCallback((val: string) => {
    setFilterEvents(val);
  }, []);

  const handleResetFilters = useCallback(() => {
    const currentMonth = getCurrentMonthSelection();

    // reset UI state
    setFilterEvents("");
    setFilterDate(currentMonth.date);
    setSelectedEventId("");
    setGroupMode("date");
    setOpenAccordions({});
    setShowUpcoming(true);
    setActiveDateFilter({
      month: currentMonth.month,
      year: currentMonth.year,
    });

    // clear persisted filters
    localStorage.removeItem(SHOW_UPCOMING_STORAGE_KEY);
    setPage(1);
  }, [setPage]);

  // Toggle view handler
  const handleToggleView = useCallback((view: boolean) => {
    setTableView(view);
    localStorage.setItem("tableView", JSON.stringify(view));
  }, []);

  // Show options handler
  const handleShowOptions = useCallback((eventId: string | number) => {
    setShowOptions((prevId) => (prevId === eventId ? null : eventId));
  }, []);

  // ── Core single-event delete (unchanged) ─────────────────────────────────
  const handleDelete = useCallback(
    async (id: string | number) => {
      await executeDelete({ id: String(id) })
        .then(() => {
          showNotification("Event deleted successfully");
          return fetchEventsPage(page, take, activeDateFilter, selectedEventId);
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
    [activeDateFilter, executeDelete, fetchEventsPage, page, selectedEventId, setPage, take]
  );

  // ── Series-scope delete: called after user picks a scope in the modal ─────
  const handleSeriesDelete = useCallback(
    async (event: CalendarEvent, scope: SeriesScope) => {
      const seriesId = (event as any).recurrence_series_id as string | undefined;
      const fromDate = event.start_date;

      try {
        if (scope === "this" || !seriesId) {
          await executeDelete({ id: String(event.id) });
        } else if (scope === "following") {
          await api.delete.deleteEventSeriesFrom({ series_id: seriesId, from_date: fromDate });
        } else {
          await api.delete.deleteEventSeries({ series_id: seriesId });
        }

        showNotification("Event deleted successfully");
        const count = await fetchEventsPage(page, take, activeDateFilter, selectedEventId);
        if (count === 0 && page > 1) setPage(page - 1);
      } catch {
        showNotification("Event could not be deleted", "error");
      }
    },
    [activeDateFilter, executeDelete, fetchEventsPage, page, selectedEventId, setPage, take]
  );

  // ── Delete entry-point: show scope modal if recurring, else normal dialog ─
  const handleDeleteModal = useCallback(
    (event: CalendarEvent) => {
      const seriesId = (event as any).recurrence_series_id as string | undefined;
      if (seriesId) {
        setSeriesModal({ open: true, action: "delete", event });
      } else {
        showDeleteDialog(
          { id: event.id, name: event.name ?? event.event_name ?? "Event" },
          handleDelete
        );
      }
    },
    [handleDelete]
  );

  // ── Edit entry-point: show scope modal if recurring, else navigate directly ─
  const handleEditEvent = useCallback(
    (event: CalendarEvent) => {
      const seriesId = (event as any).recurrence_series_id as string | undefined;
      if (seriesId) {
        setSeriesModal({ open: true, action: "edit", event });
      } else {
        navigate(`/home/manage-event?event_id=${event.id}`);
      }
    },
    [navigate]
  );

  // ── Handles the user's choice in the scope modal ──────────────────────────
  const handleSeriesModalConfirm = useCallback(
    async (scope: SeriesScope) => {
      if (!seriesModal.open) return;
      const { action, event } = seriesModal;
      setSeriesModal({ open: false });

      if (action === "delete") {
        await handleSeriesDelete(event, scope);
      } else {
        // Edit: navigate to the edit form with scope encoded in the URL
        const params = new URLSearchParams({ event_id: String(event.id) });
        if (scope !== "this") {
          params.set("edit_scope", scope);
          params.set("series_id", (event as any).recurrence_series_id ?? "");
          params.set("series_from_date", event.start_date);
        }
        navigate(`/home/manage-event?${params.toString()}`);
      }
    },
    [handleSeriesDelete, navigate, seriesModal]
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
    return [...events]
      .filter((event) => {
        if (showUpcoming) {
          return isPresentOrUpcomingEvent(event);
        }
        return true;
      })
      .filter((event) =>
        event?.event_name?.toLowerCase().includes(filterEvents.toLowerCase())
      )
      .sort(compareEventsByReportPageOrder);
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

  const eventOptions = useMemo(() => {
    return [...availableEvents]
      .sort(compareEventsBySchedule)
      .map((event) => {
        const startDate = new Date(event.start_date || "");
        const hasValidDate = !Number.isNaN(startDate.getTime());
        const formattedDate = hasValidDate
          ? startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return {
          value: String(event.id),
          label: formattedDate
            ? `${event.event_name || "Event"} (${formattedDate})`
            : String(event.event_name || "Event"),
        };
      });
  }, [availableEvents]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return filteredEvents.map((event) => ({
      ...event,
      qr_code: event.qr_code ?? undefined,
    }));
  }, [filteredEvents]);

  return (
    <PageOutline>
      {/* Series scope modal — renders above everything else */}
      {seriesModal.open && (
        <SeriesScopeModal
          action={seriesModal.action}
          eventName={seriesModal.event.event_name ?? seriesModal.event.name}
          onConfirm={handleSeriesModalConfirm}
          onCancel={() => setSeriesModal({ open: false })}
        />
      )}
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
          onEventChange={handleEventFilterChange}
          viewfilter={!tableView}
          filterEvents={filterEvents}
          filterDate={filterDate}
          selectedEventId={selectedEventId}
          eventOptions={eventOptions}
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
                            onEdit={handleEditEvent}
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
          events={calendarEvents}
          onDelete={handleDeleteModal}
          onEdit={handleEditEvent}
          onShowOptions={handleShowOptions}
          showOptions={showOptions}
          onViewEvent={handleOpenEventDetails}
        />
      )}

      {totalEvents > take && (
        <PaginationComponent
          total={totalEvents}
          take={take}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </PageOutline>
  );
};

export default EventsManagement;
