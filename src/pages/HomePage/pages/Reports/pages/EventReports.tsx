import EmptyState from "@/components/EmptyState";
import { Button } from "@/components";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { EventsCard } from "@/pages/HomePage/pages/EventsManagement/Components/EventsCard";
import { EventsManagerHeader } from "@/pages/HomePage/pages/EventsManagement/Components/EventsManagerHeader";
import { eventColumns } from "@/pages/HomePage/pages/EventsManagement/utils/eventHelpers";
import { eventType } from "@/pages/HomePage/pages/EventsManagement/utils/eventInterfaces";
import { showNotification } from "@/pages/HomePage/utils";
import { api, relativePath } from "@/utils";
import type { QueryType } from "@/utils/interfaces";
import type {
  EventReportEligibleEvent,
  EventReportOverviewItem,
} from "@/utils/api/eventReports/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type UnknownRecord = Record<string, unknown>;
type MonthYearFilter = { month: number; year: number };
type GroupMode = "date" | "type";

type ReportOverviewCard = eventType & {
  event_id: string;
  event_date: string;
  generated_at?: string;
};

type EligibleEventOption = {
  event_id: string;
  event_name: string;
  event_date: string;
};

const DEFAULT_EVENTS_PAGE_SIZE = 99;

const toRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

const firstNonEmptyString = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = toStringValue(value);
    if (normalized) return normalized;
  }

  return "";
};

const normalizeDateOnly = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "";

  const prefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefixMatch) {
    return prefixMatch[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const formatDateLabel = (value: unknown) => {
  const normalizedDate = normalizeDateOnly(value);
  if (!normalizedDate) return "Unknown Date";

  return new Date(`${normalizedDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isExplicitlyGenerated = (record: UnknownRecord) => {
  const status = firstNonEmptyString(
    record.report_status,
    record.reportStatus,
    record.status
  ).toLowerCase();

  if (status) {
    return !["not_generated", "not generated"].includes(status);
  }

  const flags = [
    record.is_generated,
    record.isGenerated,
    record.generated,
    record.report_generated,
    record.reportGenerated,
  ];

  for (const flag of flags) {
    if (typeof flag === "boolean") return flag;
    if (typeof flag === "number") return flag === 1;
    if (typeof flag === "string") {
      const normalizedFlag = flag.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalizedFlag)) return true;
      if (["false", "0", "no"].includes(normalizedFlag)) return false;
    }
  }

  return true;
};

const normalizeOverviewItem = (
  item: EventReportOverviewItem | unknown
): ReportOverviewCard | null => {
  const record = toRecord(item);
  const eventId = firstNonEmptyString(
    record.event_id,
    record.eventId,
    record.id
  );
  const eventDate = normalizeDateOnly(
    firstNonEmptyString(record.event_date, record.eventDate, record.start_date)
  );
  const eventName = firstNonEmptyString(
    record.event_name,
    record.eventName,
    record.name
  );

  if (!eventId || !eventDate || !eventName || !isExplicitlyGenerated(record)) {
    return null;
  }

  return {
    id: eventId,
    event_id: eventId,
    event_name: eventName,
    name: eventName,
    event_name_id: eventId,
    start_date: firstNonEmptyString(record.start_date, eventDate) || eventDate,
    end_date:
      firstNonEmptyString(record.end_date, record.endDate, eventDate) || eventDate,
    start_time: firstNonEmptyString(record.start_time, record.startTime),
    end_time: firstNonEmptyString(record.end_time, record.endTime),
    location: firstNonEmptyString(record.location, record.venue),
    description: firstNonEmptyString(record.description, record.summary),
    event_type: firstNonEmptyString(record.event_type, record.eventType, "OTHER"),
    poster: firstNonEmptyString(record.poster, record.image) || undefined,
    event_date: eventDate,
    generated_at: firstNonEmptyString(record.generated_at, record.generatedAt),
  };
};

const normalizeEligibleEvent = (
  item: EventReportEligibleEvent | unknown
): EligibleEventOption | null => {
  const record = toRecord(item);
  const eventId = firstNonEmptyString(record.event_id, record.eventId, record.id);
  const eventName = firstNonEmptyString(
    record.event_name,
    record.eventName,
    record.name
  );
  const eventDate = normalizeDateOnly(
    firstNonEmptyString(record.event_date, record.eventDate, record.start_date)
  );

  if (!eventId || !eventName || !eventDate) {
    return null;
  }

  return {
    event_id: eventId,
    event_name: eventName,
    event_date: eventDate,
  };
};

const matchesMonthYear = (value: string, filter: MonthYearFilter) => {
  if (!value) return false;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return (
    parsed.getMonth() + 1 === filter.month && parsed.getFullYear() === filter.year
  );
};

const buildReportRoute = (event: ReportOverviewCard) => {
  const params = new URLSearchParams();
  params.set("eventDate", event.event_date);
  params.set("eventName", event.event_name);

  return `${relativePath.home.main}/${relativePath.home.reports.eventReports}/${event.event_id}?${params.toString()}`;
};

const EventReports = () => {
  const navigate = useNavigate();
  const { page, take, setPage } = usePaginationQueryParams(
    DEFAULT_EVENTS_PAGE_SIZE
  );

  const {
    refetch: refetchOverview,
    loading,
    error,
  } = useFetch(api.fetch.fetchEventReportsOverview, {}, true);
  const {
    refetch: refetchEligibleEvents,
    data: eligibleEventsResponse,
    loading: loadingEligibleEvents,
    error: eligibleEventsError,
  } = useFetch(api.fetch.fetchEligibleEventReports, {}, true);

  const [reports, setReports] = useState<ReportOverviewCard[]>([]);
  const [availableReports, setAvailableReports] = useState<ReportOverviewCard[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterEvents, setFilterEvents] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [activeDateFilter, setActiveDateFilter] = useState<MonthYearFilter | null>(
    null
  );
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedEligibleKey, setSelectedEligibleKey] = useState("");
  const [generateInfoMessage, setGenerateInfoMessage] = useState("");
  const [generateErrorMessage, setGenerateErrorMessage] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const fetchOverviewPage = useCallback(
    async (
      pageNumber: number,
      pageSize: number,
      monthYearFilter: MonthYearFilter | null,
      eventId: string
    ) => {
      const query: QueryType = {
        page: pageNumber,
        page_size: pageSize,
        take: pageSize,
        date_scope: monthYearFilter ? "month" : "all",
      };

      if (monthYearFilter) {
        query.month = monthYearFilter.month;
        query.year = monthYearFilter.year;
      }

      if (eventId) {
        query.event_id = eventId;
      }

      const response = await refetchOverview(query);
      const rawItems = toArray(response?.data);
      const normalized = rawItems
        .map((item) => normalizeOverviewItem(item))
        .filter((item): item is ReportOverviewCard => Boolean(item))
        .filter((item) => !monthYearFilter || matchesMonthYear(item.event_date, monthYearFilter))
        .filter((item) => !eventId || item.event_id === eventId);

      setReports(normalized);
      setTotalReports(response?.meta?.total ?? normalized.length);
    },
    [refetchOverview]
  );

  useEffect(() => {
    void fetchOverviewPage(page, take, activeDateFilter, selectedEventId);
  }, [activeDateFilter, fetchOverviewPage, page, selectedEventId, take]);

  useEffect(() => {
    let isActive = true;

    const loadAvailableReports = async () => {
      try {
        const response = await api.fetch.fetchEventReportsOverview({
          page: 1,
          page_size: 500,
          take: 500,
          date_scope: activeDateFilter ? "month" : "all",
          ...(activeDateFilter
            ? {
                month: activeDateFilter.month,
                year: activeDateFilter.year,
              }
            : {}),
        });
        const normalized = toArray(response?.data)
          .map((item) => normalizeOverviewItem(item))
          .filter((item): item is ReportOverviewCard => Boolean(item))
          .filter(
            (item) =>
              !activeDateFilter || matchesMonthYear(item.event_date, activeDateFilter)
          );

        if (isActive) {
          setAvailableReports(normalized);
        }
      } catch {
        if (isActive) {
          setAvailableReports([]);
        }
      }
    };

    void loadAvailableReports();

    return () => {
      isActive = false;
    };
  }, [activeDateFilter]);

  const eligibleEvents = useMemo(
    () =>
      toArray(eligibleEventsResponse?.data)
        .map((item) => normalizeEligibleEvent(item))
        .filter((item): item is EligibleEventOption => Boolean(item))
        .sort((left, right) => {
          if (left.event_date !== right.event_date) {
            return right.event_date.localeCompare(left.event_date);
          }

          return left.event_name.localeCompare(right.event_name);
        }),
    [eligibleEventsResponse?.data]
  );

  const selectedEligibleEvent = useMemo(
    () =>
      eligibleEvents.find(
        (item) => `${item.event_id}::${item.event_date}` === selectedEligibleKey
      ) || null,
    [eligibleEvents, selectedEligibleKey]
  );

  const handleFilter = useCallback(
    (value: { year: number; month: number; date: Date }) => {
      setFilterDate(value.date);
      setSelectedEventId("");
      setActiveDateFilter({ month: value.month, year: value.year });
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

  const handleResetFilters = useCallback(() => {
    setFilterEvents("");
    setFilterDate(null);
    setSelectedEventId("");
    setGroupMode("date");
    setOpenAccordions({});
    setActiveDateFilter(null);
    setPage(1);
  }, [setPage]);

  const filteredEvents = useMemo(() => {
    const query = filterEvents.trim().toLowerCase();

    return reports
      .filter((event) => !selectedEventId || event.event_id === selectedEventId)
      .filter((event) => {
        if (!query) return true;

        return [
          event.event_name,
          event.event_type,
          event.location,
          event.event_date,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
      })
      .sort((left, right) => {
        if (left.event_date !== right.event_date) {
          return left.event_date.localeCompare(right.event_date);
        }

        return left.event_name.localeCompare(right.event_name);
      });
  }, [filterEvents, reports, selectedEventId]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, ReportOverviewCard[]>();

    filteredEvents.forEach((event) => {
      const key =
        groupMode === "date"
          ? new Date(`${event.event_date}T00:00:00`).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })
          : event.event_type || "Other";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)?.push(event);
    });

    const entries = Array.from(groups.entries());
    if (groupMode === "type") {
      return entries.sort(([left], [right]) => left.localeCompare(right));
    }

    return entries;
  }, [filteredEvents, groupMode]);

  useEffect(() => {
    if (!groupedEvents.length) return;

    setOpenAccordions((current) => {
      if (Object.keys(current).length > 0) {
        return current;
      }

      return { [groupedEvents[0][0]]: true };
    });
  }, [groupedEvents]);

  const eventOptions = useMemo(() => {
    return [...availableReports]
      .sort((left, right) => {
        if (left.event_date !== right.event_date) {
          return left.event_date.localeCompare(right.event_date);
        }

        return left.event_name.localeCompare(right.event_name);
      })
      .map((event) => ({
        value: event.event_id,
        label: `${event.event_name || "Event"} (${formatDateLabel(event.event_date)})`,
      }));
  }, [availableReports]);

  const handleOpenEventReport = useCallback(
    (event: ReportOverviewCard) => {
      navigate(buildReportRoute(event));
    },
    [navigate]
  );

  const handleOpenGenerateModal = useCallback(() => {
    setShowGenerateModal(true);
    setSelectedEligibleKey("");
    setGenerateInfoMessage("");
    setGenerateErrorMessage("");
    void refetchEligibleEvents();
  }, [refetchEligibleEvents]);

  const handleCloseGenerateModal = useCallback(() => {
    setShowGenerateModal(false);
    setSelectedEligibleKey("");
    setGenerateInfoMessage("");
    setGenerateErrorMessage("");
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!selectedEligibleEvent) {
      setGenerateErrorMessage("Select an eligible event to continue.");
      return;
    }

    setGenerateErrorMessage("");
    setGenerateInfoMessage("");
    setIsGeneratingReport(true);

    try {
      const response = await api.post.generateEventReport({
        event_id: selectedEligibleEvent.event_id,
        event_date: selectedEligibleEvent.event_date,
      });
      const backendMessage =
        response.message || response.data?.message || "";

      if (backendMessage === "No event or church attendance data") {
        setGenerateInfoMessage(backendMessage);
        return;
      }

      showNotification("Event report generated successfully.", "success");
      handleCloseGenerateModal();
      navigate(
        `${relativePath.home.main}/${relativePath.home.reports.eventReports}/${selectedEligibleEvent.event_id}?eventDate=${encodeURIComponent(selectedEligibleEvent.event_date)}&eventName=${encodeURIComponent(selectedEligibleEvent.event_name)}`
      );
    } catch (error: unknown) {
      const backendMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.error ||
        "";

      if (backendMessage === "No event or church attendance data") {
        setGenerateInfoMessage(backendMessage);
        return;
      }

      setGenerateErrorMessage(
        backendMessage ||
          (error instanceof Error
            ? error.message
            : "Unable to generate the event report right now.")
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }, [handleCloseGenerateModal, navigate, selectedEligibleEvent]);

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
        title={`Event Reports (${totalReports || filteredEvents.length})`}
        subtitle="Review generated reports and open the event detail breakdown."
        hasSearch
        hasFilter
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        customIcon={
          <Button value="Generate Report" onClick={handleOpenGenerateModal} />
        }
      />

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
          onEventChange={handleEventFilterChange}
          onSearch={setFilterEvents}
          filterEvents={filterEvents}
          viewfilter
          filterDate={filterDate}
          selectedEventId={selectedEventId}
          eventOptions={eventOptions}
          showSearch={showSearch}
          showFilter={showFilter}
          onResetFilters={handleResetFilters}
        />
      </div>

      {loading && (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          Loading generated event reports...
        </p>
      )}

      {error && !loading && (
        <p className="rounded-lg bg-red-50 px-4 py-6 text-sm text-red-700">
          Failed to load event reports. Please refresh and try again.
        </p>
      )}

      {!loading && !error && filteredEvents.length === 0 && (
        <EmptyState
          scope="page"
          className="mx-auto w-[20rem]"
          msg="No generated event reports found"
        />
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="space-y-4">
          {groupedEvents.map(([groupKey, groupedItems]) => {
            const isOpen = openAccordions[groupKey] ?? false;

            return (
              <div key={groupKey} className="rounded-md border border-lightGray">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordions((current) => ({
                      ...current,
                      [groupKey]: !current[groupKey],
                    }))
                  }
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

      {totalReports > take && (
        <PaginationComponent
          total={totalReports}
          take={take}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}

      <Modal
        open={showGenerateModal}
        onClose={handleCloseGenerateModal}
        persist={false}
        className="max-w-xl"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-primary">Generate Report</h2>
            <p className="text-sm text-primaryGray">
              Only eligible events can be used to generate a report.
            </p>
          </div>

          {loadingEligibleEvents && (
            <p className="rounded-lg bg-lightGray/30 px-4 py-5 text-sm text-primaryGray">
              Loading eligible events...
            </p>
          )}

          {!loadingEligibleEvents && eligibleEventsError && (
            <p className="rounded-lg bg-red-50 px-4 py-5 text-sm text-red-700">
              Failed to load eligible events. Please try again.
            </p>
          )}

          {!loadingEligibleEvents && !eligibleEventsError && eligibleEvents.length === 0 && (
            <p className="rounded-lg border border-dashed border-lightGray px-4 py-5 text-sm text-primaryGray">
              No eligible events are available for report generation.
            </p>
          )}

          {!loadingEligibleEvents && !eligibleEventsError && eligibleEvents.length > 0 && (
            <label className="block space-y-2 text-sm">
              <span className="block text-xs font-medium text-primaryGray">
                Eligible event
              </span>
              <select
                className="h-11 w-full rounded-lg border border-lightGray px-3"
                value={selectedEligibleKey}
                onChange={(event) => setSelectedEligibleKey(event.target.value)}
              >
                <option value="">Select an event</option>
                {eligibleEvents.map((event) => (
                  <option
                    key={`${event.event_id}-${event.event_date}`}
                    value={`${event.event_id}::${event.event_date}`}
                  >
                    {event.event_name} - {formatDateLabel(event.event_date)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {generateInfoMessage && (
            <p className="rounded-lg bg-[#FFF7E6] px-4 py-3 text-sm text-[#996A13]">
              {generateInfoMessage}
            </p>
          )}

          {generateErrorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {generateErrorMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button value="Cancel" variant="ghost" onClick={handleCloseGenerateModal} />
            <Button
              value="Generate Report"
              onClick={handleGenerateReport}
              disabled={!selectedEligibleEvent || loadingEligibleEvents}
              loading={isGeneratingReport}
            />
          </div>
        </div>
      </Modal>
    </PageOutline>
  );
};

export default EventReports;
