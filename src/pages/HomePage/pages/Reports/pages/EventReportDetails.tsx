import { Button } from "@/components";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { ensureAnalyticsChartsRegistered } from "@/pages/HomePage/pages/Analytics/chartSetup";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { showNotification } from "@/pages/HomePage/utils";
import { api, DepartmentType, relativePath, VisitorType } from "@/utils";
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
  approval: ApprovalState;
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
  visitingPastors: number;
};

type AttendanceTotals = {
  adultMale: number;
  adultFemale: number;
  childrenMale: number;
  childrenFemale: number;
  youthMale: number;
  youthFemale: number;
  visitingPastors: number;
  visitors: number;
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
  approval: ApprovalState;
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

const toBooleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(normalized);
  }

  return false;
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
  currentUserId: string,
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
      toBooleanValue(record.can_current_user_approve) ||
      toBooleanValue(record.canCurrentUserApprove) ||
      (approvedByUserId
        ? approvedByUserId === currentUserId &&
          normalizeApprovalStatus(record.status) !== "APPROVED"
        : false) ||
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

const normalizeAttendeeRecord = (value: unknown): DepartmentAttendee | null => {
  const record = toRecord(value);
  const userRecord = toRecord(record.user);
  const userInfo = toRecord(userRecord.user_info);
  const nestedUser = toRecord(userInfo.user);
  const departmentRecord = toRecord(
    record.department ??
      nestedUser.department ??
      userInfo.department ??
      userRecord.department
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
    nestedUser.department_id,
    userInfo.department_id,
    departmentRecord.id
  );

  const departmentName = firstNonEmptyString(
    record.department_name,
    record.departmentName,
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

  return {
    id: firstNonEmptyString(record.id, `${userId}-${attendeeName}`),
    name: attendeeName,
    arrivalTime: formatArrivalTime(arrivalRaw),
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
    visitingPastors: toNumberValue(
      record.visitingPastors ?? record.visiting_pastors
    ),
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
  const [departmentApprovalOverrides, setDepartmentApprovalOverrides] = useState<
    Record<string, ApprovalState>
  >({});
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

  const [approvingDepartmentId, setApprovingDepartmentId] = useState("");
  const [isApprovingChurch, setIsApprovingChurch] = useState(false);
  const [financeActionLoadingRole, setFinanceActionLoadingRole] = useState<
    "COUNTING_LEADER" | "FINANCE_REP" | ""
  >("");
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [finalActionLoading, setFinalActionLoading] = useState<
    "SUBMIT" | "APPROVE" | "REJECT" | ""
  >("");

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

  const { data: visitorsResponse } = useFetch<ApiResponse<VisitorType[]>>(
    api.fetch.fetchAllVisitors as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<VisitorType[]>>
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

  const visitorsForEvent = useMemo(() => {
    const visitors = Array.isArray(visitorsResponse?.data)
      ? visitorsResponse.data
      : [];

    return visitors.filter((visitor) => {
      const visitorRecord = toRecord(visitor);
      const visitorEventId = firstNonEmptyString(
        visitor.eventId,
        visitorRecord.event_id
      );
      const visitorEventName = firstNonEmptyString(
        visitor.eventName,
        visitorRecord.event_name
      );

      if (visitorEventId && eventIdTokens.has(visitorEventId)) return true;
      if (visitorEventName && visitorEventName.toLowerCase() === eventName.toLowerCase()) {
        return true;
      }

      return false;
    });
  }, [eventIdTokens, eventName, visitorsResponse?.data]);

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();

    if (eventStartDate) dateSet.add(eventStartDate);

    normalizedAttendanceRecords.forEach((record) => {
      if (record.date) dateSet.add(record.date);
    });

    visitorsForEvent.forEach((visitor) => {
      const date = normalizeDateOnly(visitor.visitDate);
      if (date) dateSet.add(date);
    });

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [eventStartDate, normalizedAttendanceRecords, visitorsForEvent]);

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

  const visitorsForSelectedDate = useMemo(
    () =>
      visitorsForEvent.filter((visitor) => {
        const visitDate = normalizeDateOnly(visitor.visitDate);
        if (!selectedDate) return true;
        return visitDate === selectedDate;
      }),
    [selectedDate, visitorsForEvent]
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
        accumulator.visitingPastors += record.visitingPastors;
        return accumulator;
      },
      {
        adultMale: 0,
        adultFemale: 0,
        childrenMale: 0,
        childrenFemale: 0,
        youthMale: 0,
        youthFemale: 0,
        visitingPastors: 0,
        visitors: visitorsForSelectedDate.length,
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
      totals.youthFemale +
      totals.visitingPastors;

    totals.totalAttendance = totals.totalWithoutVisitors + totals.visitors;

    return totals;
  }, [attendanceForSelectedDate, visitorsForSelectedDate.length]);

  const fallbackDepartmentAttendees = useMemo(() => {
    const attendees = toArray(eventDetails.event_attendance)
      .map((record) => normalizeAttendeeRecord(record))
      .filter((record): record is DepartmentAttendee => Boolean(record));

    return attendees;
  }, [eventDetails.event_attendance]);

  const fallbackAttendeesByDepartment = useMemo(() => {
    return fallbackDepartmentAttendees.reduce<Record<string, DepartmentAttendee[]>>(
      (accumulator, attendee) => {
        const key = attendee.departmentId || attendee.departmentName || "UNASSIGNED";
        if (!accumulator[key]) {
          accumulator[key] = [];
        }

        accumulator[key].push(attendee);
        return accumulator;
      },
      {}
    );
  }, [fallbackDepartmentAttendees]);

  const backendDepartments = useMemo(() => {
    const mapped: Record<string, BackendDepartment> = {};

    toArray(
      reportDetails.departments ??
        reportDetails.department_overview ??
        reportDetails.departmentOverview
    ).forEach((item) => {
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
        return;
      }

      const normalizedAttendees = toArray(
        record.attendees ?? record.members ?? record.department_members
      )
        .map((attendee) => normalizeAttendeeRecord(attendee))
        .filter((attendee): attendee is DepartmentAttendee => Boolean(attendee));

      const headUserId = firstNonEmptyString(
        record.head_user_id,
        record.headUserId,
        record.department_head,
        record.hod_user_id,
        record.hodUserId,
        headRecord.id
      );

      const key = id || name.toLowerCase();

      mapped[key] = {
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
        headUserId,
        attendees: normalizedAttendees,
        approval: buildApprovalState(record.approval ?? record, user.id, headUserId === user.id),
      };
    });

    return mapped;
  }, [reportDetails, user.id]);

  const baseDepartmentSections = useMemo(() => {
    const departments = Array.isArray(departmentsResponse?.data)
      ? departmentsResponse.data
      : [];

    const usedFallbackKeys = new Set<string>();
    const sectionList: DepartmentSection[] = departments.map((department) => {
      const departmentId = String(department.id);
      const departmentName = firstNonEmptyString(department.name, "Unnamed Department");
      const backendDepartment =
        backendDepartments[departmentId] || backendDepartments[departmentName.toLowerCase()];

      const fallbackAttendees =
        fallbackAttendeesByDepartment[departmentId] ||
        fallbackAttendeesByDepartment[departmentName] ||
        [];

      if (fallbackAttendees.length > 0) {
        usedFallbackKeys.add(departmentId);
        usedFallbackKeys.add(departmentName);
      }

      const attendees =
        backendDepartment && backendDepartment.attendees.length > 0
          ? backendDepartment.attendees
          : fallbackAttendees;

      const headUserId =
        backendDepartment?.headUserId ||
        firstNonEmptyString(
          department.department_head,
          department.department_head_info?.id
        );

      const fallbackCanApprove = headUserId === user.id;

      return {
        id: departmentId,
        name: backendDepartment?.name || departmentName,
        headName:
          backendDepartment?.headName ||
          firstNonEmptyString(
            department.department_head_info?.name,
            "No head assigned"
          ),
        headUserId,
        attendees,
        approval:
          backendDepartment?.approval ||
          buildApprovalState({}, user.id, fallbackCanApprove),
      };
    });

    Object.entries(fallbackAttendeesByDepartment).forEach(([key, attendees]) => {
      if (usedFallbackKeys.has(key)) return;

      sectionList.push({
        id: key,
        name: attendees[0]?.departmentName || "Unassigned",
        headName: "No head assigned",
        headUserId: "",
        attendees,
        approval: buildApprovalState({}, user.id, false),
      });
    });

    Object.values(backendDepartments).forEach((department) => {
      const exists = sectionList.some((section) => section.id === department.id);
      if (exists) return;

      sectionList.push({
        id: department.id,
        name: department.name,
        headName: department.headName,
        headUserId: department.headUserId,
        attendees: department.attendees,
        approval: department.approval,
      });
    });

    return sectionList.sort((first, second) => first.name.localeCompare(second.name));
  }, [backendDepartments, departmentsResponse?.data, fallbackAttendeesByDepartment, user.id]);

  const departmentSections = useMemo(() => {
    return baseDepartmentSections.map((section) => {
      const override = departmentApprovalOverrides[section.id];
      if (!override) return section;

      return {
        ...section,
        approval: override,
      };
    });
  }, [baseDepartmentSections, departmentApprovalOverrides]);

  useEffect(() => {
    if (!departmentSections.length) return;

    setOpenDepartments((current) => {
      if (Object.keys(current).length > 0) return current;
      return {
        [departmentSections[0].id]: true,
      };
    });
  }, [departmentSections]);

  const backendChurchApproval = useMemo(() => {
    const churchRecord = toRecord(
      reportDetails.church_attendance ??
        reportDetails.churchAttendance ??
        reportDetails.attendance
    );

    return buildApprovalState(
      churchRecord.approval ?? churchRecord,
      user.id,
      toBooleanValue(churchRecord.can_current_user_approve)
    );
  }, [reportDetails, user.id]);

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
      user.id,
      false
    );
  }, [financeRecord, user.id]);

  const baseFinanceRepApproval = useMemo(() => {
    const approvalsRecord = toRecord(financeRecord.approvals);

    return buildApprovalState(
      financeRecord.finance_rep_approval ??
        financeRecord.financeRepApproval ??
        approvalsRecord.finance_rep ??
        approvalsRecord.financeRep,
      user.id,
      false
    );
  }, [financeRecord, user.id]);

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
      (first, second) => second.attendees.length - first.attendees.length
    );

    return {
      labels: sortedDepartments.map((department) => department.name),
      values: sortedDepartments.map((department) => department.attendees.length),
      colors: sortedDepartments.map((department) => {
        if (department.approval.status === "APPROVED") return "#16A34A";
        if (department.approval.status === "REJECTED") return "#DC2626";
        return "#2563EB";
      }),
    };
  }, [departmentSections]);

  const departmentApprovalBreakdown = useMemo(
    () =>
      departmentSections.reduce(
        (accumulator, department) => {
          if (department.approval.status === "APPROVED") {
            accumulator.approved += 1;
          } else if (department.approval.status === "REJECTED") {
            accumulator.rejected += 1;
          } else {
            accumulator.pending += 1;
          }

          return accumulator;
        },
        { approved: 0, pending: 0, rejected: 0 }
      ),
    [departmentSections]
  );

  const churchCompositionSeries = useMemo(
    () => ({
      labels: ["Adults", "Children", "Youth", "Visiting Pastors", "Visitors"],
      male: [
        attendanceTotals.adultMale,
        attendanceTotals.childrenMale,
        attendanceTotals.youthMale,
        0,
        0,
      ],
      female: [
        attendanceTotals.adultFemale,
        attendanceTotals.childrenFemale,
        attendanceTotals.youthFemale,
        0,
        0,
      ],
      other: [0, 0, 0, attendanceTotals.visitingPastors, attendanceTotals.visitors],
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
        record.visitingPastors;

      totalsByDate.set(
        record.date,
        (totalsByDate.get(record.date) || 0) + attendanceWithoutVisitors
      );
    });

    visitorsForEvent.forEach((visitor) => {
      const visitDate = normalizeDateOnly(visitor.visitDate);
      if (!visitDate) return;

      totalsByDate.set(visitDate, (totalsByDate.get(visitDate) || 0) + 1);
    });

    const trendDates = Array.from(
      new Set([...availableDates, ...Array.from(totalsByDate.keys())])
    ).sort((first, second) => first.localeCompare(second));

    return {
      labels: trendDates.map((date) => formatDate(date)),
      values: trendDates.map((date) => totalsByDate.get(date) || 0),
    };
  }, [availableDates, normalizedAttendanceRecords, visitorsForEvent]);

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
          ticks: {
            precision: 0,
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

  const approvedDepartmentCount = useMemo(
    () =>
      departmentSections.filter(
        (department) => department.approval.status === "APPROVED"
      ).length,
    [departmentSections]
  );

  const allDepartmentsApproved =
    departmentSections.length === 0 ||
    approvedDepartmentCount === departmentSections.length;

  const financeApprovalsComplete =
    countingLeaderApproval.status === "APPROVED" &&
    financeRepApproval.status === "APPROVED";

  const checklistReadyForFinalApproval =
    allDepartmentsApproved &&
    churchApproval.status === "APPROVED" &&
    financeApprovalsComplete;

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
        toBooleanValue(finalRecord.can_current_user_submit) ||
        toBooleanValue(finalRecord.canCurrentUserSubmit) ||
        user.user_category === "admin",
      canCurrentUserApprove:
        toBooleanValue(finalRecord.can_current_user_approve) ||
        toBooleanValue(finalRecord.canCurrentUserApprove),
      viewers,
    };
  }, [reportDetails, user.user_category]);

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

  const handleDepartmentApproval = async (department: DepartmentSection) => {
    if (!department.approval.canCurrentUserApprove) {
      showNotification(
        "Only the assigned head of department can approve this section.",
        "error"
      );
      return;
    }

    setApprovingDepartmentId(department.id);

    try {
      await api.post.approveEventReportDepartment({
        event_id: reportEventId,
        department_id: department.id,
        action: "APPROVE",
        event_date: effectiveReportDate,
      });

      showNotification("Department approved successfully.", "success");
      void refetchReportDetails(reportDetailsQuery);
    } catch {
      showNotification(
        "Department approval captured locally. Backend endpoint is pending.",
        "error"
      );
    } finally {
      setDepartmentApprovalOverrides((current) => ({
        ...current,
        [department.id]: buildApprovedState(false),
      }));
      setApprovingDepartmentId("");
    }
  };

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
        "All section approvals must be completed before final approval submission.",
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
            "Detailed records, approvals, and editable report data."}
          {activeReportViewTab === "Insight" &&
            "Visual analytics and trends for quick interpretation."}
        </p>
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-lightGray bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">Department Overview</h2>
          <span className="text-xs text-primaryGray">
            {approvedDepartmentCount}/{departmentSections.length} approved
          </span>
        </div>

        {departmentSections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-sm text-primaryGray">
            No departmental data found for this event.
          </p>
        ) : (
          <>
            {activeReportViewTab === "Insight" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className="rounded-lg border border-lightGray p-3 lg:col-span-2">
                  <p className="text-sm font-medium text-primary">
                    Members Present by Department
                  </p>
                  <div className="mt-3 h-72">
                    <Bar
                      data={{
                        labels: departmentPresenceSeries.labels,
                        datasets: [
                          {
                            label: "Members Present",
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
                    Department Approval Status
                  </p>
                  <div className="mt-3 h-72">
                    <Doughnut
                      data={{
                        labels: ["Approved", "Pending", "Rejected"],
                        datasets: [
                          {
                            data: [
                              departmentApprovalBreakdown.approved,
                              departmentApprovalBreakdown.pending,
                              departmentApprovalBreakdown.rejected,
                            ],
                            backgroundColor: ["#16A34A", "#F59E0B", "#DC2626"],
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
              <div className="space-y-3">
                {departmentSections.map((department) => {
                  const isOpen = openDepartments[department.id] ?? false;
                  const isDepartmentApprovalLoading =
                    approvingDepartmentId === department.id;

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
                            {department.attendees.length} member
                            {department.attendees.length === 1 ? "" : "s"} present
                          </p>
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
                                  Arrival Time
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {department.attendees.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={2}
                                    className="px-4 py-4 text-primaryGray"
                                  >
                                    No attendance records found for this department.
                                  </td>
                                </tr>
                              ) : (
                                department.attendees.map((attendee) => (
                                  <tr key={attendee.id} className="border-t border-lightGray">
                                    <td className="px-4 py-3">{attendee.name}</td>
                                    <td className="px-4 py-3">{attendee.arrivalTime}</td>
                                  </tr>
                                ))
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${getApprovalBadgeClasses(
                                department.approval.status
                              )}`}
                            >
                              {statusLabelMap[department.approval.status]}
                            </span>
                            {department.approval.approvedAt && (
                              <span className="text-xs text-primaryGray">
                                {formatDateTime(department.approval.approvedAt)}
                              </span>
                            )}
                            {department.approval.approvedByName && (
                              <span className="text-xs text-primaryGray">
                                by {department.approval.approvedByName}
                              </span>
                            )}
                          </div>
                        </div>

                        {department.approval.status !== "APPROVED" &&
                          department.approval.canCurrentUserApprove && (
                            <Button
                              value="Approve"
                              variant="secondary"
                              onClick={() => handleDepartmentApproval(department)}
                              loading={isDepartmentApprovalLoading}
                            />
                          )}
                      </footer>
                    </article>
                  );
                })}
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
                    {
                      label: "Other",
                      data: churchCompositionSeries.other,
                      backgroundColor: "#0EA5E9",
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
            <p className="text-xs text-primaryGray">Visiting Pastors</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitingPastors)}
            </p>
          </div>
          <div className="rounded-lg border border-lightGray p-3">
            <p className="text-xs text-primaryGray">Visitors</p>
            <p className="text-base font-semibold text-primary">
              {countFormatter.format(attendanceTotals.visitors)}
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
            <p className="text-xs text-primaryGray">Department Approvals</p>
            <p className="font-semibold text-primary">
              {approvedDepartmentCount}/{departmentSections.length} approved
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
              Complete all section approvals before final approval can proceed.
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
