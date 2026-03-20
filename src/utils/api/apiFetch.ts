import { assetType } from "@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { fetchData } from "./apiFunctions";
import {
  BiometricAttendanceImportJob,
  BiometricEventAttendanceListResponse,
  EventResponseType,
  EventType,
} from "./events/interfaces";
import {
  LifeCenterDetailsType,
  LifeCenterMemberType,
  LifeCenterStatsType,
  LifeCenterType,
  SoulWonListType,
} from "./lifeCenter/interfaces";
import type {
  IMarket,
  IOrders,
  IProductType,
  IProductTypeResponse,
} from "./marketPlace/interface";
import { IFamilyInformationRaw, IMemberInfo, MembersType, UserStatsType } from "./members/interfaces";
import {
  CertificateData,
  CohortAssignment,
  DetailedCohortType,
  DetailedCourseType,
  EnrolledProgramResponse,
  EnrollmentDataType,
  ProgramResponse,
  Programs,
} from "./ministrySchool/interfaces";
import { DepartmentDetailsType, DepartmentType } from "./settings/departmentInterfaces";
import type { AttendanceTimingSettingsConfig } from "./settings/attendanceTimingInterfaces";
import type { RoleEligibilityConfig } from "./settings/eligibilityInterfaces";
import type {
  SystemNotificationAdminCandidate,
  SystemNotificationSettingsConfig,
} from "./settings/systemNotificationInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import { VisitorDetailsType, VisitorType } from "./visitors/interfaces";
import {
  Appointment,
  AppointmentBookingsQuery,
  StaffAvailability,
  StaffAvailabilityStatusResponse,
} from "./appointment/interfaces";
import type {
  AiCredentialRecord,
  AiUsageHistoryResponse,
  AiUsageSummary,
} from "./ai/interfaces";
import type { FinanceData, FinancialRecord } from "./finance/interface";
import type {
  ApprovalConfig,
  RequisitionSimilarItemsResponse,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import type {
  InAppNotification,
  NotificationListPayload,
  NotificationPreference,
  NotificationPushPublicKeyPayload,
  NotificationStreamTokenPayload,
  NotificationUnreadCountPayload,
} from "./notifications/interfaces";

export class ApiCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      fetchExecutor: fetchData,
    });
  }

  private fetchFromApi<T>(
    endpoint: string,
    query?: QueryType
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.fetchData(endpoint, query);
  }

  // Members Management
  fetchAllMembers = (
    query?: QueryType
  ): Promise<ApiResponse<MembersType[]>> => {
    return this.fetchFromApi("user/list-users", query);
  };
  fetchMembersForOptions = (
    query?: QueryType
  ): Promise<ApiResponse<MembersType[]>> => {
    return this.fetchFromApi("user/list-users-light", query);
  };

  fetchAMember = (query?: QueryType): Promise<ApiResponse<IMemberInfo>> => {
    return this.fetchFromApi("user/get-user", query);
  };

  fetchCurrentUser = (): Promise<ApiResponse<IMemberInfo>> => {
    return this.fetchFromApi("user/current-user");
  };

  fetchMemberFamily = (query?: QueryType): Promise<ApiResponse<IFamilyInformationRaw>> => {
    return this.fetchFromApi("user/get-user-family", query);
  };

  fetchUserStats = (): Promise<ApiResponse<UserStatsType>> => {
    return this.fetchFromApi("user/stats-users");
  };

  // Visit Management
  fetchAllVisitors = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorType[]>> => {
    return this.fetchFromApi("visitor/visitors", query);
  };

  fetchVisitorById = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorDetailsType>> => {
    return this.fetchFromApi(`visitor/visitor`, query);
  };

  fetchAllVisits = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("visit", query);
  };

  fetchVisitById = (id: string, query?: QueryType): Promise<unknown> => {
    return this.fetchFromApi(`visit/${id}`, query);
  };

  fetchAllVisitsByVisitorId = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`visitor/visit/visitor`, query);
  };
  // Event Management
  fetchEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType[]>> => {
    return this.fetchFromApi("event/list-events", query);
  };

  fetchUpcomingEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType[]>> => {
    return this.fetchFromApi("event/upcoming-events", query);
  };

  fetchEventById = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType>> => {
    return this.fetchFromApi("event/get-event", query);
  };

  fetchPublicEventById = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType>> => {
    return this.fetchFromApi("event/public-event", query);
  };

  fetchEventReportDetails = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("event-reports/get-report", query);
  };

  // Position Management
  fetchPositions = (
    query?: QueryType
  ): Promise<ApiResponse<PositionType[]>> => {
    return this.fetchFromApi("position/list-positions", query);
  };

  // Department Management
  fetchDepartments = (
    query?: QueryType
  ): Promise<ApiResponse<DepartmentType[]>> => {
    return this.fetchFromApi("department/list-departments", query);
  };

  fetchDepartmentDetails = (
    query?: QueryType
  ): Promise<ApiResponse<DepartmentDetailsType | null>> => {
    return this.fetchFromApi("department/get-department", query);
  };

  // Asset Management
  fetchAssets = (): Promise<ApiResponse<assetType[]>> => {
    return this.fetchFromApi("assets/list-assets");
  };
  fetchAnAsset = (query?: QueryType): Promise<ApiResponse<assetType>> => {
    return this.fetchFromApi("assets/get-asset", query);
  };

  // Access Levels
  fetchAccessLevels = (
    query?: QueryType
  ): Promise<ApiResponse<AccessRight[]>> => {
    return this.fetchFromApi("access/list-access-levels", query);
  };
  fetchAnAccess = (query?: QueryType): Promise<ApiResponse<AccessRight>> => {
    return this.fetchFromApi("access/get-access-level", query);
  };

  // Requisition Management
  fetchRequisitions = (
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("requisitions/list-requisition", query);
  };

  fetchRequisitionDetails = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("requisitions/get-requisition", query);
  };

  fetchMyRequests = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("requisitions/my-requisitions", query);
  };

  fetchRequisitionApprovalConfig = (query?: QueryType): Promise<
    ApiResponse<ApprovalConfig | ApprovalConfig[] | null>
  > => {
    return this.fetchFromApi("requisitions/get-approval-config", query);
  };

  fetchEventReportApprovalConfig = (query?: QueryType): Promise<
    ApiResponse<ApprovalConfig | ApprovalConfig[] | null>
  > => {
    return this.fetchFromApi("event-reports/get-approval-config", query);
  };

  fetchRoleEligibilityConfig = (): Promise<
    ApiResponse<RoleEligibilityConfig | null>
  > => {
    return this.fetchFromApi("settings/get-role-eligibility-config");
  };

  fetchAttendanceTimingConfig = (): Promise<
    ApiResponse<AttendanceTimingSettingsConfig>
  > => {
    return this.fetchFromApi("settings/attendance-timing-config");
  };

  fetchSystemNotificationConfig = (): Promise<
    ApiResponse<SystemNotificationSettingsConfig>
  > => {
    return this.fetchFromApi("settings/system-notification-config");
  };

  fetchSystemNotificationAdmins = (): Promise<
    ApiResponse<SystemNotificationAdminCandidate[]>
  > => {
    return this.fetchFromApi("settings/system-notification-admins");
  };

  fetchRequisitionPreApprovalSimilarItems = (
    query?: QueryType
  ): Promise<ApiResponse<RequisitionSimilarItemsResponse>> => {
    return this.fetchFromApi("requisitions/pre-approval-similar-items", query);
  };

  // In-app Notifications
  fetchNotifications = (
    query?: QueryType
  ): Promise<ApiResponse<InAppNotification[] | NotificationListPayload>> => {
    return this.fetchFromApi("notifications", query);
  };

  fetchNotificationsUnreadCount = (): Promise<
    ApiResponse<number | NotificationUnreadCountPayload>
  > => {
    return this.fetchFromApi("notifications/unread-count");
  };

  fetchNotificationsStreamToken = (): Promise<
    ApiResponse<string | NotificationStreamTokenPayload>
  > => {
    return this.fetchFromApi("notifications/stream-token");
  };

  fetchNotificationsPushPublicKey = (): Promise<
    ApiResponse<string | NotificationPushPublicKeyPayload>
  > => {
    return this.fetchFromApi("notifications/push/public-key");
  };

  fetchNotificationPreferences = (
    query?: QueryType
  ): Promise<ApiResponse<NotificationPreference[] | NotificationPreference>> => {
    return this.fetchFromApi("notifications/preferences", query);
  };

  // Program Management
  fetchAllPrograms = (
    query?: QueryType
  ): Promise<ApiResponse<ProgramResponse[]>> => {
    return this.fetchFromApi("program/programs", query);
  };

  fetchAllApplicablePrograms = (
    query?: QueryType
  ): Promise<ApiResponse<Programs[]>> => {
    return this.fetchFromApi("program/get-member-programs", query);
  };

  fetchProgramById = (
    query?: QueryType
  ): Promise<ApiResponse<ProgramResponse>> => {
    return this.fetchFromApi(`program/program`, query);
  };

  // Fetch user enrolled programs
  fetchUserEnrolledPrograms = (
    query?: QueryType
  ): Promise<ApiResponse<EnrolledProgramResponse[]>> => {
    return this.fetchFromApi("program/user-enrollment", query);
  };

  // @Jojo please the name is confusing
  fetchMembers = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/users", query);
  };

  fetchUserByEmailAndCohort = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("user/get-user-email", query);
  };

  // Cohort Management
  fetchAllCohorts = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/cohorts", query);
  };

  fetchCohortById = (
    query?: QueryType
  ): Promise<ApiResponse<DetailedCohortType>> => {
    return this.fetchFromApi(`program/cohort`, query);
  };

  fetchCohortsByProgramId = (
    programId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi(`program/program-cohorts/${programId}`, query);
  };

  // New method to fetch cohorts by program (query-based)
  fetchCohortsByProgram = (
    query?: QueryType
  ): Promise<ApiResponse<DetailedCohortType[]>> => {
    return this.fetchFromApi("program/get-cohorts-by-program", query);
  };

  // New method to fetch instructor programs
  fetchInstructorPrograms = (
    query?: QueryType
  ): Promise<ApiResponse<ProgramResponse[]>> => {
    return this.fetchFromApi("program/get-instructor-programs", query);
  };

  // Course Management
  fetchAllCourses = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/courses", query);
  };

  fetchCourseById = (
    query?: QueryType
  ): Promise<ApiResponse<DetailedCourseType>> => {
    return this.fetchFromApi(`program/course`, query);
  };

  fetchStudentById = (
    query?: QueryType
  ): Promise<ApiResponse<EnrollmentDataType>> => {
    return this.fetchFromApi(`program/progress`, query);
  };

  // Enrollment Management
  fetchEnrollmentsByCourse = (
    courseId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/course-enrollment", query);
  };

  fetchEnrollmentsByUser = (
    userId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/user-enrollment", query);
  };

  fetchEnrollmentsByUserId = (
    query?: QueryType
  ): Promise<ApiResponse<EnrollmentDataType>> => {
    return this.fetchFromApi(`program/my-enrollment`, query);
  };

  fetchMyProgram = (
    query?:QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/program-completion-status", query);
  };

  fetchProgramCertificate = (
    query?: QueryType
  ): Promise<ApiResponse<CertificateData>> => {
    return this.fetchFromApi("program/certificate", query);
  };

  fetchCertificateVerification = (
    query?: QueryType
  ): Promise<ApiResponse<CertificateData>> => {
    const certificateNumber = String(query?.certificateNumber ?? "").trim();
    return this.fetchFromApi(
      `program/certificate/verify/${encodeURIComponent(certificateNumber)}`
    );
  };

  // Check active assignment
  fetchIsActiveAssignment = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("program/is-assignment-active", query);
  };

  // get active assignment
  fetchCohortAssignments = (
    query?: QueryType
  ): Promise<ApiResponse<CohortAssignment[]>> => {
    return this.fetchFromApi("program/get-cohort-assigments", query);
  };

  // Assignment Results
  fetchAssignmentResults = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("program/assignment-results", query);
  };



  // Follow-Up Management
  fetchAllFollowUps = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("followup", query);
  };

  fetchFollowUpById = (
    id: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`followup/${id}`, query);
  };

  // Prayer Request Management
  fetchAllPrayerRequests = (
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("prayerrequest", query);
  };

  fetchPrayerRequestById = (
    id: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`prayerrequest/${id}`, query);
  };

  //life center
  fetchAllLifeCenters = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterType[]>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenters`, query);
  };

  fetchLifeCenterById = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterDetailsType>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenter/`, query);
  };

  fetchLifeCenterByUserId = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterDetailsType>> => {
    return this.fetchFromApi(`lifecenter/my-lifecenter/`, query);
  };

  fetchLifeCenterStats = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterStatsType[]>> => {
    return this.fetchFromApi(`lifecenter/stats`, query);
  };

  fetchAllUniqueEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventType[]>> => {
    return this.fetchFromApi(`event/get-event-types`, query);
  };

  fetchLifCenterRoles = (
    query?: QueryType
  ): Promise<ApiResponse<ILifeCernterRoles[]>> => {
    return this.fetchFromApi(`lifecenter/get-roles`, query);
  };

  fetchLifCenterMembers = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterMemberType[]>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenter-members`, query);
  };

  fetchSoulsWon = (
    query?: QueryType
  ): Promise<ApiResponse<SoulWonListType[]>> => {
    return this.fetchFromApi(`lifecenter/soulswon`, query);
  };

  fetchMarkets = (query?: QueryType): Promise<ApiResponse<IMarket[]>> => {
    return this.fetchFromApi(`market/list-markets`, query);
  };

  fetchMarketById = (query?: QueryType): Promise<ApiResponse<IMarket>> => {
    return this.fetchFromApi(`market/get-market-by-id/`, query);
  };

  fetchProductTypes = (
    query?: QueryType
  ): Promise<ApiResponse<IProductType[]>> => {
    return this.fetchFromApi(`product/list-product-type`, query);
  };

  fetchProductCategories = (
    query?: QueryType
  ): Promise<ApiResponse<IProductType[]>> => {
    return this.fetchFromApi(`product/list-product-category`, query);
  };

  fetchProductsByMarket = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse[]>> => {
    return this.fetchFromApi(`product/list-products-by-market/`, query);
  };

  fetchProductById = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse>> => {
    return this.fetchFromApi(`product/get-product-by-id/`, query);
  };

  fetchAllProducts = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse[]>> => {
    return this.fetchFromApi(`product/list-products`, query);
  };

  //orders
  verifyPayment = (query?: QueryType): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`orders/confirm-transaction-status/`, query);
  };

  fetchOrdersByMarket = (
    query?: QueryType
  ): Promise<ApiResponse<IOrders[]>> => {
    return this.fetchFromApi(`orders/get-orders-by-market/`, query);
  };

  fetchAllOrders = (query?: QueryType): Promise<ApiResponse<IOrders[]>> => {
    return this.fetchFromApi(`orders/get-all-orders`, query);
  };

  fetchOrdersByUser = (
    query?: QueryType
  ): Promise<ApiResponse<IOrders[]>> => {
    return this.fetchFromApi(`orders/get-orders-by-user/`, query);
  };

  // Fetch staff appointment availability
  fetchStaffAvailability = (
    query?: QueryType
  ): Promise<ApiResponse<StaffAvailability[]>> => {
    return this.fetchFromApi("appointment/availability", query);
  };

  fetchStaffAvailabilityStatus = (
    query?: QueryType
  ): Promise<ApiResponse<StaffAvailabilityStatusResponse>> => {
    return this.fetchFromApi("appointment/availability/status", query);
  };

  fetchAppointmentBookings = (
    query?: AppointmentBookingsQuery
  ): Promise<ApiResponse<Appointment[]>> => {
    return this.fetchFromApi("appointment/bookings", query);
  };

  // Fetch church attendance records
  fetchSingleChurchAttendance = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("event/church-attendance", query);
  };

  // fetch all church attendance records
  fetchChurchAttendance = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("event/church-attendance", query);
  }

  fetchBiometricAttendance = (
    query?: QueryType
  ): Promise<ApiResponse<BiometricEventAttendanceListResponse>> => {
    return this.fetchFromApi("event/biometric-attendance", query);
  };

  fetchBiometricAttendanceImportJob = (
    query?: QueryType
  ): Promise<ApiResponse<BiometricAttendanceImportJob>> => {
    return this.fetchFromApi("event/import-biometric-attendance-job", query);
  };

  // Fetch annual theme
  fetchAnnualTheme = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("theme/get-themes", query);
  }

  // fetch active annual theme
  fetchActiveAnnualTheme = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("theme/get-active-theme", query);
  }

  // fetch receipt config
  fetchReceiptConfig = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("receiptconfig/get-receipt-configs", query);
  }

  // fetch payment config
  fetchPaymentConfig = (
    query?: QueryType
): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("paymentconfig/get-payment-configs", query);
  };

  // fetch bank account config
  fetchBankAccountConfig = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("bankaccountconfig/get-bank-account-configs", query);
  };

  // fetch tithe breakdown config
  fetchTitheBreakdownConfig = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("tithebreakdownconfig/get-tithe-breakdown-configs", query);
  }

  // fetch financials
  fetchFinancials = (
    query?: QueryType
  ): Promise<ApiResponse<FinancialRecord[]>> => {
    return this.fetchFromApi("financials/get-financials", query);
  };

  // fetch single financial
  fetchFinancial = (
    query?: QueryType
  ): Promise<ApiResponse<FinancialRecord | FinancialRecord[] | FinanceData>> => {
    return this.fetchFromApi("financials/get-financial", query);
  };

  fetchAiCredentials = (
    query?: QueryType
  ): Promise<ApiResponse<AiCredentialRecord[]>> => {
    return this.fetchFromApi("ai/credentials", query);
  };

  // AI usage and quota tracking
  fetchAiUsageSummary = (
    query?: QueryType
  ): Promise<ApiResponse<AiUsageSummary>> => {
    return this.fetchFromApi("ai/usage-summary", query);
  };

  fetchAiUsageHistory = (
    query?: QueryType
  ): Promise<ApiResponse<AiUsageHistoryResponse>> => {
    return this.fetchFromApi("ai/usage-history", query);
  };


}
