import { Button } from "@/components";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { ensureAnalyticsChartsRegistered } from "@/pages/HomePage/pages/Analytics/chartSetup";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { showNotification } from "@/pages/HomePage/utils";
import { api, DepartmentType, relativePath } from "@/utils";
import type { AttendanceTimingSettingsConfig } from "@/utils/api/settings/attendanceTimingInterfaces";
import { ApiResponse } from "@/utils/interfaces";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useLocation, useParams } from "react-router-dom";

type UnknownRecord = Record<string, unknown>;

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type FinalApprovalStatus = "WAITING" | "PENDING" | "APPROVED" | "REJECTED";

type ApprovalState = {
  status: ApprovalStatus;
  approvedByName: string;
  approvedByUserId: string;
  approvedAt: string;
  canCurrentUserApprove: boolean;
};

type FinanceLineItem = {
  id: string;
  name: string;
  amount: number;
};

type DepartmentAttendee = {
  id: string;
  name: string;
  arrivalTime: string;
  arrivalAt: string;
  reportedTime: string;
  relativeToStart: string;
  attendanceStatus: TimingStatus | "";
  userId: string;
  departmentId: string;
  departmentName: string;
};

type DepartmentSection = {
  id: string;
  name: string;
  headName: string;
  headUserId: string;
  attendees: DepartmentAttendee[];
  totalMembers: number;
  presentMembers: number;
  absentMembers: number;
  attendancePercentage: number;
};

type AttendanceRecord = {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  adultMale: number;
  adultFemale: number;
  childrenMale: number;
  childrenFemale: number;
  youthMale: number;
  youthFemale: number;
  visitors: {
    male: number;
    female: number;
    total: number;
  };
  visitorClergy: {
    male: number;
    female: number;
    total: number;
  };
  visitorTotal: {
    male: number;
    female: number;
    total: number;
  };
};

type AttendanceTotals = {
  adultMale: number;
  adultFemale: number;
  childrenMale: number;
  childrenFemale: number;
  youthMale: number;
  youthFemale: number;
  visitors: {
    male: number;
    female: number;
    total: number;
  };
  visitorClergy: {
    male: number;
    female: number;
    total: number;
  };
  visitorTotal: {
    male: number;
    female: number;
    total: number;
  };
  totalWithoutVisitors: number;
  totalAttendance: number;
};

type FinalApprovalState = {
  status: FinalApprovalStatus;
  approverName: string;
  actedByName: string;
  actedAt: string;
  canCurrentUserSubmit: boolean;
  canCurrentUserApprove: boolean;
  viewers: string[];
};

type BackendDepartment = {
  id: string;
  name: string;
  headName: string;
  headUserId: string;
  attendees: DepartmentAttendee[];
  totalMembers: number;
  presentMembers: number;
  absentMembers: number;
  attendancePercentage: number;
};

type TimingStatus = "EARLY" | "ON_TIME" | "LATE" | "ABSENT" | "UNCLASSIFIED";
type TimingStatusFilter = "ALL" | "EARLY" | "ON_TIME" | "LATE" | "ABSENT";
type RelativeDirectionFilter = "ALL" | "BEFORE" | "AFTER";

type DepartmentInsightRow = {
  id: string;
  userId: string;
  name: string;
  departmentId: string;
  departmentName: string;
  arrivalTime: string;
  arrivalAt: string;
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

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

const toBooleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(normalized);
  }

  return false;
};

const toOptionalBooleanValue = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  return null;
};

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toStringValue(value);
    if (normalized) return normalized;
  }

  return "";
};

const normalizeDateOnly = (value: unknown): string => {
  const raw = toStringValue(value);
  if (!raw) return "";

  const fromIso = DateTime.fromISO(raw);
  if (fromIso.isValid) {
    return fromIso.toFormat("yyyy-LL-dd");
  }

  const fromJsDate = DateTime.fromJSDate(new Date(raw));
  if (fromJsDate.isValid) {
    return fromJsDate.toFormat("yyyy-LL-dd");
  }

  return "";
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
  if (fallback.isValid) {
    return fallback.toFormat("dd LLL yyyy, HH:mm");
  }

  return raw;
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

  const isoParsed = DateTime.fromISO(raw);
  if (isoParsed.isValid) {
    return isoParsed.toFormat("HH:mm:ss");
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return `${raw}:00`;
  }

  return "";
};

const buildEventStartDateTime = (
  dateValue: unknown,
  timeValue: unknown
): DateTime | null => {
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

const buildDepartmentAttendeeLookupKey = (
  departmentId: string,
  attendee: Pick<DepartmentAttendee, "id" | "userId" | "name">
) => `${departmentId}::${attendee.userId || attendee.id || attendee.name}`;

const normalizeTimingStatusValue = (value: unknown): TimingStatus | null => {
  const status = toStringValue(value)
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

  if (status === "EARLY") return "EARLY";
  if (status === "ON_TIME" || status === "ONTIME") return "ON_TIME";
  if (status === "LATE") return "LATE";
  if (status === "ABSENT") return "ABSENT";

  return null;
};

const normalizeApprovalStatus = (value: unknown): ApprovalStatus => {
  const status = toStringValue(value).toUpperCase();

  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";

  return "PENDING";
};

const normalizeFinalApprovalStatus = (value: unknown): FinalApprovalStatus => {
  const status = toStringValue(value).toUpperCase();

  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "PENDING") return "PENDING";

  return "WAITING";
};

const buildApprovalState = (
  value: unknown,
  fallbackCanApprove = false
): ApprovalState => {
  const record = toRecord(value);
  const approvedByUserId = firstNonEmptyString(
    record.approved_by_user_id,
    record.approvedByUserId,
    record.acted_by_user_id,
    record.actedByUserId,
    toRecord(record.approved_by).id,
    toRecord(record.approvedBy).id
  );

  const approvalState = {
    status: normalizeApprovalStatus(
      record.status ?? record.approval_status ?? record.approvalStatus
    ),
    approvedByName: firstNonEmptyString(
      record.approved_by_name,
      record.approvedByName,
      record.acted_by_name,
      record.actedByName,
      toRecord(record.approved_by).name,
      toRecord(record.approvedBy).name
    ),
    approvedByUserId,
    approvedAt: firstNonEmptyString(
      record.approved_at,
      record.approvedAt,
      record.acted_at,
      record.actedAt
    ),
    canCurrentUserApprove:
      toOptionalBooleanValue(record.can_current_user_approve) ??
      toOptionalBooleanValue(record.canCurrentUserApprove) ??
      fallbackCanApprove,
  };

  if (approvalState.status === "APPROVED") {
    return {
      ...approvalState,
      canCurrentUserApprove: false,
    };
  }

  return approvalState;
};

const getApprovalBadgeClasses = (status: ApprovalStatus | FinalApprovalStatus) => {
  if (status === "APPROVED") {
    return "bg-[#D2F4EA] text-[#039855]";
  }

  if (status === "REJECTED") {
    return "bg-[#F9DADA] text-[#D14343]";
  }

  if (status === "PENDING") {
    return "bg-[#FFEFD2] text-[#996A13]";
  }

  return "bg-[#EDEFF5] text-lighterBlack";
};

const statusLabelMap: Record<ApprovalStatus | FinalApprovalStatus, string> = {
  WAITING: "Waiting",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const timingStatusLabelMap: Record<TimingStatus, string> = {
  EARLY: "Early",
  ON_TIME: "On Time",
  LATE: "Late",
  ABSENT: "Absent",
  UNCLASSIFIED: "Unclassified",
};

const getTimingBadgeClasses = (status: TimingStatus) => {
  if (status === "EARLY") {
    return "bg-[#DBEAFE] text-[#1D4ED8]";
  }

  if (status === "ON_TIME") {
    return "bg-[#D2F4EA] text-[#039855]";
  }

  if (status === "LATE") {
    return "bg-[#FFF0D5] text-[#B54708]";
  }

  if (status === "ABSENT") {
    return "bg-[#FEE4E2] text-[#B42318]";
  }

  return "bg-[#EDEFF5] text-lighterBlack";
};

const normalizeAttendeeRecord = (value: unknown): DepartmentAttendee | null => {
  const record = toRecord(value);
  const userRecord = toRecord(record.user);
  const userInfo = toRecord(userRecord.user_info);
  const nestedUser = toRecord(userInfo.user);
  const scopedDepartmentRecord = toRecord(userRecord.department);
  const scopedDepartmentInfo = toRecord(
    scopedDepartmentRecord.department_info ?? scopedDepartmentRecord.departmentInfo
  );
  const departmentPosition = toRecord(
    toArray(
      record.department_positions ??
        record.departmentPositions ??
        userRecord.department_positions ??
        userRecord.departmentPositions ??
        nestedUser.department_positions ??
        nestedUser.departmentPositions ??
        userInfo.department_positions ??
        userInfo.departmentPositions
    )[0]
  );
  const departmentPositionRecord = toRecord(
    departmentPosition.department ??
      departmentPosition.department_info ??
      departmentPosition.departmentInfo
  );
  const departmentRecord = toRecord(
    record.department ??
      nestedUser.department ??
      userInfo.department ??
      scopedDepartmentInfo
  );

  const attendeeName = firstNonEmptyString(
    record.name,
    record.full_name,
    record.member_name,
    record.memberName,
    record.user_name,
    userInfo.name,
    nestedUser.name,
    toRecord(record.user).name
  );

  if (!attendeeName) {
    return null;
  }

  const departmentId = firstNonEmptyString(
    record.department_id,
    record.departmentId,
    userRecord.department_id,
    scopedDepartmentRecord.department_id,
    departmentPosition.department_id,
    nestedUser.department_id,
    userInfo.department_id,
    departmentRecord.id
  );

  const departmentName = firstNonEmptyString(
    record.department_name,
    record.departmentName,
    userRecord.department_name,
    departmentPosition.department_name,
    departmentPositionRecord.name,
    nestedUser.department_name,
    userInfo.department_name,
    departmentRecord.name,
    "Unassigned"
  );

  const userId = firstNonEmptyString(
    record.user_id,
    record.userId,
    nestedUser.id,
    userInfo.id,
    userRecord.id
  );

  const arrivalRaw = firstNonEmptyString(
    record.arrival_time,
    record.arrivalTime,
    record.checked_in_at,
    record.checkedInAt,
    record.created_at,
    record.createdAt
  );
  const reportedTime = firstNonEmptyString(
    record.reported_time,
    record.reportedTime
  );
  const relativeToStart = firstNonEmptyString(
    record.relative_to_start,
    record.relativeToStart
  );
  const attendanceStatus = normalizeTimingStatusValue(record.status);

  return {
    id: firstNonEmptyString(record.id, `${userId}-${attendeeName}`),
    name: attendeeName,
    arrivalTime: formatArrivalTime(arrivalRaw),
    arrivalAt: arrivalRaw,
    reportedTime:
      reportedTime && reportedTime !== "-" && reportedTime !== "—"
        ? reportedTime
        : "",
    relativeToStart:
      relativeToStart && relativeToStart !== "-" && relativeToStart !== "—"
        ? relativeToStart
        : "",
    attendanceStatus: attendanceStatus ?? "",
    userId,
    departmentId,
    departmentName,
  };
};

const normalizeAttendanceRecord = (value: unknown): AttendanceRecord | null => {
  const record = toRecord(value);

  const date = normalizeDateOnly(record.date);
  if (!date) return null;

  const eventId = firstNonEmptyString(record.eventId, record.event_id);
  const visitors = {
    male: toNumberValue(record.visitorsMale ?? record.visitors_male),
    female: toNumberValue(record.visitorsFemale ?? record.visitors_female),
    total: toNumberValue(record.visitorsTotal ?? record.visitors_total),
  };
  const visitorClergy = {
    male: toNumberValue(
      record.visitorClergyMale ?? record.visitor_clergy_male
    ),
    female: toNumberValue(
      record.visitorClergyFemale ?? record.visitor_clergy_female
    ),
    total: toNumberValue(
      record.visitorClergyTotal ?? record.visitor_clergy_total
    ),
  };
  const visitorTotal = {
    male:
      toNumberValue(record.visitorTotalMale ?? record.visitor_total_male) ||
      visitors.male + visitorClergy.male,
    female:
      toNumberValue(record.visitorTotalFemale ?? record.visitor_total_female) ||
      visitors.female + visitorClergy.female,
    total:
      toNumberValue(record.visitorTotal ?? record.visitor_total ?? record.visitors) ||
      visitors.total + visitorClergy.total,
  };

  return {
    id: firstNonEmptyString(record.id, record.attendance_id, `${eventId}-${date}`),
    eventId,
    eventName: firstNonEmptyString(record.event_name, record.eventName),
    date,
    adultMale: toNumberValue(record.adultMale ?? record.adult_male),
    adultFemale: toNumberValue(record.adultFemale ?? record.adult_female),
    childrenMale: toNumberValue(record.childrenMale ?? record.children_male),
    childrenFemale: toNumberValue(record.childrenFemale ?? record.children_female),
    youthMale: toNumberValue(record.youthMale ?? record.youth_male),
    youthFemale: toNumberValue(record.youthFemale ?? record.youth_female),
    visitors,
    visitorClergy,
    visitorTotal,
  };
};

const normalizeFinanceLineItems = (value: unknown, fallbackPrefix: string) => {
  const items = toArray(value)
    .map((item, index) => {
      const record = toRecord(item);
      const name = firstNonEmptyString(record.name, record.title, record.label);
      const amount = toNumberValue(record.amount);

      return {
        id: firstNonEmptyString(record.id, `${fallbackPrefix}-${index + 1}`),
        name,
        amount,
      } satisfies FinanceLineItem;
    })
    .filter((item) => item.name || item.amount > 0);

  return items.length > 0 ? items : [{ id: `${fallbackPrefix}-1`, name: "", amount: 0 }];
};

const createFinanceLineItem = (prefix: string): FinanceLineItem => ({
  id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  amount: 0,
});

const EventReportDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState("");
  const [activeReportViewTab, setActiveReportViewTab] =
    useState<ReportViewTab>("Data");
  const [openDepartments, setOpenDepartments] = useState<Record<string, boolean>>(
    {}
  );
  const [churchApprovalOverride, setChurchApprovalOverride] =
    useState<ApprovalState | null>(null);
  const [financeApprovalOverrides, setFinanceApprovalOverrides] = useState<{
    countingLeader?: ApprovalState;
    financeRep?: ApprovalState;
  }>({});
  const [finalApprovalOverride, setFinalApprovalOverride] =
    useState<FinalApprovalState | null>(null);
  const [incomeItems, setIncomeItems] = useState<FinanceLineItem[]>([
    createFinanceLineItem("income"),
  ]);
  const [expenseItems, setExpenseItems] = useState<FinanceLineItem[]>([
    createFinanceLineItem("expense"),
  ]);

  const [isApprovingChurch, setIsApprovingChurch] = useState(false);
  const [financeActionLoadingRole, setFinanceActionLoadingRole] = useState<
    "COUNTING_LEADER" | "FINANCE_REP" | ""
  >("");
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [finalActionLoading, setFinalActionLoading] = useState<
    "SUBMIT" | "APPROVE" | "REJECT" | ""
  >("");
  const [insightDepartmentFilter, setInsightDepartmentFilter] = useState("ALL");
  const [insightTimingStatusFilter, setInsightTimingStatusFilter] =
    useState<TimingStatusFilter>("ALL");
  const [insightRelativeDirection, setInsightRelativeDirection] =
    useState<RelativeDirectionFilter>("ALL");
  const [insightRelativeHours, setInsightRelativeHours] = useState("2");
  const [dataSearchTerm, setDataSearchTerm] = useState("");

  const reportEventId = String(id || "");

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const eventNameFromQuery = searchParams.get("eventName") || "";
  const eventDateFromQuery = searchParams.get("eventDate") || "";
  const normalizedEventDateFromQuery = normalizeDateOnly(eventDateFromQuery);

  const reportDetailsQuery = useMemo<Record<string, string | number>>(() => {
    const query: Record<string, string | number> = {
      event_id: reportEventId,
    };

    const reportDate = selectedDate || normalizedEventDateFromQuery;
    if (reportDate) {
      query.event_date = reportDate;
    }

    return query;
  }, [normalizedEventDateFromQuery, reportEventId, selectedDate]);

  const {
    data: reportDetailsResponse,
    error: reportDetailsError,
    refetch: refetchReportDetails,
  } = useFetch<ApiResponse<unknown>>(
    api.fetch.fetchEventReportDetails as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<unknown>>,
    reportDetailsQuery,
    !reportEventId
  );

  const {
    data: eventDetailsResponse,
    loading: loadingEventDetails,
    error: eventDetailsError,
  } = useFetch<ApiResponse<Record<string, unknown>>>(
    api.fetch.fetchEventById as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<Record<string, unknown>>>,
    { id: reportEventId },
    !reportEventId
  );

  const { data: departmentsResponse } = useFetch<ApiResponse<DepartmentType[]>>(
    api.fetch.fetchDepartments as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<DepartmentType[]>>
  );

  const { data: attendanceResponse } = useFetch<ApiResponse<unknown>>(
    api.fetch.fetchChurchAttendance as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<unknown>>
  );

  const { data: attendanceTimingConfigResponse } = useFetch<
    ApiResponse<AttendanceTimingSettingsConfig>
  >(
    api.fetch.fetchAttendanceTimingConfig as () => Promise<
      ApiResponse<AttendanceTimingSettingsConfig>
    >
  );

  const reportDetails = useMemo(
    () => toRecord(reportDetailsResponse?.data),
    [reportDetailsResponse]
  );

  const eventDetails = useMemo(
    () => toRecord(eventDetailsResponse?.data),
    [eventDetailsResponse]
  );

  const eventName = useMemo(
    () =>
      firstNonEmptyString(
        eventNameFromQuery,
        reportDetails.event_name,
        reportDetails.eventName,
        eventDetails.event_name,
        eventDetails.name,
        `Event ${reportEventId}`
      ),
    [eventDetails, eventNameFromQuery, reportDetails, reportEventId]
  );

  const eventStartDate = useMemo(
    () =>
      normalizeDateOnly(
        firstNonEmptyString(
          eventDateFromQuery,
          reportDetails.event_date,
          reportDetails.eventDate,
          eventDetails.start_date
        )
      ),
    [eventDateFromQuery, eventDetails.start_date, reportDetails.eventDate, reportDetails.event_date]
  );

  const effectiveReportDate =
    selectedDate || normalizedEventDateFromQuery || eventStartDate || "";

  const eventStartTime = useMemo(
    () =>
      firstNonEmptyString(
        reportDetails.start_time,
        reportDetails.startTime,
        eventDetails.start_time,
        eventDetails.startTime
      ),
    [
      eventDetails.startTime,
      eventDetails.start_time,
      reportDetails.startTime,
      reportDetails.start_time,
    ]
  );

  const eventStartDateTime = useMemo(
    () => buildEventStartDateTime(effectiveReportDate || eventStartDate, eventStartTime),
    [effectiveReportDate, eventStartDate, eventStartTime]
  );

  const attendanceTimingConfig = useMemo(
    () => attendanceTimingConfigResponse?.data || DEFAULT_ATTENDANCE_TIMING_CONFIG,
    [attendanceTimingConfigResponse]
  );

  const attendanceTimingRuleMinutes = useMemo<AttendanceTimingRuleMinutes>(
    () => ({
      early: normalizeTimingRuleMinutes(attendanceTimingConfig.early?.minutes),
      onTime: normalizeTimingRuleMinutes(attendanceTimingConfig.on_time?.minutes),
      late: normalizeTimingRuleMinutes(attendanceTimingConfig.late?.minutes),
    }),
    [attendanceTimingConfig]
  );

  const eventIdTokens = useMemo(() => {
    const tokenSet = new Set<string>();

    [
      reportEventId,
      firstNonEmptyString(reportDetails.event_id, reportDetails.eventId),
      firstNonEmptyString(eventDetails.id),
      firstNonEmptyString(eventDetails.event_name_id),
    ]
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => tokenSet.add(token));

    return tokenSet;
  }, [eventDetails, reportDetails, reportEventId]);

  const normalizedAttendanceRecords = useMemo(() => {
    const records = toArray(attendanceResponse?.data)
      .map((record) => normalizeAttendanceRecord(record))
      .filter((record): record is AttendanceRecord => Boolean(record));

    return records.filter((record) => {
      if (record.eventId && eventIdTokens.has(record.eventId)) return true;
      if (record.eventName && record.eventName.toLowerCase() === eventName.toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [attendanceResponse?.data, eventIdTokens, eventName]);

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();

    if (eventStartDate) dateSet.add(eventStartDate);

    normalizedAttendanceRecords.forEach((record) => {
      if (record.date) dateSet.add(record.date);
    });

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [eventStartDate, normalizedAttendanceRecords]);

  useEffect(() => {
    if (selectedDate) return;
    if (!availableDates.length) return;

    if (
      normalizedEventDateFromQuery &&
      availableDates.includes(normalizedEventDateFromQuery)
    ) {
      setSelectedDate(normalizedEventDateFromQuery);
      return;
    }

    setSelectedDate(availableDates[0]);
  }, [availableDates, normalizedEventDateFromQuery, selectedDate]);

  const attendanceForSelectedDate = useMemo(
    () =>
      normalizedAttendanceRecords.filter((record) =>
        selectedDate ? record.date === selectedDate : true
      ),
    [normalizedAttendanceRecords, selectedDate]
  );

  const attendanceTotals = useMemo<AttendanceTotals>(() => {
    const totals = attendanceForSelectedDate.reduce(
      (accumulator, record) => {
        accumulator.adultMale += record.adultMale;
        accumulator.adultFemale += record.adultFemale;
        accumulator.childrenMale += record.childrenMale;
        accumulator.childrenFemale += record.childrenFemale;
        accumulator.youthMale += record.youthMale;
        accumulator.youthFemale += record.youthFemale;
        accumulator.visitors.male += record.visitors.male;
        accumulator.visitors.female += record.visitors.female;
        accumulator.visitors.total += record.visitors.total;
        accumulator.visitorClergy.male += record.visitorClergy.male;
        accumulator.visitorClergy.female += record.visitorClergy.female;
        accumulator.visitorClergy.total += record.visitorClergy.total;
        accumulator.visitorTotal.male += record.visitorTotal.male;
        accumulator.visitorTotal.female += record.visitorTotal.female;
        accumulator.visitorTotal.total += record.visitorTotal.total;
        return accumulator;
      },
      {
        adultMale: 0,
        adultFemale: 0,
        childrenMale: 0,
        childrenFemale: 0,
        youthMale: 0,
        youthFemale: 0,
        visitors: { male: 0, female: 0, total: 0 },
        visitorClergy: { male: 0, female: 0, total: 0 },
        visitorTotal: { male: 0, female: 0, total: 0 },
        totalWithoutVisitors: 0,
        totalAttendance: 0,
      }
    );

    totals.totalWithoutVisitors =
      totals.adultMale +
      totals.adultFemale +
      totals.childrenMale +
      totals.childrenFemale +
      totals.youthMale +
      totals.youthFemale;

    totals.totalAttendance =
      totals.totalWithoutVisitors + totals.visitorTotal.total;

    return totals;
  }, [attendanceForSelectedDate]);

  const fallbackDepartmentAttendees = useMemo(() => {
    const attendees = toArray(eventDetails.event_attendance)
      .map((record) => normalizeAttendeeRecord(record))
      .filter((record): record is DepartmentAttendee => Boolean(record));

    return attendees;
  }, [eventDetails.event_attendance]);

  const fallbackAttendeesByDepartment = useMemo(() => {
    const grouped = new Map<string, Map<string, DepartmentAttendee>>();

    fallbackDepartmentAttendees.forEach((attendee) => {
      const key = attendee.departmentId || attendee.departmentName || "UNASSIGNED";
      const bucket = grouped.get(key) || new Map<string, DepartmentAttendee>();
      const attendeeKey = attendee.userId || attendee.id;
      const existing = bucket.get(attendeeKey);
      const attendeeArrivalKey = attendee.arrivalAt || attendee.arrivalTime;
      const existingArrivalKey = existing?.arrivalAt || existing?.arrivalTime || "";

      if (!existing || attendeeArrivalKey < existingArrivalKey) {
        bucket.set(attendeeKey, attendee);
      }

      grouped.set(key, bucket);
    });

    return Array.from(grouped.entries()).reduce<Record<string, DepartmentAttendee[]>>(
      (accumulator, [key, attendees]) => {
        accumulator[key] = Array.from(attendees.values());
        return accumulator;
      },
      {}
    );
  }, [fallbackDepartmentAttendees]);

  const backendDepartmentSections = useMemo<DepartmentSection[]>(() => {
    return toArray(
      reportDetails.departments ??
        reportDetails.department_overview ??
        reportDetails.departmentOverview
    )
      .map((item) => {
        const record = toRecord(item);
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
          headUserId: firstNonEmptyString(
            record.head_user_id,
            record.headUserId,
            record.department_head,
            record.hod_user_id,
            record.hodUserId,
            headRecord.id
          ),
          attendees,
          totalMembers,
          presentMembers,
          absentMembers,
          attendancePercentage,
        } satisfies DepartmentSection;
      })
      .filter((department): department is DepartmentSection => Boolean(department));
  }, [reportDetails]);

  const departmentSections = useMemo(() => {
    if (backendDepartmentSections.length > 0) {
      return backendDepartmentSections;
    }

    const departments = Array.isArray(departmentsResponse?.data)
      ? departmentsResponse.data
      : [];
    const usedFallbackKeys = new Set<string>();
    const sectionList: DepartmentSection[] = departments.map((department) => {
      const departmentId = String(department.id);
      const departmentName = firstNonEmptyString(department.name, "Unnamed Department");
      const attendees =
        fallbackAttendeesByDepartment[departmentId] ||
        fallbackAttendeesByDepartment[departmentName] ||
        [];

      if (attendees.length > 0) {
        usedFallbackKeys.add(departmentId);
        usedFallbackKeys.add(departmentName);
      }

      const totalMembers = toNumberValue(department.member_count);
      const presentMembers = attendees.length;
      const absentMembers = Math.max(totalMembers - presentMembers, 0);
      const attendancePercentage =
        totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0;

      return {
        id: departmentId,
        name: departmentName,
        headName: firstNonEmptyString(
          department.department_head_info?.name,
          "No head assigned"
        ),
        headUserId: firstNonEmptyString(
          department.department_head,
          department.department_head_info?.id
        ),
        attendees,
        totalMembers,
        presentMembers,
        absentMembers,
        attendancePercentage,
      };
    });

    Object.entries(fallbackAttendeesByDepartment).forEach(([key, attendees]) => {
      if (usedFallbackKeys.has(key)) return;

      const presentMembers = attendees.length;
      sectionList.push({
        id: key,
        name: attendees[0]?.departmentName || "Unassigned",
        headName: "No head assigned",
        headUserId: "",
        attendees,
        totalMembers: presentMembers,
        presentMembers,
        absentMembers: 0,
        attendancePercentage: presentMembers > 0 ? 100 : 0,
      });
    });

    return sectionList
      .filter((department) => department.totalMembers > 0 || department.presentMembers > 0)
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [backendDepartmentSections, departmentsResponse?.data, fallbackAttendeesByDepartment]);

  const departmentInsightRows = useMemo<DepartmentInsightRow[]>(() => {
    const reportDate = effectiveReportDate || eventStartDate;

    return departmentSections
      .flatMap((department) =>
        department.attendees.map((attendee) => {
          const arrivalRaw = attendee.arrivalAt || attendee.arrivalTime;
          let arrivalDateTime = DateTime.fromISO(arrivalRaw);

          if (!arrivalDateTime.isValid) {
            const fallbackTime = normalizeTimeOnly(arrivalRaw);
            const fallbackDateTime =
              reportDate && fallbackTime
                ? buildEventStartDateTime(reportDate, fallbackTime)
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
              ? Math.round(
                  arrivalDateTime.diff(eventStartDateTime, "minutes").minutes
                )
              : null;

          return {
            id: buildDepartmentAttendeeLookupKey(department.id, attendee),
            userId: attendee.userId,
            name: attendee.name,
            departmentId: department.id,
            departmentName: department.name,
            arrivalTime: attendee.reportedTime || attendee.arrivalTime,
            arrivalAt: arrivalDateTime.isValid
              ? arrivalDateTime.toISO() || arrivalRaw
              : arrivalRaw,
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
          } satisfies DepartmentInsightRow;
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
    eventStartDate,
    eventStartDateTime,
  ]);

  const departmentInsightRowsByAttendeeKey = useMemo(() => {
    return departmentInsightRows.reduce<Map<string, DepartmentInsightRow>>((map, row) => {
      map.set(row.id, row);
      return map;
    }, new Map<string, DepartmentInsightRow>());
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
      .filter(
        (department): department is DepartmentDataSectionView => Boolean(department)
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

  const backendChurchApproval = useMemo(() => {
    const churchRecord = toRecord(
      reportDetails.church_attendance ??
        reportDetails.churchAttendance ??
        reportDetails.attendance
    );

    return buildApprovalState(
      churchRecord.approval ?? churchRecord,
      toBooleanValue(churchRecord.can_current_user_approve)
    );
  }, [reportDetails]);

  const churchApproval = churchApprovalOverride || backendChurchApproval;

  const financeRecord = useMemo(
    () =>
      toRecord(
        reportDetails.finance ??
          reportDetails.financial_summary ??
          reportDetails.financialSummary
      ),
    [reportDetails]
  );

  useEffect(() => {
    const normalizedIncome = normalizeFinanceLineItems(
      financeRecord.income ?? financeRecord.incomes,
      "income"
    );
    const normalizedExpense = normalizeFinanceLineItems(
      financeRecord.expense ?? financeRecord.expenses,
      "expense"
    );

    setIncomeItems(normalizedIncome);
    setExpenseItems(normalizedExpense);
  }, [financeRecord]);

  const baseCountingLeaderApproval = useMemo(() => {
    const approvalsRecord = toRecord(financeRecord.approvals);

    return buildApprovalState(
      financeRecord.counting_leader_approval ??
        financeRecord.countingLeaderApproval ??
        approvalsRecord.counting_leader ??
        approvalsRecord.countingLeader,
      false
    );
  }, [financeRecord]);

  const baseFinanceRepApproval = useMemo(() => {
    const approvalsRecord = toRecord(financeRecord.approvals);

    return buildApprovalState(
      financeRecord.finance_rep_approval ??
        financeRecord.financeRepApproval ??
        approvalsRecord.finance_rep ??
        approvalsRecord.financeRep,
      false
    );
  }, [financeRecord]);

  const countingLeaderApproval =
    financeApprovalOverrides.countingLeader || baseCountingLeaderApproval;
  const financeRepApproval = financeApprovalOverrides.financeRep || baseFinanceRepApproval;

  const countingLeaderName = firstNonEmptyString(
    financeRecord.counting_leader_name,
    financeRecord.countingLeaderName,
    "Counting Leader"
  );
  const financeRepName = firstNonEmptyString(
    financeRecord.finance_rep_name,
    financeRecord.financeRepName,
    "Finance Rep"
  );

  const totalIncome = useMemo(
    () => incomeItems.reduce((sum, item) => sum + item.amount, 0),
    [incomeItems]
  );
  const totalExpense = useMemo(
    () => expenseItems.reduce((sum, item) => sum + item.amount, 0),
    [expenseItems]
  );
  const incomeSurplus = totalIncome - totalExpense;

  const departmentPresenceSeries = useMemo(() => {
    const sortedDepartments = [...departmentSections].sort(
      (first, second) => second.attendancePercentage - first.attendancePercentage
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

  const churchCompositionSeries = useMemo(
    () => ({
      labels: ["Adults", "Children", "Youth", "Visitors", "Visitor Clergy"],
      male: [
        attendanceTotals.adultMale,
        attendanceTotals.childrenMale,
        attendanceTotals.youthMale,
        attendanceTotals.visitors.male,
        attendanceTotals.visitorClergy.male,
      ],
      female: [
        attendanceTotals.adultFemale,
        attendanceTotals.childrenFemale,
        attendanceTotals.youthFemale,
        attendanceTotals.visitors.female,
        attendanceTotals.visitorClergy.female,
      ],
    }),
    [attendanceTotals]
  );

  const attendanceTrendSeries = useMemo(() => {
    const totalsByDate = new Map<string, number>();

    normalizedAttendanceRecords.forEach((record) => {
      const attendanceWithoutVisitors =
        record.adultMale +
        record.adultFemale +
        record.childrenMale +
        record.childrenFemale +
        record.youthMale +
        record.youthFemale +
        record.visitorTotal.total;

      totalsByDate.set(
        record.date,
        (totalsByDate.get(record.date) || 0) + attendanceWithoutVisitors
      );
    });

    const trendDates = Array.from(
      new Set([...availableDates, ...Array.from(totalsByDate.keys())])
    ).sort((first, second) => first.localeCompare(second));

    return {
      labels: trendDates.map((date) => formatDate(date)),
      values: trendDates.map((date) => totalsByDate.get(date) || 0),
    };
  }, [availableDates, normalizedAttendanceRecords]);

  const incomeBreakdownSeries = useMemo(
    () =>
      incomeItems
        .map((item, index) => ({
          label: item.name || `Income ${index + 1}`,
          value: item.amount,
        }))
        .filter((item) => item.value > 0)
        .sort((first, second) => second.value - first.value)
        .slice(0, 8),
    [incomeItems]
  );

  const expenseBreakdownSeries = useMemo(
    () =>
      expenseItems
        .map((item, index) => ({
          label: item.name || `Expense ${index + 1}`,
          value: item.amount,
        }))
        .filter((item) => item.value > 0)
        .sort((first, second) => second.value - first.value)
        .slice(0, 8),
    [expenseItems]
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

  const stackedBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
        },
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    }),
    []
  );

  const lineChartOptions = useMemo(
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

  const financeApprovalsComplete =
    countingLeaderApproval.status === "APPROVED" &&
    financeRepApproval.status === "APPROVED";

  const checklistReadyForFinalApproval =
    churchApproval.status === "APPROVED" && financeApprovalsComplete;

  const baseFinalApproval = useMemo<FinalApprovalState>(() => {
    const finalRecord = toRecord(
      reportDetails.final_approval ?? reportDetails.finalApproval
    );

    const viewers = toArray(
      reportDetails.final_viewers ?? reportDetails.finalViewers
    )
      .map((viewer) => {
        const record = toRecord(viewer);
        return firstNonEmptyString(record.name, record.full_name, viewer);
      })
      .filter(Boolean);

    return {
      status: normalizeFinalApprovalStatus(
        finalRecord.status ?? finalRecord.approval_status ?? finalRecord.approvalStatus
      ),
      approverName: firstNonEmptyString(
        finalRecord.approver_name,
        finalRecord.approverName,
        reportDetails.executive_pastor_name,
        reportDetails.executivePastorName,
        "Executive Pastor"
      ),
      actedByName: firstNonEmptyString(
        finalRecord.acted_by_name,
        finalRecord.actedByName,
        finalRecord.approved_by_name,
        finalRecord.approvedByName
      ),
      actedAt: firstNonEmptyString(
        finalRecord.acted_at,
        finalRecord.actedAt,
        finalRecord.approved_at,
        finalRecord.approvedAt
      ),
      canCurrentUserSubmit:
        toOptionalBooleanValue(finalRecord.can_current_user_submit) ??
        toOptionalBooleanValue(finalRecord.canCurrentUserSubmit) ??
        false,
      canCurrentUserApprove:
        toOptionalBooleanValue(finalRecord.can_current_user_approve) ??
        toOptionalBooleanValue(finalRecord.canCurrentUserApprove) ??
        false,
      viewers,
    };
  }, [reportDetails]);

  const finalApproval = finalApprovalOverride || baseFinalApproval;

  const finalApprovalStatus = useMemo<FinalApprovalStatus>(() => {
    if (
      finalApproval.status === "WAITING" &&
      !checklistReadyForFinalApproval
    ) {
      return "WAITING";
    }

    return finalApproval.status;
  }, [checklistReadyForFinalApproval, finalApproval.status]);

  const updateFinanceLineItem = (
    type: "income" | "expense",
    idToUpdate: string,
    field: "name" | "amount",
    value: string
  ) => {
    const applyUpdate = (items: FinanceLineItem[]) =>
      items.map((item) => {
        if (item.id !== idToUpdate) return item;

        if (field === "name") {
          return {
            ...item,
            name: value,
          };
        }

        return {
          ...item,
          amount: toNumberValue(value),
        };
      });

    if (type === "income") {
      setIncomeItems((current) => applyUpdate(current));
      return;
    }

    setExpenseItems((current) => applyUpdate(current));
  };

  const removeFinanceLineItem = (type: "income" | "expense", idToRemove: string) => {
    const applyRemove = (items: FinanceLineItem[]) => {
      const next = items.filter((item) => item.id !== idToRemove);
      if (next.length === 0) {
        return [createFinanceLineItem(type)];
      }
      return next;
    };

    if (type === "income") {
      setIncomeItems((current) => applyRemove(current));
      return;
    }

    setExpenseItems((current) => applyRemove(current));
  };

  const buildApprovedState = (canCurrentUserApprove = false): ApprovalState => ({
    status: "APPROVED",
    approvedByName: user.name || "Current User",
    approvedByUserId: user.id,
    approvedAt: new Date().toISOString(),
    canCurrentUserApprove,
  });

  const handleChurchAttendanceApproval = async () => {
    if (!churchApproval.canCurrentUserApprove) {
      showNotification(
        "You do not have access to approve church attendance for this report.",
        "error"
      );
      return;
    }

    setIsApprovingChurch(true);

    try {
      await api.post.approveEventReportChurchAttendance({
        event_id: reportEventId,
        action: "APPROVE",
        event_date: effectiveReportDate,
      });

      showNotification("Church attendance approved successfully.", "success");
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Church attendance approval captured locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setChurchApprovalOverride(buildApprovedState(false));
      setIsApprovingChurch(false);
    }
  };

  const handleFinanceApproval = async (role: "COUNTING_LEADER" | "FINANCE_REP") => {
    const targetApproval =
      role === "COUNTING_LEADER" ? countingLeaderApproval : financeRepApproval;

    if (!targetApproval.canCurrentUserApprove) {
      showNotification("You do not have access to approve this finance role.", "error");
      return;
    }

    setFinanceActionLoadingRole(role);

    try {
      await api.post.approveEventReportFinance({
        event_id: reportEventId,
        role,
        action: "APPROVE",
        event_date: effectiveReportDate,
      });

      showNotification("Finance approval captured successfully.", "success");
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Finance approval captured locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setFinanceApprovalOverrides((current) => ({
        ...current,
        ...(role === "COUNTING_LEADER"
          ? { countingLeader: buildApprovedState(false) }
          : { financeRep: buildApprovedState(false) }),
      }));

      setFinanceActionLoadingRole("");
    }
  };

  const handleSaveFinance = async () => {
    setIsSavingFinance(true);

    try {
      await api.post.upsertEventReportFinance({
        event_id: reportEventId,
        event_date: effectiveReportDate,
        income: incomeItems,
        expense: expenseItems,
      });

      showNotification("Financial summary saved successfully.", "success");
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Financial summary saved locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleSubmitFinalApproval = async () => {
    if (!checklistReadyForFinalApproval) {
      showNotification(
        "Church attendance and finance approvals must be completed before final approval submission.",
        "error"
      );
      return;
    }

    if (!finalApproval.canCurrentUserSubmit) {
      showNotification(
        "You do not have access to submit this report for final approval.",
        "error"
      );
      return;
    }

    setFinalActionLoading("SUBMIT");

    try {
      await api.post.submitEventReportForFinalApproval({
        event_id: reportEventId,
        event_date: effectiveReportDate,
      });

      showNotification(
        "Report submitted to the Executive Pastor for final approval.",
        "success"
      );
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Final approval submission captured locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setFinalApprovalOverride({
        ...finalApproval,
        status: "PENDING",
        actedAt: new Date().toISOString(),
      });
      setFinalActionLoading("");
    }
  };

  const handleFinalDecision = async (decision: "APPROVE" | "REJECT") => {
    if (!finalApproval.canCurrentUserApprove) {
      showNotification("You do not have access to make the final decision.", "error");
      return;
    }

    setFinalActionLoading(decision === "APPROVE" ? "APPROVE" : "REJECT");

    try {
      await api.post.eventReportFinalApprovalAction({
        event_id: reportEventId,
        event_date: effectiveReportDate,
        action: decision,
      });

      showNotification(
        `Report ${decision === "APPROVE" ? "approved" : "rejected"} successfully.`,
        "success"
      );
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Final decision captured locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setFinalApprovalOverride({
        ...finalApproval,
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        actedByName: user.name || "Current User",
        actedAt: new Date().toISOString(),
      });
      setFinalActionLoading("");
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-primary md:text-2xl">
              Event Report Details
            </h1>
            <p className="text-sm text-primaryGray">{eventName}</p>
            <p className="mt-1 text-xs text-primaryGray">
              Event Date: {formatDate(effectiveReportDate || eventStartDate)}
            </p>
          </div>

          {availableDates.length > 1 && (
            <div className="min-w-[180px]">
              <label
                htmlFor="event-report-date"
                className="mb-1 block text-xs font-medium text-primaryGray"
              >
                Report Date
              </label>
              <select
                id="event-report-date"
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
            </div>
          )}
        </div>

        {(loadingEventDetails || eventDetailsError) && (
          <p className="rounded-lg bg-lightGray/30 px-3 py-2 text-sm text-primaryGray">
            {loadingEventDetails
              ? "Loading event details..."
              : "Unable to load full event payload. Showing available report data."}
          </p>
        )}

        {reportDetailsError && (
          <p className="rounded-lg bg-[#FFF7E6] px-3 py-2 text-sm text-[#996A13]">
            Event report backend payload is unavailable. Approvals and finance changes are currently local until backend endpoints are connected.
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
            "Detailed records, attendance ratios, and editable report data."}
          {activeReportViewTab === "Insight" &&
            "Visual analytics and trends for quick interpretation."}
        </p>
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">Department Overview</h2>
          <span className="text-xs text-primaryGray">
            {countFormatter.format(departmentCoverageSummary.presentMembers)} present out of{" "}
            {countFormatter.format(departmentCoverageSummary.totalMembers)} members (
            {percentFormatter.format(departmentCoverageSummary.attendancePercentage)}%)
          </span>
        </div>

        {departmentSections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
            No departmental data found for this event.
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
                      onChange={(event) => setInsightRelativeHours(event.target.value)}
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
                      . Early starts at {formatMinutesDistance(attendanceTimingRuleMinutes.early)} before, on time stays within{" "}
                      {formatMinutesDistance(attendanceTimingRuleMinutes.onTime)}, and late starts at{" "}
                      {formatMinutesDistance(attendanceTimingRuleMinutes.late)} after
                      the event start.
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

                {departmentInsightSummary.unclassified > 0 && (
                  <p className="text-xs text-primaryGray">
                    {countFormatter.format(departmentInsightSummary.unclassified)}{" "}
                    records could not be classified because the event start time or
                    arrival timestamp was incomplete.
                  </p>
                )}

                {departmentInsightSummary.absent > 0 && (
                  <p className="text-xs text-primaryGray">
                    {countFormatter.format(departmentInsightSummary.absent)} members
                    were marked absent by the report payload.
                  </p>
                )}

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
                            <td
                              colSpan={5}
                              className="px-4 py-4 text-primaryGray"
                            >
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
                              <td className="px-4 py-3">{row.relativeToStartLabel}</td>
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
                          <p className="font-medium text-primary">{department.name}</p>
                          <p className="text-xs text-primaryGray">
                            {countFormatter.format(department.presentMembers)} present out of{" "}
                            {countFormatter.format(department.totalMembers)} members
                          </p>
                          <p className="text-xs text-primaryGray">
                            {percentFormatter.format(department.attendancePercentage)}%
                            attendance rate
                          </p>
                          {normalizedDataSearchTerm && (
                            <p className="text-xs text-primaryGray">
                              Showing {countFormatter.format(department.visibleCount)} of{" "}
                              {countFormatter.format(department.attendees.length)} member
                              records
                            </p>
                          )}
                        </div>
                        <span className="text-lg text-primary">{isOpen ? "−" : "+"}</span>
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
                                    No member records matched your search for this
                                    department.
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
                                            {attendee.reportedTime || attendee.arrivalTime}
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
                                          {timingStatusLabelMap[
                                            insightRow?.timingStatus ||
                                              "UNCLASSIFIED"
                                          ]}
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
                            Present: {countFormatter.format(department.presentMembers)} | Absent:{" "}
                            {countFormatter.format(department.absentMembers)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-lightGray/40 px-3 py-2 text-right">
                          <p className="text-xs text-primaryGray">Attendance Rate</p>
                          <p className="font-semibold text-primary">
                            {percentFormatter.format(department.attendancePercentage)}%
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

      <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">Church Attendance</h2>
          <span className="text-sm font-medium text-primary">
            Total Attendance: {countFormatter.format(attendanceTotals.totalAttendance)}
          </span>
        </header>

        {activeReportViewTab === "Insight" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-lightGray p-3 lg:col-span-2">
            <p className="text-sm font-medium text-primary">
              Attendance Composition by Group
            </p>
            <div className="mt-3 h-72">
              <Bar
                data={{
                  labels: churchCompositionSeries.labels,
                  datasets: [
                    {
                      label: "Male",
                      data: churchCompositionSeries.male,
                      backgroundColor: "#2563EB",
                    },
                    {
                      label: "Female",
                      data: churchCompositionSeries.female,
                      backgroundColor: "#F97316",
                    },
                  ],
                }}
                options={stackedBarOptions}
              />
            </div>
          </article>

          <article className="rounded-lg border border-lightGray p-3">
            <p className="text-sm font-medium text-primary">Attendance Trend by Date</p>
            <div className="mt-3 h-72">
              {attendanceTrendSeries.labels.length > 1 ? (
                <Line
                  data={{
                    labels: attendanceTrendSeries.labels,
                    datasets: [
                      {
                        label: "Total Attendance",
                        data: attendanceTrendSeries.values,
                        borderColor: "#2563EB",
                        backgroundColor: "rgba(37, 99, 235, 0.2)",
                        tension: 0.25,
                        fill: true,
                      },
                    ],
                  }}
                  options={lineChartOptions}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
                  Attendance trend will appear when this event has more than one report date.
                </p>
              )}
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
            <p className="text-xs text-primaryGray">Visitors (Male)</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitors.male)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitors (Female)</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitors.female)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitors Total</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitors.total)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitor Clergy (Male)</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitorClergy.male)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitor Clergy (Female)</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitorClergy.female)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitor Clergy Total</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitorClergy.total)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Attendance (Without Visitors)</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.totalWithoutVisitors)}
            </p>
          </div>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-lightGray pt-3 text-sm">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getApprovalBadgeClasses(
                  churchApproval.status
                )}`}
              >
                {statusLabelMap[churchApproval.status]}
              </span>
              {churchApproval.approvedAt && (
                <span className="text-xs text-primaryGray">
                  {formatDateTime(churchApproval.approvedAt)}
                </span>
              )}
              {churchApproval.approvedByName && (
                <span className="text-xs text-primaryGray">
                  by {churchApproval.approvedByName}
                </span>
              )}
            </div>
          </div>

          {churchApproval.status !== "APPROVED" &&
            churchApproval.canCurrentUserApprove && (
              <Button
                value="Approve"
                variant="secondary"
                onClick={handleChurchAttendanceApproval}
                loading={isApprovingChurch}
              />
            )}
        </footer>
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">Financial Summary</h2>
          {activeReportViewTab === "Data" && (
            <Button
              value="Save Finance"
              variant="secondary"
              onClick={handleSaveFinance}
              loading={isSavingFinance}
            />
          )}
        </header>

        {activeReportViewTab === "Insight" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-lightGray p-3">
            <p className="text-sm font-medium text-primary">Top Income Sources</p>
            <div className="mt-3 h-64">
              {incomeBreakdownSeries.length > 0 ? (
                <Bar
                  data={{
                    labels: incomeBreakdownSeries.map((item) => item.label),
                    datasets: [
                      {
                        label: "Amount",
                        data: incomeBreakdownSeries.map((item) => item.value),
                        backgroundColor: "#16A34A",
                        borderRadius: 6,
                        maxBarThickness: 26,
                      },
                    ],
                  }}
                  options={horizontalBarOptions}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
                  Add income values to populate this chart.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-lightGray p-3">
            <p className="text-sm font-medium text-primary">Top Expense Items</p>
            <div className="mt-3 h-64">
              {expenseBreakdownSeries.length > 0 ? (
                <Bar
                  data={{
                    labels: expenseBreakdownSeries.map((item) => item.label),
                    datasets: [
                      {
                        label: "Amount",
                        data: expenseBreakdownSeries.map((item) => item.value),
                        backgroundColor: "#DC2626",
                        borderRadius: 6,
                        maxBarThickness: 26,
                      },
                    ],
                  }}
                  options={horizontalBarOptions}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
                  Add expense values to populate this chart.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-lightGray p-3 lg:col-span-2">
            <p className="text-sm font-medium text-primary">
              Income vs Expense vs Net Position
            </p>
            <div className="mt-3 h-64">
              <Bar
                data={{
                  labels: ["Total Income", "Total Expense", "Net"],
                  datasets: [
                    {
                      label: "Amount",
                      data: [totalIncome, totalExpense, incomeSurplus],
                      backgroundColor: [
                        "#16A34A",
                        "#DC2626",
                        incomeSurplus < 0 ? "#DC2626" : "#2563EB",
                      ],
                      borderRadius: 8,
                      maxBarThickness: 56,
                    },
                  ],
                }}
                options={lineChartOptions}
              />
            </div>
          </article>
          </div>
        )}

        {activeReportViewTab === "Data" && (
          <>
            <div className="space-y-3 rounded-lg border border-lightGray p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-primary">Income</h3>
            <Button
              value="+ Add Income"
              variant="ghost"
              onClick={() =>
                setIncomeItems((current) => [...current, createFinanceLineItem("income")])
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Amount</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {incomeItems.map((item) => (
                  <tr key={item.id} className="border-t border-lightGray">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="h-9 w-full rounded-lg border border-lightGray px-3"
                        value={item.name}
                        onChange={(event) =>
                          updateFinanceLineItem(
                            "income",
                            item.id,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Tithe"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-9 w-full rounded-lg border border-lightGray px-3"
                        value={item.amount}
                        onChange={(event) =>
                          updateFinanceLineItem(
                            "income",
                            item.id,
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="text-sm text-red-600"
                        onClick={() => removeFinanceLineItem("income", item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-lightGray p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-primary">Expense</h3>
            <Button
              value="+ Add Expense"
              variant="ghost"
              onClick={() =>
                setExpenseItems((current) => [
                  ...current,
                  createFinanceLineItem("expense"),
                ])
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Amount</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenseItems.map((item) => (
                  <tr key={item.id} className="border-t border-lightGray">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="h-9 w-full rounded-lg border border-lightGray px-3"
                        value={item.name}
                        onChange={(event) =>
                          updateFinanceLineItem(
                            "expense",
                            item.id,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Logistics"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-9 w-full rounded-lg border border-lightGray px-3"
                        value={item.amount}
                        onChange={(event) =>
                          updateFinanceLineItem(
                            "expense",
                            item.id,
                            "amount",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="text-sm text-red-600"
                        onClick={() => removeFinanceLineItem("expense", item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-lightGray p-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-primaryGray">Total Income</p>
            <p className="text-base font-semibold text-primary">
              {amountFormatter.format(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-primaryGray">Total Expense</p>
            <p className="text-base font-semibold text-primary">
              {amountFormatter.format(totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-primaryGray">Excess (Income - Expense)</p>
            <p
              className={`text-base font-semibold ${
                incomeSurplus < 0 ? "text-red-600" : "text-primary"
              }`}
            >
              {amountFormatter.format(incomeSurplus)}
            </p>
          </div>
            </div>

            <footer className="grid grid-cols-1 gap-3 border-t border-lightGray pt-3 md:grid-cols-2">
          <article className="rounded-lg border border-lightGray p-3 text-sm">
            <p className="font-medium text-primary">{countingLeaderName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getApprovalBadgeClasses(
                  countingLeaderApproval.status
                )}`}
              >
                {statusLabelMap[countingLeaderApproval.status]}
              </span>
              {countingLeaderApproval.approvedAt && (
                <span className="text-xs text-primaryGray">
                  {formatDateTime(countingLeaderApproval.approvedAt)}
                </span>
              )}
            </div>
            {countingLeaderApproval.status !== "APPROVED" &&
              countingLeaderApproval.canCurrentUserApprove && (
                <div className="mt-3">
                  <Button
                    value="Approve"
                    variant="secondary"
                    onClick={() => handleFinanceApproval("COUNTING_LEADER")}
                    loading={financeActionLoadingRole === "COUNTING_LEADER"}
                  />
                </div>
              )}
          </article>

          <article className="rounded-lg border border-lightGray p-3 text-sm">
            <p className="font-medium text-primary">{financeRepName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getApprovalBadgeClasses(
                  financeRepApproval.status
                )}`}
              >
                {statusLabelMap[financeRepApproval.status]}
              </span>
              {financeRepApproval.approvedAt && (
                <span className="text-xs text-primaryGray">
                  {formatDateTime(financeRepApproval.approvedAt)}
                </span>
              )}
            </div>
            {financeRepApproval.status !== "APPROVED" &&
              financeRepApproval.canCurrentUserApprove && (
                <div className="mt-3">
                  <Button
                    value="Approve"
                    variant="secondary"
                    onClick={() => handleFinanceApproval("FINANCE_REP")}
                    loading={financeActionLoadingRole === "FINANCE_REP"}
                  />
                </div>
              )}
          </article>
            </footer>
          </>
        )}
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Approval</h2>
          <span
            className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getApprovalBadgeClasses(
              finalApprovalStatus
            )}`}
          >
            {statusLabelMap[finalApprovalStatus]}
          </span>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-lightGray p-3 text-sm">
            <p className="text-xs text-primaryGray">Department Coverage</p>
            <p className="font-semibold text-primary">
              {countFormatter.format(departmentCoverageSummary.presentMembers)}/
              {countFormatter.format(departmentCoverageSummary.totalMembers)} present
            </p>
            <p className="text-xs text-primaryGray">
              {percentFormatter.format(departmentCoverageSummary.attendancePercentage)}%
              attendance rate
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3 text-sm">
            <p className="text-xs text-primaryGray">Church Attendance</p>
            <p className="font-semibold text-primary">
              {statusLabelMap[churchApproval.status]}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3 text-sm">
            <p className="text-xs text-primaryGray">Finance Approvals</p>
            <p className="font-semibold text-primary">
              {financeApprovalsComplete ? "Completed" : "Pending"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-lightGray bg-gray-50 p-3 text-sm">
          <p>
            <span className="font-medium text-primary">Final Approver:</span>{" "}
            <span className="text-primaryGray">{finalApproval.approverName}</span>
          </p>

          {finalApproval.actedByName && (
            <p className="mt-1 text-primaryGray">Acted by {finalApproval.actedByName}</p>
          )}
          {finalApproval.actedAt && (
            <p className="text-primaryGray">{formatDateTime(finalApproval.actedAt)}</p>
          )}

          {!checklistReadyForFinalApproval && (
            <p className="mt-2 text-xs text-[#996A13]">
              Church attendance and finance approvals must be completed before
              final approval can proceed.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {finalApprovalStatus === "WAITING" &&
              checklistReadyForFinalApproval &&
              finalApproval.canCurrentUserSubmit && (
                <Button
                  value="Send to Executive Pastor"
                  variant="secondary"
                  onClick={handleSubmitFinalApproval}
                  loading={finalActionLoading === "SUBMIT"}
                />
              )}

            {finalApprovalStatus === "PENDING" && finalApproval.canCurrentUserApprove && (
              <>
                <Button
                  value="Approve Final Report"
                  variant="secondary"
                  onClick={() => handleFinalDecision("APPROVE")}
                  loading={finalActionLoading === "APPROVE"}
                />
                <Button
                  value="Reject Final Report"
                  variant="secondary"
                  onClick={() => handleFinalDecision("REJECT")}
                  loading={finalActionLoading === "REJECT"}
                />
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-lightGray p-3 text-sm">
          <p className="font-medium text-primary">Final Viewers / Notification Recipients</p>
          {finalApproval.viewers.length === 0 ? (
            <p className="mt-1 text-primaryGray">
              No viewers configured yet. Configure this in approval settings for reports.
            </p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-primaryGray">
              {finalApproval.viewers.map((viewer) => (
                <li key={viewer}>{viewer}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageOutline>
  );
};

export default EventReportDetails;
