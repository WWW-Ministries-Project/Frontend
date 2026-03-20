import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import {
  BiometricEventAttendanceRecord,
  EventResponseType,
} from "@/utils/api/events/interfaces";
import { VisitorType } from "@/utils/api/visitors/interfaces";
import { DateTime } from "luxon";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { type ReactNode, useMemo, useState } from "react";
import { attendanceContract } from "../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  numberFormatter,
  resolveFiltersDateRange,
  toPercent,
  toDateTime,
} from "../Analytics/utils";

ensureAnalyticsChartsRegistered();

type AttendanceRecord = Record<string, unknown>;
type RankedInsight = {
  label: string;
  value: string;
  hint?: string;
};

type NormalizedAttendanceRecord = {
  eventKey: string;
  eventId: string;
  eventName: string;
  date: string;
  totals: ReturnType<typeof getTotals>;
};

type NormalizedEvent = {
  eventKey: string;
  eventId: string;
  eventName: string;
  eventType: string;
  startDate: string;
  startTime: string;
  registrations: number;
  capacity: number;
  requiresRegistration: boolean;
};

type NormalizedVisitor = {
  eventKey: string;
  eventId: string;
  eventName: string;
  visitDate: string;
  visitCount: number;
  howHeard: string;
  gender: string;
  isClergy: boolean;
};

type NormalizedBiometric = {
  eventKey: string;
  eventId: string;
  eventName: string;
  attendanceDate: string;
  firstPunchAt: string;
  punchCount: number;
  attendanceRecorded: boolean;
};

type PunctualityBucket = "early" | "onTime" | "late" | "unclassified";

type EventSummary = {
  eventKey: string;
  eventId: string;
  eventName: string;
  eventType: string;
  date: string;
  startTime: string;
  registrations: number;
  capacity: number;
  requiresRegistration: boolean;
  memberAttendance: number;
  visitors: number;
  visitorClergy: number;
  totalAttendance: number;
  male: number;
  female: number;
  attendanceSummaries: number;
  visitorRecords: number;
  firstTimeVisitors: number;
  repeatVisitors: number;
  biometricMembers: number;
  biometricPunches: number;
  biometricRecorded: number;
  biometricUnrecorded: number;
  visitorsMissingGender: number;
  punctuality: Record<PunctualityBucket, number>;
  sourceCounts: Record<string, number>;
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOT_ORDER = ["Morning", "Afternoon", "Evening", "Night", "Unknown"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractArrayData = <T,>(source: unknown): T[] => {
  if (Array.isArray(source)) return source as T[];

  if (isRecord(source) && Array.isArray(source.data)) {
    return source.data as T[];
  }

  return [];
};

const toText = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const readText = (record: AttendanceRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = toText(record[key]);
    if (value) return value;
  }

  return "";
};

const readCount = (record: AttendanceRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = Number(record[key] ?? 0);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const buildEventKey = (
  eventId: unknown,
  eventName: unknown,
  fallback?: unknown
) => {
  const id = toText(eventId);
  if (id) return `id:${id}`;

  const name = toText(eventName).toLowerCase();
  if (name) return `name:${name}`;

  const fallbackKey = toText(fallback);
  if (fallbackKey) return `fallback:${fallbackKey}`;

  return "";
};

const fallbackEventName = (eventId: unknown, eventName: unknown) => {
  const name = toText(eventName);
  if (name) return name;

  const id = toText(eventId);
  if (id) return `Event ${id}`;

  return "Unknown Event";
};

const parseTimeValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hourMinute = DateTime.fromFormat(trimmed, "HH:mm");
  if (hourMinute.isValid) return hourMinute;

  const hourMinuteSecond = DateTime.fromFormat(trimmed, "HH:mm:ss");
  if (hourMinuteSecond.isValid) return hourMinuteSecond;

  const iso = DateTime.fromISO(`1970-01-01T${trimmed}`);
  return iso.isValid ? iso : null;
};

const formatDateLabel = (value: string) => {
  const date = DateTime.fromISO(value);
  return date.isValid ? date.toFormat("dd LLL yyyy") : value;
};

const truncateLabel = (value: string, limit = 20) => {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
};

const formatPercentValue = (value: number) =>
  `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;

const getTimeSlot = (startTime: string) => {
  const parsed = parseTimeValue(startTime);
  if (!parsed) return "Unknown";

  const hour = parsed.hour;
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

const createEmptyPunctuality = (): Record<PunctualityBucket, number> => ({
  early: 0,
  onTime: 0,
  late: 0,
  unclassified: 0,
});

const createEventSummary = (
  seed: Pick<
    EventSummary,
    | "eventKey"
    | "eventId"
    | "eventName"
    | "eventType"
    | "date"
    | "startTime"
    | "registrations"
    | "capacity"
    | "requiresRegistration"
  >
): EventSummary => ({
  ...seed,
  memberAttendance: 0,
  visitors: 0,
  visitorClergy: 0,
  totalAttendance: 0,
  male: 0,
  female: 0,
  attendanceSummaries: 0,
  visitorRecords: 0,
  firstTimeVisitors: 0,
  repeatVisitors: 0,
  biometricMembers: 0,
  biometricPunches: 0,
  biometricRecorded: 0,
  biometricUnrecorded: 0,
  visitorsMissingGender: 0,
  punctuality: createEmptyPunctuality(),
  sourceCounts: {},
});

const classifyPunctuality = (
  firstPunchAt: string,
  eventDate: string,
  startTime: string
): PunctualityBucket => {
  const firstPunch = toDateTime(firstPunchAt);
  const date = DateTime.fromISO(eventDate);
  const time = parseTimeValue(startTime);

  if (!firstPunch || !date.isValid || !time) return "unclassified";

  const scheduled = date.set({
    hour: time.hour,
    minute: time.minute,
    second: time.second,
    millisecond: 0,
  });

  const diffMinutes = firstPunch.diff(scheduled, "minutes").minutes;

  if (diffMinutes < -15) return "early";
  if (diffMinutes <= 15) return "onTime";
  return "late";
};

const getTotals = (record: AttendanceRecord) => {
  const adultMale = readCount(record, "adultMale", "adult_male");
  const adultFemale = readCount(record, "adultFemale", "adult_female");
  const childrenMale = readCount(record, "childrenMale", "children_male");
  const childrenFemale = readCount(record, "childrenFemale", "children_female");
  const youthMale = readCount(record, "youthMale", "youth_male");
  const youthFemale = readCount(record, "youthFemale", "youth_female");
  const visitorsMale = readCount(record, "visitorsMale", "visitors_male");
  const visitorsFemale = readCount(record, "visitorsFemale", "visitors_female");
  const visitorsTotal = readCount(record, "visitorsTotal", "visitors_total");
  const visitorClergyMale = readCount(
    record,
    "visitorClergyMale",
    "visitor_clergy_male"
  );
  const visitorClergyFemale = readCount(
    record,
    "visitorClergyFemale",
    "visitor_clergy_female"
  );
  const visitorClergyTotal = readCount(
    record,
    "visitorClergyTotal",
    "visitor_clergy_total"
  );
  const attendanceMale = adultMale + childrenMale + youthMale;
  const attendanceFemale = adultFemale + childrenFemale + youthFemale;
  const visitorMale =
    readCount(record, "visitorTotalMale", "visitor_total_male") ||
    visitorsMale + visitorClergyMale;
  const visitorFemale =
    readCount(record, "visitorTotalFemale", "visitor_total_female") ||
    visitorsFemale + visitorClergyFemale;
  const visitorTotal =
    readCount(record, "visitorTotal", "visitor_total", "visitors") ||
    visitorsTotal + visitorClergyTotal;
  const attendanceTotal = attendanceMale + attendanceFemale;

  return {
    adultMale,
    adultFemale,
    childrenMale,
    childrenFemale,
    youthMale,
    youthFemale,
    adults: adultMale + adultFemale,
    children: childrenMale + childrenFemale,
    youth: youthMale + youthFemale,
    visitorsMale,
    visitorsFemale,
    visitorsTotal,
    visitorClergyMale,
    visitorClergyFemale,
    visitorClergyTotal,
    attendanceMale,
    attendanceFemale,
    attendanceTotal,
    visitorMale,
    visitorFemale,
    visitorTotal,
    male: attendanceMale + visitorMale,
    female: attendanceFemale + visitorFemale,
    total: attendanceTotal + visitorTotal,
  };
};

const hasPositiveValues = (values: number[]) => values.some((value) => value > 0);

const ChartCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <div className="rounded-xl border bg-white p-4">
    <h3 className="font-semibold text-primary">{title}</h3>
    {subtitle ? <p className="mt-1 text-xs text-gray-600">{subtitle}</p> : null}
    {children}
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center text-sm text-gray-500">
    {label}
  </div>
);

const InsightListCard = ({
  title,
  subtitle,
  items,
  emptyMessage = "No data in the selected range.",
}: {
  title: string;
  subtitle?: string;
  items: RankedInsight[];
  emptyMessage?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <div className="mt-4 space-y-3">
      {items.length ? (
        items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {item.label}
              </p>
              {item.hint ? (
                <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold text-primary">
              {item.value}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      )}
    </div>
  </ChartCard>
);

export const AttendanceAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );
  const [eventFilter, setEventFilter] = useState("all");

  const {
    data: attendanceResponse,
    loading: attendanceLoading,
    error: attendanceError,
  } = useFetch(api.fetch.fetchChurchAttendance);
  const {
    data: eventsResponse,
    loading: eventsLoading,
    error: eventsError,
  } = useFetch(api.fetch.fetchEvents, { take: 5000 });
  const {
    data: visitorsResponse,
    loading: visitorsLoading,
    error: visitorsError,
  } = useFetch(api.fetch.fetchAllVisitors, { limit: 5000 });
  const {
    data: biometricResponse,
    loading: biometricLoading,
    error: biometricError,
  } = useFetch(api.fetch.fetchBiometricAttendance);

  const records = useMemo(
    () => extractArrayData<AttendanceRecord>(attendanceResponse?.data),
    [attendanceResponse]
  );

  const events = useMemo(() => {
    return extractArrayData<EventResponseType>(eventsResponse?.data).map(
      (event) => {
        const eventId = toText(event.id);
        const eventName = fallbackEventName(event.id, event.name);

        return {
          eventKey: buildEventKey(event.id, event.name, event.id),
          eventId,
          eventName,
          eventType: toText(event.event_type) || "Unknown",
          startDate: toText(event.start_date),
          startTime: toText(event.start_time),
          registrations: Number(
            event.registration_count ?? event.event_registers?.length ?? 0
          ),
          capacity: Number(event.registration_capacity ?? 0),
          requiresRegistration: Boolean(event.requires_registration),
        } satisfies NormalizedEvent;
      }
    );
  }, [eventsResponse]);

  const visitors = useMemo(() => {
    return extractArrayData<VisitorType>(visitorsResponse?.data).map((visitor) => {
      const eventId = toText(visitor.eventId);
      const eventName = fallbackEventName(visitor.eventId, visitor.eventName);

      return {
        eventKey: buildEventKey(visitor.eventId, visitor.eventName, visitor.id),
        eventId,
        eventName,
        visitDate: toText(visitor.visitDate),
        visitCount: Number(visitor.visitCount ?? 0),
        howHeard: toText(visitor.howHeard) || "Unknown",
        gender: toText(visitor.gender).toUpperCase(),
        isClergy: Boolean(visitor.isClergy),
      } satisfies NormalizedVisitor;
    });
  }, [visitorsResponse]);

  const biometricRecords = useMemo(() => {
    const source = biometricResponse?.data;
    const records = Array.isArray(source?.records)
      ? (source.records as BiometricEventAttendanceRecord[])
      : [];

    return records.map((record) => {
      const eventId = toText(record.event_id);
      const eventName = fallbackEventName(record.event_id, record.event_name);

      return {
        eventKey: buildEventKey(record.event_id, record.event_name, record.user_id),
        eventId,
        eventName,
        attendanceDate: toText(record.attendance_date),
        firstPunchAt: toText(record.first_punch_at),
        punchCount: Number(record.punch_count ?? 0),
        attendanceRecorded: Boolean(record.attendance_recorded),
      } satisfies NormalizedBiometric;
    });
  }, [biometricResponse]);

  const attendanceRecords = useMemo(() => {
    return records.map((record) => {
      const eventId = readText(record, "eventId", "event_id");
      const eventName = fallbackEventName(
        eventId,
        readText(record, "event_name", "eventName")
      );

      return {
        eventKey: buildEventKey(eventId, eventName, readText(record, "id", "date")),
        eventId,
        eventName,
        date: readText(record, "date"),
        totals: getTotals(record),
      } satisfies NormalizedAttendanceRecord;
    });
  }, [records]);

  const eventOptions = useMemo(() => {
    const optionMap = new Map<
      string,
      { value: string; label: string; sortDate: string; sortName: string }
    >();

    const register = (
      eventKey: string,
      eventName: string,
      date?: string,
      eventId?: string
    ) => {
      if (!eventKey) return;

      const labelBase = fallbackEventName(eventId, eventName);
      const label = date
        ? `${labelBase} - ${formatDateLabel(date)}`
        : labelBase;

      const existing = optionMap.get(eventKey);
      if (!existing) {
        optionMap.set(eventKey, {
          value: eventKey,
          label,
          sortDate: date || "",
          sortName: labelBase.toLowerCase(),
        });
        return;
      }

      if (!existing.sortDate && date) {
        existing.sortDate = date;
        existing.label = label;
      }
    };

    events.forEach((event) =>
      register(event.eventKey, event.eventName, event.startDate, event.eventId)
    );
    attendanceRecords.forEach((record) =>
      register(record.eventKey, record.eventName, record.date, record.eventId)
    );
    visitors.forEach((visitor) =>
      register(visitor.eventKey, visitor.eventName, visitor.visitDate, visitor.eventId)
    );
    biometricRecords.forEach((record) =>
      register(record.eventKey, record.eventName, record.attendanceDate, record.eventId)
    );

    return Array.from(optionMap.values()).sort(
      (a, b) => b.sortDate.localeCompare(a.sortDate) || a.sortName.localeCompare(b.sortName)
    );
  }, [attendanceRecords, biometricRecords, events, visitors]);

  const cumulativeFrom = useMemo(
    () =>
      getEarliestIsoDate([
        ...attendanceRecords.map((record) => record.date),
        ...events.map((event) => event.startDate),
        ...visitors.map((visitor) => visitor.visitDate),
        ...biometricRecords.map((record) => record.attendanceDate),
      ]),
    [attendanceRecords, biometricRecords, events, visitors]
  );

  const effectiveDateRange = useMemo(
    () => resolveFiltersDateRange(filters, cumulativeFrom),
    [cumulativeFrom, filters]
  );

  const completedRangeEnd = useMemo(() => {
    const rangeEnd = DateTime.fromISO(effectiveDateRange.to).endOf("day");
    const today = DateTime.now().endOf("day");

    if (!rangeEnd.isValid) return today;
    return rangeEnd < today ? rangeEnd : today;
  }, [effectiveDateRange.to]);

  const filteredAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      if (!isWithinRange(record.date, effectiveDateRange)) return false;
      if (eventFilter !== "all" && record.eventKey !== eventFilter) return false;
      return true;
    });
  }, [attendanceRecords, effectiveDateRange, eventFilter]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!isWithinRange(event.startDate, effectiveDateRange)) return false;
      if (eventFilter !== "all" && event.eventKey !== eventFilter) return false;
      return true;
    });
  }, [effectiveDateRange, eventFilter, events]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      if (!isWithinRange(visitor.visitDate, effectiveDateRange)) return false;
      if (eventFilter !== "all" && visitor.eventKey !== eventFilter) return false;
      return true;
    });
  }, [effectiveDateRange, eventFilter, visitors]);

  const filteredBiometricRecords = useMemo(() => {
    return biometricRecords.filter((record) => {
      if (!isWithinRange(record.attendanceDate, effectiveDateRange)) return false;
      if (eventFilter !== "all" && record.eventKey !== eventFilter) return false;
      return true;
    });
  }, [biometricRecords, effectiveDateRange, eventFilter]);

  const eventsByKey = useMemo(() => {
    return new Map(filteredEvents.map((event) => [event.eventKey, event]));
  }, [filteredEvents]);

  const eventSummaries = useMemo(() => {
    const summaryMap = new Map<string, EventSummary>();

    const ensureSummary = (
      eventKey: string,
      fallback: Partial<NormalizedEvent> & {
        eventId?: string;
        eventName?: string;
        startDate?: string;
        startTime?: string;
      }
    ) => {
      if (!eventKey) return null;

      const eventMeta = eventsByKey.get(eventKey);
      const existing = summaryMap.get(eventKey);

      if (existing) {
        if (!existing.eventId) existing.eventId = fallback.eventId || eventMeta?.eventId || "";
        if (!existing.eventName)
          existing.eventName = fallback.eventName || eventMeta?.eventName || "Unknown Event";
        if (!existing.eventType)
          existing.eventType = eventMeta?.eventType || fallback.eventType || "Unknown";
        if (!existing.date)
          existing.date = fallback.startDate || eventMeta?.startDate || "";
        if (!existing.startTime)
          existing.startTime = fallback.startTime || eventMeta?.startTime || "";
        if (!existing.registrations) {
          existing.registrations = Number(
            eventMeta?.registrations ?? fallback.registrations ?? 0
          );
        }
        if (!existing.capacity) {
          existing.capacity = Number(eventMeta?.capacity ?? fallback.capacity ?? 0);
        }
        if (!existing.requiresRegistration) {
          existing.requiresRegistration = Boolean(
            eventMeta?.requiresRegistration ?? fallback.requiresRegistration
          );
        }

        return existing;
      }

      const summary = createEventSummary({
        eventKey,
        eventId: fallback.eventId || eventMeta?.eventId || "",
        eventName:
          fallback.eventName || eventMeta?.eventName || fallbackEventName("", ""),
        eventType: eventMeta?.eventType || fallback.eventType || "Unknown",
        date: fallback.startDate || eventMeta?.startDate || "",
        startTime: fallback.startTime || eventMeta?.startTime || "",
        registrations: Number(eventMeta?.registrations ?? fallback.registrations ?? 0),
        capacity: Number(eventMeta?.capacity ?? fallback.capacity ?? 0),
        requiresRegistration: Boolean(
          eventMeta?.requiresRegistration ?? fallback.requiresRegistration
        ),
      });

      summaryMap.set(eventKey, summary);
      return summary;
    };

    filteredEvents.forEach((event) => {
      ensureSummary(event.eventKey, event);
    });

    filteredAttendanceRecords.forEach((record) => {
      const summary = ensureSummary(record.eventKey, {
        eventId: record.eventId,
        eventName: record.eventName,
        startDate: record.date,
      });

      if (!summary) return;

      summary.memberAttendance += record.totals.attendanceTotal;
      summary.visitors += record.totals.visitorsTotal;
      summary.visitorClergy += record.totals.visitorClergyTotal;
      summary.totalAttendance += record.totals.total;
      summary.male += record.totals.male;
      summary.female += record.totals.female;
      summary.attendanceSummaries += 1;
      if (!summary.date) summary.date = record.date;
    });

    filteredVisitors.forEach((visitor) => {
      const summary = ensureSummary(visitor.eventKey, {
        eventId: visitor.eventId,
        eventName: visitor.eventName,
        startDate: visitor.visitDate,
      });

      if (!summary) return;

      summary.visitorRecords += 1;
      if (visitor.visitCount > 1) {
        summary.repeatVisitors += 1;
      } else {
        summary.firstTimeVisitors += 1;
      }
      if (!visitor.gender) {
        summary.visitorsMissingGender += 1;
      }
      summary.sourceCounts[visitor.howHeard] =
        (summary.sourceCounts[visitor.howHeard] ?? 0) + 1;
      if (!summary.date) summary.date = visitor.visitDate;
    });

    filteredBiometricRecords.forEach((record) => {
      const summary = ensureSummary(record.eventKey, {
        eventId: record.eventId,
        eventName: record.eventName,
        startDate: record.attendanceDate,
      });

      if (!summary) return;

      summary.biometricMembers += 1;
      summary.biometricPunches += record.punchCount;
      if (record.attendanceRecorded) {
        summary.biometricRecorded += 1;
      } else {
        summary.biometricUnrecorded += 1;
      }

      const punctualityBucket = classifyPunctuality(
        record.firstPunchAt,
        summary.date || record.attendanceDate,
        summary.startTime
      );
      summary.punctuality[punctualityBucket] += 1;
      if (!summary.date) summary.date = record.attendanceDate;
    });

    return Array.from(summaryMap.values()).sort(
      (a, b) => b.date.localeCompare(a.date) || a.eventName.localeCompare(b.eventName)
    );
  }, [
    eventsByKey,
    filteredAttendanceRecords,
    filteredBiometricRecords,
    filteredEvents,
    filteredVisitors,
  ]);

  const eventSummaryByKey = useMemo(() => {
    return new Map(eventSummaries.map((summary) => [summary.eventKey, summary]));
  }, [eventSummaries]);

  const completedEvents = useMemo(() => {
    return filteredEvents.filter((event) => {
      const date = DateTime.fromISO(event.startDate);
      return date.isValid && date.endOf("day") <= completedRangeEnd;
    });
  }, [completedRangeEnd, filteredEvents]);

  const completedEventSummaries = useMemo(() => {
    return eventSummaries.filter((summary) => {
      const date = DateTime.fromISO(summary.date);
      if (!date.isValid) return summary.attendanceSummaries > 0;
      return date.endOf("day") <= completedRangeEnd;
    });
  }, [completedRangeEnd, eventSummaries]);

  const recordedEventSummaries = useMemo(
    () => completedEventSummaries.filter((summary) => summary.totalAttendance > 0),
    [completedEventSummaries]
  );

  const attendanceTrend = useMemo(
    () =>
      buildSeries(
        filteredAttendanceRecords,
        (record) => record.date,
        (record) => record.totals.total,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredAttendanceRecords, filters.groupBy]
  );

  const visitorsTrend = useMemo(
    () =>
      buildSeries(
        filteredAttendanceRecords,
        (record) => record.date,
        (record) => record.totals.visitorsTotal,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredAttendanceRecords, filters.groupBy]
  );

  const visitorClergyTrend = useMemo(
    () =>
      buildSeries(
        filteredAttendanceRecords,
        (record) => record.date,
        (record) => record.totals.visitorClergyTotal,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredAttendanceRecords, filters.groupBy]
  );

  const demographicMix = useMemo(() => {
    return filteredAttendanceRecords.reduce(
      (acc, record) => {
        acc.adults += record.totals.adults;
        acc.children += record.totals.children;
        acc.youth += record.totals.youth;
        acc.members += record.totals.attendanceTotal;
        acc.visitors += record.totals.visitorsTotal;
        acc.visitorClergy += record.totals.visitorClergyTotal;
        acc.male += record.totals.male;
        acc.female += record.totals.female;
        acc.total += record.totals.total;
        return acc;
      },
      {
        adults: 0,
        children: 0,
        youth: 0,
        members: 0,
        visitors: 0,
        visitorClergy: 0,
        male: 0,
        female: 0,
        total: 0,
      }
    );
  }, [filteredAttendanceRecords]);

  const avgAttendancePerEvent = useMemo(() => {
    const denominator = recordedEventSummaries.length || 1;
    return recordedEventSummaries.length
      ? demographicMix.total / denominator
      : 0;
  }, [demographicMix.total, recordedEventSummaries.length]);

  const recordedCompletedEventCount = useMemo(() => {
    let count = 0;

    completedEvents.forEach((event) => {
      const summary = eventSummaryByKey.get(event.eventKey);
      if (summary?.attendanceSummaries) count += 1;
    });

    return count;
  }, [completedEvents, eventSummaryByKey]);

  const attendanceCaptureRate = useMemo(
    () =>
      completedEvents.length
        ? toPercent(recordedCompletedEventCount, completedEvents.length)
        : 0,
    [completedEvents.length, recordedCompletedEventCount]
  );

  const visitorShare = useMemo(
    () =>
      demographicMix.total
        ? toPercent(
            demographicMix.visitors + demographicMix.visitorClergy,
            demographicMix.total
          )
        : 0,
    [demographicMix.total, demographicMix.visitorClergy, demographicMix.visitors]
  );

  const registeredCompletedSummaries = useMemo(
    () =>
      completedEventSummaries.filter(
        (summary) => summary.requiresRegistration || summary.registrations > 0
      ),
    [completedEventSummaries]
  );

  const registrationTotals = useMemo(() => {
    return registeredCompletedSummaries.reduce(
      (acc, summary) => {
        acc.registrations += summary.registrations;
        acc.attendance += summary.totalAttendance;
        return acc;
      },
      {
        registrations: 0,
        attendance: 0,
      }
    );
  }, [registeredCompletedSummaries]);

  const registrationAttendanceRate = useMemo(
    () =>
      registrationTotals.registrations
        ? toPercent(registrationTotals.attendance, registrationTotals.registrations)
        : 0,
    [registrationTotals.attendance, registrationTotals.registrations]
  );

  const statItems = useMemo(
    () => [
      {
        label: "Attendance Total",
        value: numberFormatter.format(demographicMix.total),
        hint: `${numberFormatter.format(recordedEventSummaries.length)} recorded events`,
      },
      {
        label: "Average per Event",
        value: numberFormatter.format(Number(avgAttendancePerEvent.toFixed(0))),
        hint: "Uses recorded events in the selected range",
      },
      {
        label: "Visitor Share",
        value: formatPercentValue(visitorShare),
        hint: `${numberFormatter.format(
          demographicMix.visitors + demographicMix.visitorClergy
        )} visitors and visitor clergy`,
      },
      {
        label: "Attendance Capture Rate",
        value: formatPercentValue(attendanceCaptureRate),
        hint: `${numberFormatter.format(recordedCompletedEventCount)}/${numberFormatter.format(
          completedEvents.length
        )} completed events recorded`,
      },
    ],
    [
      attendanceCaptureRate,
      avgAttendancePerEvent,
      completedEvents.length,
      demographicMix.total,
      demographicMix.visitorClergy,
      demographicMix.visitors,
      recordedCompletedEventCount,
      recordedEventSummaries.length,
      visitorShare,
    ]
  );

  const leaderboardItems = useMemo(() => {
    return recordedEventSummaries
      .slice()
      .sort((a, b) => b.totalAttendance - a.totalAttendance)
      .slice(0, 8);
  }, [recordedEventSummaries]);

  const visitorEventLeaders = useMemo<RankedInsight[]>(() => {
    return recordedEventSummaries
      .slice()
      .sort((a, b) => b.visitors - a.visitors)
      .filter((summary) => summary.visitors > 0)
      .slice(0, 5)
      .map((summary) => ({
        label: summary.eventName,
        value: numberFormatter.format(summary.visitors),
        hint: summary.date ? formatDateLabel(summary.date) : "Visitor turnout",
      }));
  }, [recordedEventSummaries]);

  const visitorClergyLeaders = useMemo<RankedInsight[]>(() => {
    return recordedEventSummaries
      .slice()
      .sort((a, b) => b.visitorClergy - a.visitorClergy)
      .filter((summary) => summary.visitorClergy > 0)
      .slice(0, 5)
      .map((summary) => ({
        label: summary.eventName,
        value: numberFormatter.format(summary.visitorClergy),
        hint: summary.date ? formatDateLabel(summary.date) : "Visitor clergy turnout",
      }));
  }, [recordedEventSummaries]);

  const eventTypePerformance = useMemo(() => {
    const map = new Map<
      string,
      { events: number; totalAttendance: number; visitors: number }
    >();

    recordedEventSummaries.forEach((summary) => {
      const eventType = summary.eventType || "Unknown";
      const current = map.get(eventType) ?? {
        events: 0,
        totalAttendance: 0,
        visitors: 0,
      };

      current.events += 1;
      current.totalAttendance += summary.totalAttendance;
      current.visitors += summary.visitors + summary.visitorClergy;
      map.set(eventType, current);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        events: value.events,
        avgAttendance: value.events ? value.totalAttendance / value.events : 0,
        avgVisitors: value.events ? value.visitors / value.events : 0,
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance);
  }, [recordedEventSummaries]);

  const dayPerformance = useMemo(() => {
    const map = new Map<string, { events: number; totalAttendance: number }>();

    DAY_ORDER.forEach((day) => {
      map.set(day, { events: 0, totalAttendance: 0 });
    });

    recordedEventSummaries.forEach((summary) => {
      const date = DateTime.fromISO(summary.date);
      if (!date.isValid) return;

      const day = date.toFormat("ccc");
      const current = map.get(day) ?? { events: 0, totalAttendance: 0 };
      current.events += 1;
      current.totalAttendance += summary.totalAttendance;
      map.set(day, current);
    });

    return DAY_ORDER.map((day) => {
      const current = map.get(day) ?? { events: 0, totalAttendance: 0 };
      return {
        label: day,
        avgAttendance: current.events
          ? current.totalAttendance / current.events
          : 0,
        events: current.events,
      };
    });
  }, [recordedEventSummaries]);

  const timeSlotPerformance = useMemo(() => {
    const map = new Map<string, { events: number; totalAttendance: number }>();

    TIME_SLOT_ORDER.forEach((slot) => {
      map.set(slot, { events: 0, totalAttendance: 0 });
    });

    recordedEventSummaries.forEach((summary) => {
      const slot = getTimeSlot(summary.startTime);
      const current = map.get(slot) ?? { events: 0, totalAttendance: 0 };
      current.events += 1;
      current.totalAttendance += summary.totalAttendance;
      map.set(slot, current);
    });

    return TIME_SLOT_ORDER.map((slot) => {
      const current = map.get(slot) ?? { events: 0, totalAttendance: 0 };
      return {
        label: slot,
        avgAttendance: current.events
          ? current.totalAttendance / current.events
          : 0,
        events: current.events,
      };
    }).filter((item) => item.events > 0);
  }, [recordedEventSummaries]);

  const registrationComparison = useMemo(() => {
    return registeredCompletedSummaries
      .slice()
      .sort((a, b) => b.registrations - a.registrations || b.totalAttendance - a.totalAttendance)
      .slice(0, 8);
  }, [registeredCompletedSummaries]);

  const registrationGapItems = useMemo<RankedInsight[]>(() => {
    return registeredCompletedSummaries
      .slice()
      .map((summary) => ({
        summary,
        gap: summary.totalAttendance - summary.registrations,
      }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
      .slice(0, 5)
      .map(({ summary, gap }) => ({
        label: summary.eventName,
        value: `${numberFormatter.format(summary.totalAttendance)} / ${numberFormatter.format(
          summary.registrations
        )}`,
        hint: `${gap >= 0 ? "+" : ""}${numberFormatter.format(
          gap
        )} attendance vs registrations`,
      }));
  }, [registeredCompletedSummaries]);

  const capacityComparison = useMemo(() => {
    return completedEventSummaries
      .filter((summary) => summary.capacity > 0)
      .slice()
      .sort(
        (a, b) =>
          toPercent(b.totalAttendance, b.capacity) -
            toPercent(a.totalAttendance, a.capacity) || b.capacity - a.capacity
      )
      .slice(0, 8);
  }, [completedEventSummaries]);

  const capacityAlertItems = useMemo<RankedInsight[]>(() => {
    return completedEventSummaries
      .filter((summary) => summary.capacity > 0)
      .slice()
      .sort(
        (a, b) =>
          toPercent(b.totalAttendance, b.capacity) -
          toPercent(a.totalAttendance, a.capacity)
      )
      .slice(0, 5)
      .map((summary) => ({
        label: summary.eventName,
        value: formatPercentValue(
          toPercent(summary.totalAttendance, summary.capacity)
        ),
        hint: `${numberFormatter.format(summary.totalAttendance)} attendance vs ${numberFormatter.format(
          summary.capacity
        )} capacity`,
      }));
  }, [completedEventSummaries]);

  const firstTimeVisitorsCount = useMemo(
    () =>
      filteredVisitors.filter((visitor) => visitor.visitCount <= 1).length,
    [filteredVisitors]
  );

  const repeatVisitorsCount = useMemo(
    () => filteredVisitors.filter((visitor) => visitor.visitCount > 1).length,
    [filteredVisitors]
  );

  const firstTimeEventLeaders = useMemo<RankedInsight[]>(() => {
    return completedEventSummaries
      .slice()
      .sort((a, b) => b.firstTimeVisitors - a.firstTimeVisitors)
      .filter((summary) => summary.firstTimeVisitors > 0)
      .slice(0, 5)
      .map((summary) => ({
        label: summary.eventName,
        value: numberFormatter.format(summary.firstTimeVisitors),
        hint: `${numberFormatter.format(summary.repeatVisitors)} repeat visitors`,
      }));
  }, [completedEventSummaries]);

  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredVisitors.forEach((visitor) => {
      map.set(visitor.howHeard, (map.get(visitor.howHeard) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredVisitors]);

  const punctualityMix = useMemo(() => {
    return completedEventSummaries.reduce(
      (acc, summary) => {
        acc.early += summary.punctuality.early;
        acc.onTime += summary.punctuality.onTime;
        acc.late += summary.punctuality.late;
        acc.unclassified += summary.punctuality.unclassified;
        return acc;
      },
      {
        early: 0,
        onTime: 0,
        late: 0,
        unclassified: 0,
      }
    );
  }, [completedEventSummaries]);

  const biometricSummaryItems = useMemo<RankedInsight[]>(() => {
    const biometricTotals = completedEventSummaries.reduce(
      (acc, summary) => {
        acc.members += summary.biometricMembers;
        acc.punches += summary.biometricPunches;
        acc.recorded += summary.biometricRecorded;
        acc.unrecorded += summary.biometricUnrecorded;
        return acc;
      },
      {
        members: 0,
        punches: 0,
        recorded: 0,
        unrecorded: 0,
      }
    );

    const avgPunchesPerAttendee = biometricTotals.members
      ? biometricTotals.punches / biometricTotals.members
      : 0;

    return [
      {
        label: "Biometric attendees",
        value: numberFormatter.format(biometricTotals.members),
        hint: `${numberFormatter.format(biometricTotals.punches)} punch records`,
      },
      {
        label: "Attendance-linked biometric records",
        value: numberFormatter.format(biometricTotals.recorded),
        hint: `${numberFormatter.format(biometricTotals.unrecorded)} not yet linked`,
      },
      {
        label: "Avg punches per attendee",
        value: avgPunchesPerAttendee.toFixed(1),
        hint: "Based on biometric punch totals",
      },
    ];
  }, [completedEventSummaries]);

  const averageRecordedAttendance = useMemo(() => {
    return recordedEventSummaries.length
      ? recordedEventSummaries.reduce(
          (total, summary) => total + summary.totalAttendance,
          0
        ) / recordedEventSummaries.length
      : 0;
  }, [recordedEventSummaries]);

  const missingAttendanceSummariesCount = useMemo(() => {
    return completedEvents.filter((event) => {
      const summary = eventSummaryByKey.get(event.eventKey);
      return !summary || summary.attendanceSummaries === 0;
    }).length;
  }, [completedEvents, eventSummaryByKey]);

  const registrationWithoutSummaryCount = useMemo(() => {
    return completedEvents.filter((event) => {
      const summary = eventSummaryByKey.get(event.eventKey);
      return event.registrations > 0 && (!summary || summary.attendanceSummaries === 0);
    }).length;
  }, [completedEvents, eventSummaryByKey]);

  const biometricWithoutSummaryCount = useMemo(() => {
    return completedEventSummaries.filter(
      (summary) =>
        summary.biometricMembers > 0 && summary.attendanceSummaries === 0
    ).length;
  }, [completedEventSummaries]);

  const visitorWithoutSummaryCount = useMemo(() => {
    return completedEventSummaries.filter(
      (summary) => summary.visitorRecords > 0 && summary.attendanceSummaries === 0
    ).length;
  }, [completedEventSummaries]);

  const visitorMissingGenderCount = useMemo(
    () => filteredVisitors.filter((visitor) => !visitor.gender).length,
    [filteredVisitors]
  );

  const unnamedAttendanceCount = useMemo(
    () =>
      filteredAttendanceRecords.filter(
        (record) => !record.eventName || record.eventName === "Unknown Event"
      ).length,
    [filteredAttendanceRecords]
  );

  const outlierEventCount = useMemo(() => {
    if (recordedEventSummaries.length < 3 || !averageRecordedAttendance) return 0;

    return recordedEventSummaries.filter((summary) => {
      return (
        summary.totalAttendance >= averageRecordedAttendance * 1.75 ||
        summary.totalAttendance <= averageRecordedAttendance * 0.4
      );
    }).length;
  }, [averageRecordedAttendance, recordedEventSummaries]);

  const dataQualityItems = useMemo<RankedInsight[]>(
    () => [
      {
        label: "Completed events without attendance summary",
        value: numberFormatter.format(missingAttendanceSummariesCount),
        hint: "Only counts events that should already have attendance recorded",
      },
      {
        label: "Registered events without attendance summary",
        value: numberFormatter.format(registrationWithoutSummaryCount),
        hint: "Registrations exist, but no church attendance summary was found",
      },
      {
        label: "Biometric activity without attendance summary",
        value: numberFormatter.format(biometricWithoutSummaryCount),
        hint: "Biometric punches exist, but no attendance summary was found",
      },
      {
        label: "Visitor records without attendance summary",
        value: numberFormatter.format(visitorWithoutSummaryCount),
        hint: "Visitor-side event data exists, but the attendance summary is missing",
      },
      {
        label: "Visitors missing gender",
        value: numberFormatter.format(visitorMissingGenderCount),
        hint: "These records cannot contribute to accurate male/female visitor splits",
      },
      {
        label: "Attendance rows missing event name",
        value: numberFormatter.format(unnamedAttendanceCount),
        hint: "Should remain near zero after the event-name fallback fix",
      },
      {
        label: "Potential turnout outliers",
        value: numberFormatter.format(outlierEventCount),
        hint: "Recorded events far above or below the typical attendance level",
      },
    ],
    [
      biometricWithoutSummaryCount,
      missingAttendanceSummariesCount,
      outlierEventCount,
      registrationWithoutSummaryCount,
      unnamedAttendanceCount,
      visitorMissingGenderCount,
      visitorWithoutSummaryCount,
    ]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setEventFilter("all");
  };

  const isLoading =
    attendanceLoading || eventsLoading || visitorsLoading || biometricLoading;
  const error =
    attendanceError || eventsError || visitorsError || biometricError;

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Attendance Analytics"
          subtitle="Attendance, visitors, registration, event performance, biometric, and data quality insights"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          cumulativeFrom={cumulativeFrom}
          extra={
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Event</label>
              <select
                className="h-10 w-full rounded border px-3"
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
              >
                <option value="all">All events</option>
                {eventOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Total Attendance Trend"
            subtitle="Overall attendance across members, visitors, and visitor clergy."
          >
            <div className="mt-3 h-72">
              {hasPositiveValues(attendanceTrend.values) ? (
                <Line
                  data={{
                    labels: attendanceTrend.labels,
                    datasets: [
                      {
                        label: "Attendance",
                        data: attendanceTrend.values,
                        borderColor: "#2563EB",
                        backgroundColor: "rgba(37, 99, 235, 0.2)",
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No attendance trend data for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Attendance Composition"
            subtitle="Breakdown of adult, children, and youth attendance."
          >
            <div className="mt-3 h-72">
              {demographicMix.total > 0 ? (
                <Doughnut
                  data={{
                    labels: ["Adults", "Children", "Youth"],
                    datasets: [
                      {
                        data: [
                          demographicMix.adults,
                          demographicMix.children,
                          demographicMix.youth,
                        ],
                        backgroundColor: ["#2563EB", "#16A34A", "#F97316"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No attendance composition data for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Members vs Visitors"
            subtitle="How much turnout came from members, visitors, and visitor clergy."
          >
            <div className="mt-3 h-72">
              {demographicMix.total > 0 ? (
                <Doughnut
                  data={{
                    labels: ["Members", "Visitors", "Visitor Clergy"],
                    datasets: [
                      {
                        data: [
                          demographicMix.members,
                          demographicMix.visitors,
                          demographicMix.visitorClergy,
                        ],
                        backgroundColor: ["#1D4ED8", "#0EA5E9", "#F97316"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No member and visitor mix data for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Male vs Female"
            subtitle="Gender split across member attendance and visitor-derived totals."
          >
            <div className="mt-3 h-72">
              {demographicMix.total > 0 ? (
                <Bar
                  data={{
                    labels: ["Male", "Female"],
                    datasets: [
                      {
                        label: "Attendance",
                        data: [demographicMix.male, demographicMix.female],
                        backgroundColor: ["#2563EB", "#EC4899"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No gender split data for the selected range." />
              )}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Visitors vs Visitor Clergy Trend"
            subtitle="Visitor-side attendance contribution over time."
          >
            <div className="mt-3 h-72">
              {hasPositiveValues([
                ...visitorsTrend.values,
                ...visitorClergyTrend.values,
              ]) ? (
                <Line
                  data={{
                    labels: visitorsTrend.labels,
                    datasets: [
                      {
                        label: "Visitors",
                        data: visitorsTrend.values,
                        borderColor: "#0EA5E9",
                        backgroundColor: "rgba(14, 165, 233, 0.2)",
                        tension: 0.3,
                      },
                      {
                        label: "Visitor clergy",
                        data: visitorClergyTrend.values,
                        borderColor: "#F97316",
                        backgroundColor: "rgba(249, 115, 22, 0.2)",
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No visitor trend data for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Event Attendance Leaderboard"
            subtitle="Top recorded events by total attendance."
          >
            <div className="mt-3 h-72">
              {leaderboardItems.length ? (
                <Bar
                  data={{
                    labels: leaderboardItems.map((summary) =>
                      truncateLabel(summary.eventName)
                    ),
                    datasets: [
                      {
                        label: "Attendance",
                        data: leaderboardItems.map(
                          (summary) => summary.totalAttendance
                        ),
                        backgroundColor: "#2563EB",
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y" as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No recorded events to rank in the selected range." />
              )}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <InsightListCard
            title="Top Visitor Events"
            subtitle="Events bringing in the highest number of visitors."
            items={visitorEventLeaders}
          />

          <InsightListCard
            title="Top Visitor Clergy Events"
            subtitle="Events attracting the most visitor clergy."
            items={visitorClergyLeaders}
          />

          <ChartCard
            title="Event Type Performance"
            subtitle="Average attendance per recorded event type."
          >
            <div className="mt-3 h-80">
              {eventTypePerformance.length ? (
                <Bar
                  data={{
                    labels: eventTypePerformance.map((item) => item.label),
                    datasets: [
                      {
                        label: "Average attendance",
                        data: eventTypePerformance.map(
                          (item) => Number(item.avgAttendance.toFixed(1))
                        ),
                        backgroundColor: "#16A34A",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No recorded event type data for the selected range." />
              )}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Day-of-Week Performance"
            subtitle="Average turnout by day for recorded events."
          >
            <div className="mt-3 h-72">
              {hasPositiveValues(dayPerformance.map((item) => item.avgAttendance)) ? (
                <Bar
                  data={{
                    labels: dayPerformance.map((item) => item.label),
                    datasets: [
                      {
                        label: "Average attendance",
                        data: dayPerformance.map((item) =>
                          Number(item.avgAttendance.toFixed(1))
                        ),
                        backgroundColor: "#7C3AED",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No day-of-week insights for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Time-of-Day Performance"
            subtitle="Average turnout by scheduled event start time."
          >
            <div className="mt-3 h-72">
              {hasPositiveValues(
                timeSlotPerformance.map((item) => item.avgAttendance)
              ) ? (
                <Bar
                  data={{
                    labels: timeSlotPerformance.map((item) => item.label),
                    datasets: [
                      {
                        label: "Average attendance",
                        data: timeSlotPerformance.map((item) =>
                          Number(item.avgAttendance.toFixed(1))
                        ),
                        backgroundColor: "#F59E0B",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No start-time insights for the selected range." />
              )}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Registration vs Actual Attendance"
            subtitle={`Registered events attendance rate: ${formatPercentValue(
              registrationAttendanceRate
            )}`}
          >
            <div className="mt-3 h-80">
              {registrationComparison.length ? (
                <Bar
                  data={{
                    labels: registrationComparison.map((summary) =>
                      truncateLabel(summary.eventName)
                    ),
                    datasets: [
                      {
                        label: "Registrations",
                        data: registrationComparison.map(
                          (summary) => summary.registrations
                        ),
                        backgroundColor: "#94A3B8",
                      },
                      {
                        label: "Actual attendance",
                        data: registrationComparison.map(
                          (summary) => summary.totalAttendance
                        ),
                        backgroundColor: "#2563EB",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No completed registered events in the selected range." />
              )}
            </div>
          </ChartCard>

          <InsightListCard
            title="Registration Gap Watch"
            subtitle="Where actual attendance differs most from registrations."
            items={registrationGapItems}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Capacity Utilization"
            subtitle="Attendance compared with configured registration capacity."
          >
            <div className="mt-3 h-80">
              {capacityComparison.length ? (
                <Bar
                  data={{
                    labels: capacityComparison.map((summary) =>
                      truncateLabel(summary.eventName)
                    ),
                    datasets: [
                      {
                        label: "Capacity",
                        data: capacityComparison.map((summary) => summary.capacity),
                        backgroundColor: "#CBD5E1",
                      },
                      {
                        label: "Actual attendance",
                        data: capacityComparison.map(
                          (summary) => summary.totalAttendance
                        ),
                        backgroundColor: "#16A34A",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No capacity-configured events in the selected range." />
              )}
            </div>
          </ChartCard>

          <InsightListCard
            title="Capacity Utilization Watch"
            subtitle="Highest capacity pressure in the selected range."
            items={capacityAlertItems}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="First-Time vs Repeat Visitors"
            subtitle="Visitor attendance split using visit history."
          >
            <div className="mt-3 h-72">
              {firstTimeVisitorsCount + repeatVisitorsCount > 0 ? (
                <Doughnut
                  data={{
                    labels: ["First-time", "Repeat"],
                    datasets: [
                      {
                        data: [firstTimeVisitorsCount, repeatVisitorsCount],
                        backgroundColor: ["#0EA5E9", "#2563EB"],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No visitor history data for the selected range." />
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Visitor Source Insights"
            subtitle="Top referral channels from the visitor records."
          >
            <div className="mt-3 h-72">
              {sourceBreakdown.length ? (
                <Bar
                  data={{
                    labels: sourceBreakdown.map((item) => truncateLabel(item.label)),
                    datasets: [
                      {
                        label: "Visitors",
                        data: sourceBreakdown.map((item) => item.value),
                        backgroundColor: "#8B5CF6",
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y" as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState label="No visitor source data for the selected range." />
              )}
            </div>
          </ChartCard>

          <InsightListCard
            title="Top First-Time Visitor Events"
            subtitle="Events that brought in the most first-time visitors."
            items={firstTimeEventLeaders}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Biometric Punctuality"
            subtitle="Arrival timing compared with scheduled event start time."
          >
            <div className="mt-3 h-72">
              {punctualityMix.early +
                punctualityMix.onTime +
                punctualityMix.late +
                punctualityMix.unclassified >
              0 ? (
                <Doughnut
                  data={{
                    labels: ["Early", "On time", "Late", "Unclassified"],
                    datasets: [
                      {
                        data: [
                          punctualityMix.early,
                          punctualityMix.onTime,
                          punctualityMix.late,
                          punctualityMix.unclassified,
                        ],
                        backgroundColor: [
                          "#16A34A",
                          "#2563EB",
                          "#F97316",
                          "#94A3B8",
                        ],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <EmptyState label="No biometric punctuality data for the selected range." />
              )}
            </div>
          </ChartCard>

          <InsightListCard
            title="Biometric Coverage"
            subtitle="How biometric punches map to attendance records."
            items={biometricSummaryItems}
          />

          <InsightListCard
            title="Attendance Data Quality"
            subtitle="Gaps and integrity signals for attendance reporting."
            items={dataQualityItems}
          />
        </div>

        <AnalyticsContractsPanel contract={attendanceContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load attendance analytics data.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">
            Loading attendance analytics...
          </div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default AttendanceAnalytics;
