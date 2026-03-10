import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { EventsCard } from "@/pages/HomePage/pages/EventsManagement/Components/EventsCard";
import { EventsManagerHeader } from "@/pages/HomePage/pages/EventsManagement/Components/EventsManagerHeader";
import { eventColumns } from "@/pages/HomePage/pages/EventsManagement/utils/eventHelpers";
import { eventType } from "@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces";
import { api, relativePath } from "@/utils";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type MonthYearFilter = { month: number; year: number };
type GroupMode = "date" | "type";

const DEFAULT_EVENTS_PAGE_SIZE = 99;

const normalizeEventList = (data: unknown[]): eventType[] => {
  return data.map((event) => {
    const normalizedEvent = event as eventType & { name?: string };

    return {
      ...normalizedEvent,
      event_name: normalizedEvent.event_name ?? normalizedEvent.name ?? "",
      event_name_id: normalizedEvent.event_name_id ?? normalizedEvent.id ?? "",
    };
  });
};

const isPresentOrUpcomingEvent = (event: eventType): boolean => {
  if (!event.start_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(event.start_date);
  if (Number.isNaN(eventDate.getTime())) return false;
  eventDate.setHours(0, 0, 0, 0);

  return eventDate >= today;
};

const EventReports = () => {
  const navigate = useNavigate();
  const { page, take, setPage } = usePaginationQueryParams(
    DEFAULT_EVENTS_PAGE_SIZE
  );

  const { refetch, loading, error } = useFetch(api.fetch.fetchEvents, {}, false);

  const [events, setEvents] = useState<eventType[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterEvents, setFilterEvents] = useState("");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [activeDateFilter, setActiveDateFilter] =
    useState<MonthYearFilter | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );

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
      const normalized = Array.isArray(result) ? normalizeEventList(result) : [];

      setEvents(normalized);
      setTotalEvents(response?.meta?.total ?? normalized.length);

      return normalized.length;
    },
    [refetch]
  );

  useEffect(() => {
    void fetchEventsPage(page, take, activeDateFilter);
  }, [activeDateFilter, fetchEventsPage, page, take]);

  const handleFilter = useCallback(
    (val: { year: number; month: number; date: Date }) => {
      setFilterDate(val.date);
      setActiveDateFilter({ month: val.month, year: val.year });
      setPage(1);
    },
    [setPage]
  );

  const handleResetFilters = useCallback(() => {
    setFilterEvents("");
    setFilterDate(null);
    setGroupMode("date");
    setOpenAccordions({});
    setShowUpcoming(false);
    setActiveDateFilter(null);
    setPage(1);
  }, [setPage]);

  const filteredEvents = useMemo(() => {
    const query = filterEvents.trim().toLowerCase();

    return events
      .filter((event) => (showUpcoming ? isPresentOrUpcomingEvent(event) : true))
      .filter((event) => {
        if (!query) return true;

        const eventName = String(event.event_name ?? "").toLowerCase();
        const eventType = String(event.event_type ?? "").toLowerCase();
        const location = String(event.location ?? "").toLowerCase();

        return (
          eventName.includes(query) ||
          eventType.includes(query) ||
          location.includes(query)
        );
      })
      .sort((a, b) => {
        const aDate = new Date(a.start_date || "").getTime();
        const bDate = new Date(b.start_date || "").getTime();

        if (Number.isNaN(aDate) && Number.isNaN(bDate)) return 0;
        if (Number.isNaN(aDate)) return 1;
        if (Number.isNaN(bDate)) return -1;

        return aDate - bDate;
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

    const entries = Array.from(groups.entries());
    if (groupMode === "type") {
      return entries.sort(([a], [b]) => a.localeCompare(b));
    }

    return entries;
  }, [filteredEvents, groupMode]);

  useEffect(() => {
    if (!groupedEvents.length) return;

    const [firstGroup] = groupedEvents;
    setOpenAccordions({ [firstGroup[0]]: true });
  }, [groupedEvents]);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleOpenEventReport = (event: eventType) => {
    const eventId = String(event.id);
    const params = new URLSearchParams();

    if (event.start_date) {
      params.set("eventDate", event.start_date);
    }

    if (event.event_name) {
      params.set("eventName", event.event_name);
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : "";

    navigate(
      `${relativePath.home.main}/${relativePath.home.reports.eventReports}/${eventId}${suffix}`
    );
  };

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    {
      label: "Reports",
      link: `${relativePath.home.main}/${relativePath.home.reports.eventReports}`,
    },
    { label: "Event Reports", link: "" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <HeaderControls
        title={`Event Reports (${totalEvents || filteredEvents.length})`}
        subtitle="Review events and open detailed department, attendance, and financial reports."
        hasSearch
        hasFilter
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
      />

      <div className="mb-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUpcoming}
            onChange={(event) => setShowUpcoming(event.target.checked)}
            className="accent-primary"
          />
          Show present & upcoming events
        </label>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Group by:</span>
        <button
          type="button"
          onClick={() => setGroupMode("date")}
          className={`rounded px-3 py-1 text-sm ${
            groupMode === "date" ? "bg-primary text-white" : "bg-gray-100"
          }`}
        >
          Event Date
        </button>
        <button
          type="button"
          onClick={() => setGroupMode("type")}
          className={`rounded px-3 py-1 text-sm ${
            groupMode === "type" ? "bg-primary text-white" : "bg-gray-100"
          }`}
        >
          Event Type
        </button>
      </div>

      <div className="flex gap-4 pb-4">
        <EventsManagerHeader
          onNavigate={() => {}}
          onFilter={handleFilter}
          onSearch={setFilterEvents}
          filterEvents={filterEvents}
          viewfilter
          filterDate={filterDate}
          showSearch={showSearch}
          showFilter={showFilter}
          onResetFilters={handleResetFilters}
        />
      </div>

      {loading && (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          Loading event reports...
        </p>
      )}

      {error && !loading && (
        <p className="rounded-lg bg-red-50 px-4 py-6 text-sm text-red-700">
          Failed to load events. Please refresh and try again.
        </p>
      )}

      {!loading && !error && filteredEvents.length === 0 && (
        <EmptyState scope="page" className="mx-auto w-[20rem]" msg="No events found" />
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="space-y-4">
          {groupedEvents.map(([groupKey, groupedItems]) => {
            const isOpen = openAccordions[groupKey] ?? false;

            return (
              <div key={groupKey} className="rounded-md border border-lightGray">
                <button
                  type="button"
                  onClick={() => toggleAccordion(groupKey)}
                  className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 font-medium"
                >
                  <span>
                    {groupKey} ({groupedItems.length})
                  </span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="p-4">
                    <GridComponent
                      columns={eventColumns}
                      data={groupedItems}
                      displayedCount={24}
                      columnFilters={[]}
                      setColumnFilters={() => {}}
                      renderRow={(row) => (
                        <EventsCard
                          key={String(row.original.id)}
                          event={row.original}
                          onNavigate={() => {}}
                          onDelete={() => {}}
                          onShowOptions={() => {}}
                          showOptions={false}
                          readOnly
                          onSelect={handleOpenEventReport}
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

export default EventReports;
