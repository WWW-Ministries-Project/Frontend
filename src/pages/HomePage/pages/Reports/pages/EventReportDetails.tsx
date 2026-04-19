import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { ensureAnalyticsChartsRegistered } from "@/pages/HomePage/pages/Analytics/chartSetup";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { showNotification } from "@/pages/HomePage/utils";
import { api, downloadBlobFile, relativePath } from "@/utils";
import type {
  EventReportDetail,
  EventReportServiceSummaryFormat,
} from "@/utils/api/eventReports/interfaces";
import type { AttendanceTimingSettingsConfig } from "@/utils/api/settings/attendanceTimingInterfaces";
import type { ApiResponse } from "@/utils/interfaces";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useLocation, useParams } from "react-router-dom";

type UnknownRecord = Record<string, unknown>;

type TimingStatus = "EARLY" | "ON_TIME" | "LATE" | "ABSENT" | "UNCLASSIFIED";
type TimingStatusFilter = "ALL" | "EARLY" | "ON_TIME" | "LATE" | "ABSENT";
type RelativeDirectionFilter = "ALL" | "BEFORE" | "AFTER";

type DepartmentAttendee = {
  id: string;
  name: string;
  arrivalTime: string;
  arrivalAt: string;
  reportedTime: string;
  relativeToStart: string;
  attendanceStatus: TimingStatus | "";
  userId: string;
};

type DepartmentSection = {
  id: string;
  name: string;
  headName: string;
  attendees: DepartmentAttendee[];
  totalMembers: number;
  presentMembers: number;
  absentMembers: number;
  attendancePercentage: number;
};

type AttendanceTotals = {
  adultMale: number;
  adultFemale: number;
  childrenMale: number;
  childrenFemale: number;
  youthMale: number;
  youthFemale: number;
  visitors: number;
  visitingPastors: number;
  totalWithoutVisitors: number;
  totalAttendance: number;
};

type DepartmentInsightRow = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  arrivalTime: string;
  reportedAtLabel: string;
  relativeToStartLabel: string;
  minutesFromStart: number | null;
  timingStatus: TimingStatus;
  arrivalSortValue: number | null;
};

type DepartmentDataSectionView = DepartmentSection & {
  visibleAttendees: DepartmentAttendee[];
  visibleCount: number;
};

type AttendanceTimingRuleMinutes = {
  early: number;
  onTime: number;
  late: number;
};

const reportViewTabs = ["Data", "Insight"] as const;
type ReportViewTab = (typeof reportViewTabs)[number];

const reportSectionTabs = ["Department Overview", "Church Attendance"] as const;
type ReportSectionTab = (typeof reportSectionTabs)[number];

const countFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES = 15;

const DEFAULT_ATTENDANCE_TIMING_CONFIG: AttendanceTimingSettingsConfig = {
  early: {
    value: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
    unit: "MINUTES",
    minutes: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
  },
  on_time: {
    value: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
    unit: "MINUTES",
    minutes: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
  },
  late: {
    value: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
    unit: "MINUTES",
    minutes: DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES,
  },
  updated_at: null,
  updated_by: null,
};

ensureAnalyticsChartsRegistered();

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

const toNumberValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toOptionalNumberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

  const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePrefixMatch) {
    return datePrefixMatch[1];
  }

  const parsed = DateTime.fromISO(raw);
  if (parsed.isValid) {
    return parsed.toFormat("yyyy-LL-dd");
  }

  const fallback = DateTime.fromJSDate(new Date(raw));
  return fallback.isValid ? fallback.toFormat("yyyy-LL-dd") : "";
};

const formatDate = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "—";

  const parsed = DateTime.fromISO(raw);
  if (parsed.isValid) {
    return parsed.toFormat("dd LLL yyyy");
  }

  const fallback = DateTime.fromJSDate(new Date(raw));
  return fallback.isValid ? fallback.toFormat("dd LLL yyyy") : raw;
};

const formatDateTime = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "—";

  const parsed = DateTime.fromISO(raw);
  if (parsed.isValid) {
    return parsed.toFormat("dd LLL yyyy, HH:mm");
  }

  const fallback = DateTime.fromJSDate(new Date(raw));
  return fallback.isValid ? fallback.toFormat("dd LLL yyyy, HH:mm") : raw;
};

const formatArrivalTime = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "—";

  const parsed = DateTime.fromISO(raw);
  if (parsed.isValid) {
    return parsed.toFormat("HH:mm");
  }

  if (/^\d{2}:\d{2}/.test(raw)) {
    return raw.slice(0, 5);
  }

  return raw;
};

const normalizeTimeOnly = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "";

  const parsed = DateTime.fromISO(raw);
  if (parsed.isValid) {
    return parsed.toFormat("HH:mm:ss");
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return `${raw}:00`;
  }

  return "";
};

const buildEventStartDateTime = (dateValue: unknown, timeValue: unknown) => {
  const date = normalizeDateOnly(dateValue);
  const time = normalizeTimeOnly(timeValue);

  if (!date || !time) return null;

  const parsed = DateTime.fromISO(`${date}T${time}`);
  return parsed.isValid ? parsed : null;
};

const formatMinutesDistance = (minutes: number): string => {
  const absoluteMinutes = Math.abs(Math.round(minutes));
  const hours = Math.floor(absoluteMinutes / 60);
  const remainingMinutes = absoluteMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
};

const normalizeTimingRuleMinutes = (
  value: unknown,
  fallback = DEFAULT_ATTENDANCE_TIMING_RULE_MINUTES
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const getTimingStatus = (
  minutesFromStart: number | null,
  rules: AttendanceTimingRuleMinutes
): TimingStatus => {
  if (minutesFromStart === null) return "UNCLASSIFIED";
  if (minutesFromStart <= -rules.early) return "EARLY";
  if (minutesFromStart >= rules.late) return "LATE";
  if (Math.abs(minutesFromStart) <= rules.onTime) return "ON_TIME";
  return "ON_TIME";
};

const formatRelativeToStart = (minutesFromStart: number | null): string => {
  if (minutesFromStart === null) {
    return "Event start time unavailable";
  }

  if (minutesFromStart === 0) {
    return "At start time";
  }

  const direction = minutesFromStart < 0 ? "before" : "after";
  return `${formatMinutesDistance(minutesFromStart)} ${direction} start`;
};

const normalizeTimingStatusValue = (value: unknown): TimingStatus | null => {
  const status = toStringValue(value).replace(/[\s-]+/g, "_").toUpperCase();

  if (status === "EARLY") return "EARLY";
  if (status === "ON_TIME" || status === "ONTIME") return "ON_TIME";
  if (status === "LATE") return "LATE";
  if (status === "ABSENT") return "ABSENT";

  return null;
};

const timingStatusLabelMap: Record<TimingStatus, string> = {
  EARLY: "Early",
  ON_TIME: "On Time",
  LATE: "Late",
  ABSENT: "Absent",
  UNCLASSIFIED: "Unclassified",
};

const getTimingBadgeClasses = (status: TimingStatus) => {
  if (status === "EARLY") return "bg-[#DBEAFE] text-[#1D4ED8]";
  if (status === "ON_TIME") return "bg-[#D2F4EA] text-[#039855]";
  if (status === "LATE") return "bg-[#FFF0D5] text-[#B54708]";
  if (status === "ABSENT") return "bg-[#FEE4E2] text-[#B42318]";
  return "bg-[#EDEFF5] text-lighterBlack";
};

const buildDepartmentAttendeeLookupKey = (
  departmentId: string,
  attendee: Pick<DepartmentAttendee, "id" | "userId" | "name">
) => `${departmentId}::${attendee.userId || attendee.id || attendee.name}`;

const normalizeAttendeeRecord = (value: unknown): DepartmentAttendee | null => {
  const record = toRecord(value);
  const userRecord = toRecord(record.user);
  const userInfo = toRecord(userRecord.user_info);
  const nestedUser = toRecord(userInfo.user);

  const attendeeName = firstNonEmptyString(
    record.name,
    record.full_name,
    record.member_name,
    record.memberName,
    record.user_name,
    userInfo.name,
    nestedUser.name,
    userRecord.name
  );

  if (!attendeeName) {
    return null;
  }

  const arrivalRaw = firstNonEmptyString(
    record.arrival_time,
    record.arrivalTime,
    record.checked_in_at,
    record.checkedInAt,
    record.created_at,
    record.createdAt
  );

  return {
    id: firstNonEmptyString(record.id, `${attendeeName}-${arrivalRaw}`),
    name: attendeeName,
    arrivalTime: formatArrivalTime(arrivalRaw),
    arrivalAt: arrivalRaw,
    reportedTime: firstNonEmptyString(record.reported_time, record.reportedTime),
    relativeToStart: firstNonEmptyString(
      record.relative_to_start,
      record.relativeToStart
    ),
    attendanceStatus:
      normalizeTimingStatusValue(record.status ?? record.attendance_status) || "",
    userId: firstNonEmptyString(
      record.user_id,
      record.userId,
      nestedUser.id,
      userInfo.id,
      userRecord.id
    ),
  };
};

const normalizeDepartmentSection = (value: unknown): DepartmentSection | null => {
  const record = toRecord(value);
  const departmentRecord = toRecord(record.department);
  const headRecord = toRecord(
    record.head ??
      record.department_head ??
      record.departmentHead ??
      record.hod ??
      record.department_head_info
  );

  const id = firstNonEmptyString(
    record.department_id,
    record.departmentId,
    record.id,
    departmentRecord.id
  );
  const name = firstNonEmptyString(
    record.department_name,
    record.departmentName,
    record.name,
    departmentRecord.name
  );

  if (!id && !name) {
    return null;
  }

  const attendees = toArray(
    record.attendees ?? record.members ?? record.department_members
  )
    .map((attendee) => normalizeAttendeeRecord(attendee))
    .filter((attendee): attendee is DepartmentAttendee => Boolean(attendee));

  const totalMembers =
    toOptionalNumberValue(
      record.total_members ??
        record.totalMembers ??
        record.member_count ??
        record.memberCount
    ) ?? attendees.length;
  const derivedPresentMembers = attendees.filter(
    (attendee) => attendee.attendanceStatus !== "ABSENT"
  ).length;
  const presentMembers =
    toOptionalNumberValue(record.present_members ?? record.presentMembers) ??
    derivedPresentMembers;
  const absentMembers =
    toOptionalNumberValue(record.absent_members ?? record.absentMembers) ??
    Math.max(totalMembers - presentMembers, 0);
  const attendancePercentage =
    toOptionalNumberValue(
      record.attendance_percentage ?? record.attendancePercentage
    ) ?? (totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0);

  return {
    id: id || name,
    name: name || "Unknown Department",
    headName: firstNonEmptyString(
      record.head_name,
      record.headName,
      record.hod_name,
      record.hodName,
      headRecord.name,
      "No head assigned"
    ),
    attendees,
    totalMembers,
    presentMembers,
    absentMembers,
    attendancePercentage,
  };
};

const normalizeAttendanceTotals = (value: unknown): AttendanceTotals => {
  const record = toRecord(value);
  const visitors = toNumberValue(
    record.visitors ??
      record.visitors_total ??
      record.visitorsTotal ??
      record.visitor_total ??
      record.visitorTotal
  );
  const visitingPastors = toNumberValue(
    record.visiting_pastors ??
      record.visitingPastors ??
      record.visitor_clergy_total ??
      record.visitorClergyTotal
  );
  const totalWithoutVisitors =
    toNumberValue(record.adult_male ?? record.adultMale) +
    toNumberValue(record.adult_female ?? record.adultFemale) +
    toNumberValue(record.children_male ?? record.childrenMale) +
    toNumberValue(record.children_female ?? record.childrenFemale) +
    toNumberValue(record.youth_male ?? record.youthMale) +
    toNumberValue(record.youth_female ?? record.youthFemale);

  return {
    adultMale: toNumberValue(record.adult_male ?? record.adultMale),
    adultFemale: toNumberValue(record.adult_female ?? record.adultFemale),
    childrenMale: toNumberValue(record.children_male ?? record.childrenMale),
    childrenFemale: toNumberValue(record.children_female ?? record.childrenFemale),
    youthMale: toNumberValue(record.youth_male ?? record.youthMale),
    youthFemale: toNumberValue(record.youth_female ?? record.youthFemale),
    visitors,
    visitingPastors,
    totalWithoutVisitors,
    totalAttendance: totalWithoutVisitors + visitors + visitingPastors,
  };
};

const EventReportDetails = () => {
  const { id } = useParams();
  const location = useLocation();

  const [selectedDate, setSelectedDate] = useState("");
  const [activeReportViewTab, setActiveReportViewTab] =
    useState<ReportViewTab>("Data");
  const [activeReportSectionTab, setActiveReportSectionTab] =
    useState<ReportSectionTab>("Department Overview");
  const [openDepartments, setOpenDepartments] = useState<Record<string, boolean>>(
    {}
  );
  const [insightDepartmentFilter, setInsightDepartmentFilter] = useState("ALL");
  const [insightTimingStatusFilter, setInsightTimingStatusFilter] =
    useState<TimingStatusFilter>("ALL");
  const [insightRelativeDirection, setInsightRelativeDirection] =
    useState<RelativeDirectionFilter>("ALL");
  const [insightRelativeHours, setInsightRelativeHours] = useState("2");
  const [dataSearchTerm, setDataSearchTerm] = useState("");
  const [downloadFormat, setDownloadFormat] =
    useState<EventReportServiceSummaryFormat | "">("");

  const reportEventId = String(id || "");
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const eventNameFromQuery = searchParams.get("eventName") || "";
  const eventDateFromQuery = normalizeDateOnly(searchParams.get("eventDate") || "");

  const reportDetailsQuery = useMemo<Record<string, string | number>>(() => {
    const query: Record<string, string | number> = {
      event_id: reportEventId,
    };
    const reportDate = selectedDate || eventDateFromQuery;

    if (reportDate) {
      query.event_date = reportDate;
    }

    return query;
  }, [eventDateFromQuery, reportEventId, selectedDate]);

  const {
    data: reportDetailsResponse,
    loading,
    error,
  } = useFetch<ApiResponse<EventReportDetail | null>>(
    api.fetch.fetchEventReportDetails as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<EventReportDetail | null>>,
    reportDetailsQuery,
    !reportEventId
  );

  const { data: attendanceTimingConfigResponse } = useFetch<
    ApiResponse<AttendanceTimingSettingsConfig>
  >(api.fetch.fetchAttendanceTimingConfig);

  const reportDetails = useMemo(
    () => toRecord(reportDetailsResponse?.data),
    [reportDetailsResponse]
  );

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    const primaryDate = normalizeDateOnly(
      firstNonEmptyString(reportDetails.event_date, reportDetails.eventDate)
    );

    if (eventDateFromQuery) dateSet.add(eventDateFromQuery);
    if (primaryDate) dateSet.add(primaryDate);

    toArray(reportDetails.available_dates ?? reportDetails.availableDates).forEach(
      (value) => {
        const normalizedDate = normalizeDateOnly(value);
        if (normalizedDate) {
          dateSet.add(normalizedDate);
        }
      }
    );

    return Array.from(dateSet).sort((left, right) => right.localeCompare(left));
  }, [eventDateFromQuery, reportDetails]);

  useEffect(() => {
    if (selectedDate) return;
    if (!availableDates.length) return;

    if (eventDateFromQuery && availableDates.includes(eventDateFromQuery)) {
      setSelectedDate(eventDateFromQuery);
      return;
    }

    setSelectedDate(availableDates[0]);
  }, [availableDates, eventDateFromQuery, selectedDate]);

  const effectiveReportDate =
    selectedDate ||
    eventDateFromQuery ||
    normalizeDateOnly(firstNonEmptyString(reportDetails.event_date, reportDetails.eventDate));

  const eventName = firstNonEmptyString(
    eventNameFromQuery,
    reportDetails.event_name,
    reportDetails.eventName,
    `Event ${reportEventId}`
  );

  const eventType = firstNonEmptyString(
    reportDetails.event_type,
    reportDetails.eventType
  );
  const eventLocation = firstNonEmptyString(reportDetails.location, reportDetails.venue);
  const eventStartTime = firstNonEmptyString(
    reportDetails.start_time,
    reportDetails.startTime
  );
  const eventEndTime = firstNonEmptyString(reportDetails.end_time, reportDetails.endTime);
  const generatedAt = firstNonEmptyString(
    reportDetails.generated_at,
    reportDetails.generatedAt,
    reportDetails.created_at,
    reportDetails.createdAt
  );
  const eventStartDateTime = useMemo(
    () => buildEventStartDateTime(effectiveReportDate, eventStartTime),
    [effectiveReportDate, eventStartTime]
  );

  const attendanceTimingConfig = useMemo(
    () => attendanceTimingConfigResponse?.data || DEFAULT_ATTENDANCE_TIMING_CONFIG,
    [attendanceTimingConfigResponse]
  );

  const attendanceTimingRuleMinutes = useMemo<AttendanceTimingRuleMinutes>(
    () => ({
      early: normalizeTimingRuleMinutes(attendanceTimingConfig.early?.minutes),
      onTime: normalizeTimingRuleMinutes(
        attendanceTimingConfig.on_time?.minutes
      ),
      late: normalizeTimingRuleMinutes(attendanceTimingConfig.late?.minutes),
    }),
    [attendanceTimingConfig]
  );

  const departmentSections = useMemo(
    () =>
      toArray(
        reportDetails.departments ??
          reportDetails.department_overview ??
          reportDetails.departmentOverview
      )
        .map((item) => normalizeDepartmentSection(item))
        .filter((item): item is DepartmentSection => Boolean(item))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [reportDetails]
  );

  const attendanceTotals = useMemo(
    () =>
      normalizeAttendanceTotals(
        reportDetails.church_attendance ??
          reportDetails.churchAttendance ??
          reportDetails.attendance
      ),
    [reportDetails]
  );

  const departmentInsightRows = useMemo<DepartmentInsightRow[]>(() => {
    return departmentSections
      .flatMap((department) =>
        department.attendees.map((attendee) => {
          const arrivalRaw = attendee.arrivalAt || attendee.arrivalTime;
          let arrivalDateTime = DateTime.fromISO(arrivalRaw);

          if (!arrivalDateTime.isValid) {
            const fallbackTime = normalizeTimeOnly(arrivalRaw);
            const fallbackDateTime =
              effectiveReportDate && fallbackTime
                ? buildEventStartDateTime(effectiveReportDate, fallbackTime)
                : null;

            if (fallbackDateTime) {
              arrivalDateTime = fallbackDateTime;
            }
          }

          const arrivalSortValue = arrivalDateTime.isValid
            ? arrivalDateTime.toMillis()
            : null;
          const minutesFromStart =
            eventStartDateTime && arrivalDateTime.isValid
              ? Math.round(arrivalDateTime.diff(eventStartDateTime, "minutes").minutes)
              : null;

          return {
            id: buildDepartmentAttendeeLookupKey(department.id, attendee),
            name: attendee.name,
            departmentId: department.id,
            departmentName: department.name,
            arrivalTime: attendee.reportedTime || attendee.arrivalTime,
            reportedAtLabel: arrivalDateTime.isValid
              ? arrivalDateTime.toFormat("dd LLL yyyy, HH:mm")
              : "",
            relativeToStartLabel:
              attendee.relativeToStart ||
              (attendee.attendanceStatus === "ABSENT"
                ? "—"
                : formatRelativeToStart(minutesFromStart)),
            minutesFromStart,
            timingStatus:
              attendee.attendanceStatus ||
              getTimingStatus(minutesFromStart, attendanceTimingRuleMinutes),
            arrivalSortValue,
          };
        })
      )
      .sort((left, right) => {
        if (left.arrivalSortValue !== null && right.arrivalSortValue !== null) {
          return left.arrivalSortValue - right.arrivalSortValue;
        }

        if (left.arrivalSortValue !== null) return -1;
        if (right.arrivalSortValue !== null) return 1;

        return left.name.localeCompare(right.name);
      });
  }, [
    attendanceTimingRuleMinutes,
    departmentSections,
    effectiveReportDate,
    eventStartDateTime,
  ]);

  const departmentInsightRowsByAttendeeKey = useMemo(() => {
    return departmentInsightRows.reduce<Map<string, DepartmentInsightRow>>(
      (map, row) => {
        map.set(row.id, row);
        return map;
      },
      new Map<string, DepartmentInsightRow>()
    );
  }, [departmentInsightRows]);

  const departmentFilterOptions = useMemo(
    () =>
      departmentSections
        .map((department) => ({
          id: department.id,
          name: department.name,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [departmentSections]
  );

  const insightRelativeHoursValue = useMemo(
    () => Math.max(toNumberValue(insightRelativeHours), 0),
    [insightRelativeHours]
  );

  const filteredDepartmentInsightRows = useMemo(() => {
    return departmentInsightRows.filter((row) => {
      if (
        insightDepartmentFilter !== "ALL" &&
        row.departmentId !== insightDepartmentFilter
      ) {
        return false;
      }

      if (
        insightTimingStatusFilter !== "ALL" &&
        row.timingStatus !== insightTimingStatusFilter
      ) {
        return false;
      }

      if (insightRelativeDirection === "ALL") {
        return true;
      }

      if (row.minutesFromStart === null) {
        return false;
      }

      const thresholdMinutes = insightRelativeHoursValue * 60;
      if (insightRelativeDirection === "BEFORE") {
        return row.minutesFromStart <= -thresholdMinutes;
      }

      return row.minutesFromStart >= thresholdMinutes;
    });
  }, [
    departmentInsightRows,
    insightDepartmentFilter,
    insightRelativeDirection,
    insightRelativeHoursValue,
    insightTimingStatusFilter,
  ]);

  const departmentInsightSummary = useMemo(
    () =>
      filteredDepartmentInsightRows.reduce(
        (summary, row) => {
          if (row.timingStatus === "EARLY") summary.early += 1;
          if (row.timingStatus === "ON_TIME") summary.onTime += 1;
          if (row.timingStatus === "LATE") summary.late += 1;
          if (row.timingStatus === "ABSENT") summary.absent += 1;
          if (row.timingStatus === "UNCLASSIFIED") summary.unclassified += 1;
          return summary;
        },
        {
          early: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          unclassified: 0,
        }
      ),
    [filteredDepartmentInsightRows]
  );

  const normalizedDataSearchTerm = dataSearchTerm.trim().toLowerCase();

  const dataDepartmentSections = useMemo<DepartmentDataSectionView[]>(() => {
    return departmentSections
      .map((department) => {
        if (!normalizedDataSearchTerm) {
          return {
            ...department,
            visibleAttendees: department.attendees,
            visibleCount: department.attendees.length,
          };
        }

        const departmentMatches = department.name
          .toLowerCase()
          .includes(normalizedDataSearchTerm);
        const visibleAttendees = departmentMatches
          ? department.attendees
          : department.attendees.filter((attendee) =>
              attendee.name.toLowerCase().includes(normalizedDataSearchTerm)
            );

        if (!departmentMatches && visibleAttendees.length === 0) {
          return null;
        }

        return {
          ...department,
          visibleAttendees,
          visibleCount: visibleAttendees.length,
        };
      })
      .filter((department): department is DepartmentDataSectionView =>
        Boolean(department)
      );
  }, [departmentSections, normalizedDataSearchTerm]);

  useEffect(() => {
    if (!departmentSections.length) return;

    setOpenDepartments((current) => {
      if (Object.keys(current).length > 0) return current;
      return {
        [departmentSections[0].id]: true,
      };
    });
  }, [departmentSections]);

  useEffect(() => {
    if (!normalizedDataSearchTerm || dataDepartmentSections.length === 0) return;

    setOpenDepartments((current) => {
      const next = { ...current };
      dataDepartmentSections.forEach((department) => {
        next[department.id] = true;
      });
      return next;
    });
  }, [dataDepartmentSections, normalizedDataSearchTerm]);

  const departmentPresenceSeries = useMemo(() => {
    const sortedDepartments = [...departmentSections].sort(
      (left, right) => right.attendancePercentage - left.attendancePercentage
    );

    return {
      labels: sortedDepartments.map((department) => department.name),
      values: sortedDepartments.map((department) =>
        Number(department.attendancePercentage.toFixed(1))
      ),
      colors: sortedDepartments.map((department) => {
        if (department.attendancePercentage >= 75) return "#16A34A";
        if (department.attendancePercentage >= 40) return "#F59E0B";
        return "#DC2626";
      }),
    };
  }, [departmentSections]);

  const departmentCoverageSummary = useMemo(() => {
    const totalMembers = departmentSections.reduce(
      (total, department) => total + department.totalMembers,
      0
    );
    const presentMembers = departmentSections.reduce(
      (total, department) => total + department.presentMembers,
      0
    );
    const absentMembers = Math.max(totalMembers - presentMembers, 0);

    return {
      totalMembers,
      presentMembers,
      absentMembers,
      attendancePercentage:
        totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0,
    };
  }, [departmentSections]);

  const churchAttendanceSeries = useMemo(
    () => ({
      labels: [
        "Adult Male",
        "Adult Female",
        "Children Male",
        "Children Female",
        "Youth Male",
        "Youth Female",
        "Visitors",
        "Visiting Pastors",
      ],
      values: [
        attendanceTotals.adultMale,
        attendanceTotals.adultFemale,
        attendanceTotals.childrenMale,
        attendanceTotals.childrenFemale,
        attendanceTotals.youthMale,
        attendanceTotals.youthFemale,
        attendanceTotals.visitors,
        attendanceTotals.visitingPastors,
      ],
    }),
    [attendanceTotals]
  );

  const churchAttendanceMix = useMemo(
    () => ({
      labels: ["Members", "Visitors", "Visiting Pastors"],
      values: [
        attendanceTotals.totalWithoutVisitors,
        attendanceTotals.visitors,
        attendanceTotals.visitingPastors,
      ],
    }),
    [attendanceTotals]
  );

  const horizontalBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y" as const,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value: string | number) => `${value}%`,
          },
        },
      },
    }),
    []
  );

  const barChartOptions = useMemo(
    () => ({
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
          ticks: {
            precision: 0,
          },
        },
      },
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
        },
      },
    }),
    []
  );

  const handleDownloadServiceSummary = async (
    format: EventReportServiceSummaryFormat
  ) => {
    if (!effectiveReportDate) {
      showNotification("A report date is required before downloading.", "error");
      return;
    }

    setDownloadFormat(format);

    try {
      const file = await api.post.downloadEventReportServiceSummary(
        {
          event_id: reportEventId,
          event_date: effectiveReportDate,
        },
        format
      );
      downloadBlobFile(file.blob, file.fileName);
    } catch (error: unknown) {
      const backendMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.error ||
        "";
      showNotification(
        backendMessage ||
          (error instanceof Error
            ? error.message
            : "Unable to download the service summary report."),
        "error"
      );
    } finally {
      setDownloadFormat("");
    }
  };

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    {
      label: "Reports",
      link: `${relativePath.home.main}/${relativePath.home.reports.eventReports}`,
    },
    {
      label: "Event Reports",
      link: `${relativePath.home.main}/${relativePath.home.reports.eventReports}`,
    },
    { label: "Event Report Details", link: "" },
  ];

  if (!reportEventId) {
    return (
      <PageOutline crumbs={crumbs}>
        <p className="rounded-lg bg-red-50 px-4 py-6 text-sm text-red-700">
          Invalid report event identifier.
        </p>
      </PageOutline>
    );
  }

  return (
    <PageOutline crumbs={crumbs}>
      <section className="space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div>
              <h1 className="text-xl font-semibold text-primary md:text-2xl">
                Event Report Details
              </h1>
              <p className="text-sm text-primaryGray">{eventName}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-primaryGray">
              <span className="rounded-full bg-lightGray/40 px-3 py-1">
                Event Date: {formatDate(effectiveReportDate)}
              </span>
              {eventType && (
                <span className="rounded-full bg-lightGray/40 px-3 py-1">
                  {eventType}
                </span>
              )}
              {eventLocation && (
                <span className="rounded-full bg-lightGray/40 px-3 py-1">
                  {eventLocation}
                </span>
              )}
              {eventStartTime && (
                <span className="rounded-full bg-lightGray/40 px-3 py-1">
                  {eventStartTime}
                  {eventEndTime ? ` - ${eventEndTime}` : ""}
                </span>
              )}
            </div>

            {generatedAt && (
              <p className="text-xs text-primaryGray">
                Generated on {formatDateTime(generatedAt)}
              </p>
            )}
          </div>

          <div className="flex min-w-[240px] flex-col gap-3">
            {availableDates.length > 1 && (
              <label className="space-y-1 text-sm">
                <span className="block text-xs font-medium text-primaryGray">
                  Report Date
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-lightGray px-3"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="rounded-xl border border-lightGray bg-gray-50 p-3">
              <p className="text-sm font-medium text-primary">
                Generate Service Summary Report
              </p>
              <p className="mt-1 text-xs text-primaryGray">
                Download the current report as DOCX or PDF.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  value="Download DOCX"
                  variant="secondary"
                  onClick={() => handleDownloadServiceSummary("docx")}
                  loading={downloadFormat === "docx"}
                  disabled={!effectiveReportDate}
                />
                <Button
                  value="Download PDF"
                  variant="secondary"
                  onClick={() => handleDownloadServiceSummary("pdf")}
                  loading={downloadFormat === "pdf"}
                  disabled={!effectiveReportDate}
                />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <p className="rounded-lg bg-lightGray/30 px-3 py-2 text-sm text-primaryGray">
            Loading event report details...
          </p>
        )}

        {error && !loading && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || "Unable to load the selected event report."}
          </p>
        )}
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-lightGray bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-primary">Report View</h2>
          <span className="text-xs text-primaryGray">{activeReportViewTab}</span>
        </div>

        <TabSelection
          tabs={[...reportViewTabs]}
          selectedTab={activeReportViewTab}
          onTabSelect={setActiveReportViewTab}
        />

        <p className="text-xs text-primaryGray">
          {activeReportViewTab === "Data" &&
            "Detailed records, attendance counts, and event reporting data."}
          {activeReportViewTab === "Insight" &&
            "Visual summaries of department coverage and church attendance."}
        </p>
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-lightGray bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-primary">
            Report Sections
          </h2>
          <span className="text-xs text-primaryGray">
            {activeReportSectionTab}
          </span>
        </div>

        <TabSelection
          tabs={[...reportSectionTabs]}
          selectedTab={activeReportSectionTab}
          onTabSelect={setActiveReportSectionTab}
        />
      </section>

      {activeReportSectionTab === "Department Overview" && (
        <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-primary">
              Department Overview
            </h2>
            <span className="text-xs text-primaryGray">
              {countFormatter.format(departmentCoverageSummary.presentMembers)} present
              {" "}out of{" "}
              {countFormatter.format(departmentCoverageSummary.totalMembers)} members
              {" "}(
              {percentFormatter.format(departmentCoverageSummary.attendancePercentage)}
              %)
            </span>
          </div>

          {departmentSections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
              No departmental data found for this report.
            </p>
          ) : (
            <>
              {activeReportViewTab === "Insight" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-medium text-primaryGray">
                        Department
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-lightGray px-3"
                        value={insightDepartmentFilter}
                        onChange={(event) =>
                          setInsightDepartmentFilter(event.target.value)
                        }
                      >
                        <option value="ALL">All departments</option>
                        {departmentFilterOptions.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-medium text-primaryGray">
                        Timing Status
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-lightGray px-3"
                        value={insightTimingStatusFilter}
                        onChange={(event) =>
                          setInsightTimingStatusFilter(
                            event.target.value as TimingStatusFilter
                          )
                        }
                      >
                        <option value="ALL">All statuses</option>
                        <option value="EARLY">Early</option>
                        <option value="ON_TIME">On Time</option>
                        <option value="LATE">Late</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-medium text-primaryGray">
                        Relative Filter
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-lightGray px-3"
                        value={insightRelativeDirection}
                        onChange={(event) =>
                          setInsightRelativeDirection(
                            event.target.value as RelativeDirectionFilter
                          )
                        }
                      >
                        <option value="ALL">No time filter</option>
                        <option value="BEFORE">Before start</option>
                        <option value="AFTER">After start</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-medium text-primaryGray">
                        Hours from Start
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="h-10 w-full rounded-lg border border-lightGray px-3"
                        value={insightRelativeHours}
                        onChange={(event) =>
                          setInsightRelativeHours(event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border border-lightGray bg-gray-50 px-3 py-2 text-xs text-primaryGray">
                    {eventStartDateTime ? (
                      <>
                        Timing is measured against the event start at{" "}
                        <span className="font-medium text-primary">
                          {eventStartDateTime.toFormat("dd LLL yyyy, HH:mm")}
                        </span>
                        . Early starts at{" "}
                        {formatMinutesDistance(attendanceTimingRuleMinutes.early)}{" "}
                        before, on time stays within{" "}
                        {formatMinutesDistance(attendanceTimingRuleMinutes.onTime)},
                        and late starts at{" "}
                        {formatMinutesDistance(attendanceTimingRuleMinutes.late)}{" "}
                        after the event start.
                      </>
                    ) : (
                      "Timing status needs a valid event start date and time."
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-lg border border-lightGray p-3">
                      <p className="text-xs text-primaryGray">Early</p>
                      <p className="text-lg font-semibold text-primary">
                        {countFormatter.format(departmentInsightSummary.early)}
                      </p>
                    </article>
                    <article className="rounded-lg border border-lightGray p-3">
                      <p className="text-xs text-primaryGray">On Time</p>
                      <p className="text-lg font-semibold text-primary">
                        {countFormatter.format(departmentInsightSummary.onTime)}
                      </p>
                    </article>
                    <article className="rounded-lg border border-lightGray p-3">
                      <p className="text-xs text-primaryGray">Late</p>
                      <p className="text-lg font-semibold text-primary">
                        {countFormatter.format(departmentInsightSummary.late)}
                      </p>
                    </article>
                    <article className="rounded-lg border border-lightGray p-3">
                      <p className="text-xs text-primaryGray">Matching Members</p>
                      <p className="text-lg font-semibold text-primary">
                        {countFormatter.format(filteredDepartmentInsightRows.length)}
                      </p>
                    </article>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <article className="rounded-lg border border-lightGray p-3 lg:col-span-2">
                      <p className="text-sm font-medium text-primary">
                        Department Attendance Rate
                      </p>
                      <div className="mt-3 h-72">
                        <Bar
                          data={{
                            labels: departmentPresenceSeries.labels,
                            datasets: [
                              {
                                label: "Attendance %",
                                data: departmentPresenceSeries.values,
                                backgroundColor: departmentPresenceSeries.colors,
                                borderRadius: 6,
                                maxBarThickness: 28,
                              },
                            ],
                          }}
                          options={horizontalBarOptions}
                        />
                      </div>
                    </article>

                    <article className="rounded-lg border border-lightGray p-3">
                      <p className="text-sm font-medium text-primary">
                        Overall Department Coverage
                      </p>
                      <div className="mt-3 h-72">
                        <Doughnut
                          data={{
                            labels: ["Present", "Absent"],
                            datasets: [
                              {
                                data: [
                                  departmentCoverageSummary.presentMembers,
                                  departmentCoverageSummary.absentMembers,
                                ],
                                backgroundColor: ["#16A34A", "#E5E7EB"],
                              },
                            ],
                          }}
                          options={doughnutOptions}
                        />
                      </div>
                    </article>
                  </div>

                  <article className="overflow-hidden rounded-lg border border-lightGray">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-primary">
                          Department Reporting Detail
                        </p>
                        <p className="text-xs text-primaryGray">
                          Member, department, reported time, and timing status.
                        </p>
                      </div>
                      <span className="text-xs text-primaryGray">
                        {countFormatter.format(filteredDepartmentInsightRows.length)} records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-t border-lightGray text-sm">
                        <thead>
                          <tr className="bg-white">
                            <th className="px-4 py-3 text-left font-semibold text-primary">
                              Member
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-primary">
                              Department
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-primary">
                              Reported Time
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-primary">
                              Relative to Start
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-primary">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDepartmentInsightRows.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-primaryGray">
                                No member records matched the current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredDepartmentInsightRows.map((row) => (
                              <tr
                                key={row.id}
                                className="border-t border-lightGray align-top"
                              >
                                <td className="px-4 py-3">{row.name}</td>
                                <td className="px-4 py-3">{row.departmentName}</td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <p className="text-primary">{row.arrivalTime}</p>
                                    {row.reportedAtLabel && (
                                      <p className="text-xs text-primaryGray">
                                        {row.reportedAtLabel}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {row.relativeToStartLabel}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getTimingBadgeClasses(
                                      row.timingStatus
                                    )}`}
                                  >
                                    {timingStatusLabelMap[row.timingStatus]}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              )}

              {activeReportViewTab === "Data" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-lg border border-lightGray p-3 md:flex-row md:items-end md:justify-between">
                    <label className="w-full max-w-xl space-y-1 text-sm">
                      <span className="block text-xs font-medium text-primaryGray">
                        Search Department or Member
                      </span>
                      <input
                        type="text"
                        className="h-10 w-full rounded-lg border border-lightGray px-3"
                        placeholder="Search department name or member name"
                        value={dataSearchTerm}
                        onChange={(event) => setDataSearchTerm(event.target.value)}
                      />
                    </label>
                    <p className="text-xs text-primaryGray">
                      {countFormatter.format(dataDepartmentSections.length)} departments
                      matched
                    </p>
                  </div>

                  {dataDepartmentSections.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
                      No departments or members matched your search.
                    </p>
                  ) : (
                    dataDepartmentSections.map((department) => {
                      const isOpen = openDepartments[department.id] ?? false;

                      return (
                        <article
                          key={department.id}
                          className="overflow-hidden rounded-lg border border-lightGray"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDepartments((current) => ({
                                ...current,
                                [department.id]: !current[department.id],
                              }))
                            }
                            className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left"
                          >
                            <div>
                              <p className="font-medium text-primary">
                                {department.name}
                              </p>
                              <p className="text-xs text-primaryGray">
                                {countFormatter.format(department.presentMembers)} present
                                out of{" "}
                                {countFormatter.format(department.totalMembers)} members
                              </p>
                              <p className="text-xs text-primaryGray">
                                {percentFormatter.format(
                                  department.attendancePercentage
                                )}
                                % attendance rate
                              </p>
                              {normalizedDataSearchTerm && (
                                <p className="text-xs text-primaryGray">
                                  Showing {countFormatter.format(department.visibleCount)}
                                  {" "}of{" "}
                                  {countFormatter.format(department.attendees.length)}
                                  {" "}member records
                                </p>
                              )}
                            </div>
                            <span className="text-lg text-primary">
                              {isOpen ? "−" : "+"}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border-t border-lightGray text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="px-4 py-3 text-left font-semibold text-primary">
                                      Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-primary">
                                      Reported Time
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-primary">
                                      Relative to Start
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-primary">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {department.visibleAttendees.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={4}
                                        className="px-4 py-4 text-primaryGray"
                                      >
                                        No member records matched your search for
                                        this department.
                                      </td>
                                    </tr>
                                  ) : (
                                    department.visibleAttendees.map((attendee) => {
                                      const insightRow =
                                        departmentInsightRowsByAttendeeKey.get(
                                          buildDepartmentAttendeeLookupKey(
                                            department.id,
                                            attendee
                                          )
                                        );

                                      return (
                                        <tr
                                          key={buildDepartmentAttendeeLookupKey(
                                            department.id,
                                            attendee
                                          )}
                                          className="border-t border-lightGray"
                                        >
                                          <td className="px-4 py-3">{attendee.name}</td>
                                          <td className="px-4 py-3">
                                            <div className="space-y-1">
                                              <p className="text-primary">
                                                {attendee.reportedTime ||
                                                  attendee.arrivalTime}
                                              </p>
                                              {insightRow?.reportedAtLabel && (
                                                <p className="text-xs text-primaryGray">
                                                  {insightRow.reportedAtLabel}
                                                </p>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            {insightRow?.relativeToStartLabel ||
                                              "Event start time unavailable"}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span
                                              className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getTimingBadgeClasses(
                                                insightRow?.timingStatus ||
                                                  "UNCLASSIFIED"
                                              )}`}
                                            >
                                              {
                                                timingStatusLabelMap[
                                                  insightRow?.timingStatus ||
                                                    "UNCLASSIFIED"
                                                ]
                                              }
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-lightGray bg-white px-4 py-3 text-sm">
                            <div className="space-y-1">
                              <p>
                                <span className="font-medium text-primary">
                                  Head of Department:
                                </span>{" "}
                                <span className="text-primaryGray">
                                  {department.headName || "Not assigned"}
                                </span>
                              </p>
                              <p className="text-xs text-primaryGray">
                                Present: {countFormatter.format(department.presentMembers)}
                                {" "} | Absent:{" "}
                                {countFormatter.format(department.absentMembers)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-lightGray/40 px-3 py-2 text-right">
                              <p className="text-xs text-primaryGray">
                                Attendance Rate
                              </p>
                              <p className="font-semibold text-primary">
                                {percentFormatter.format(
                                  department.attendancePercentage
                                )}
                                %
                              </p>
                            </div>
                          </footer>
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {activeReportSectionTab === "Church Attendance" && (
        <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-primary">
              Church Attendance
            </h2>
            <span className="text-sm font-medium text-primary">
              Total Attendance: {countFormatter.format(attendanceTotals.totalAttendance)}
            </span>
          </header>

          {activeReportViewTab === "Insight" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <article className="rounded-lg border border-lightGray p-3 lg:col-span-2">
                <p className="text-sm font-medium text-primary">
                  Attendance Composition by Category
                </p>
                <div className="mt-3 h-72">
                  <Bar
                    data={{
                      labels: churchAttendanceSeries.labels,
                      datasets: [
                        {
                          label: "Attendance",
                          data: churchAttendanceSeries.values,
                          backgroundColor: [
                            "#2563EB",
                            "#60A5FA",
                            "#F97316",
                            "#FDBA74",
                            "#16A34A",
                            "#86EFAC",
                            "#7C3AED",
                            "#C084FC",
                          ],
                          borderRadius: 8,
                          maxBarThickness: 42,
                        },
                      ],
                    }}
                    options={barChartOptions}
                  />
                </div>
              </article>

              <article className="rounded-lg border border-lightGray p-3">
                <p className="text-sm font-medium text-primary">
                  Members vs Visitors
                </p>
                <div className="mt-3 h-72">
                  <Doughnut
                    data={{
                      labels: churchAttendanceMix.labels,
                      datasets: [
                        {
                          data: churchAttendanceMix.values,
                          backgroundColor: ["#16A34A", "#2563EB", "#F97316"],
                        },
                      ],
                    }}
                    options={doughnutOptions}
                  />
                </div>
              </article>
            </div>
          )}

          {activeReportViewTab === "Data" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Adult Male</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.adultMale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Adult Female</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.adultFemale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Male Children</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.childrenMale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Female Children</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.childrenFemale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Male Youth</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.youthMale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Female Youth</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.youthFemale)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Visitors</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.visitors)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">Visiting Pastors</p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.visitingPastors)}
                </p>
              </div>
              <div className="rounded-lg border border-lightGray p-3">
                <p className="text-xs text-primaryGray">
                  Attendance (Without Visitors)
                </p>
                <p className="text-base font-semibold text-primary">
                  {countFormatter.format(attendanceTotals.totalWithoutVisitors)}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </PageOutline>
  );
};

export default EventReportDetails;
