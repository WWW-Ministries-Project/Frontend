import type {
  DeptReportDetail,
  DeptReportList,
  ExecutiveSummary,
} from "./reports/interfaces";
import type {
  AssetHistoryResponse,
  AssetOverviewResponse,
  StockCheckListResponse,
  StockCheckResponse,
} from "./assets/interfaces";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { ApiResponse, QueryType } from "../interfaces";
import type {
  AssignableUser,
  UserBranchAccess,
} from "./settings/accessLevelAssignmentInterfaces";
import { ApiExecution } from "./apiConstructor";
import { downloadFile, fetchData } from "./apiFunctions";
import type {
  CommunityAdminPost,
  CommunityAdminStats,
  CommunityAuditLogEntry,
  CommunityBlock,
  CommunityDepartment,
  CommunityMe,
  CommunityModerationItem,
  CommunityNotification,
  CommunityPerson,
  CommunityPost,
  CommunityPostDetail,
  CommunityReactor,
} from "./community/interfaces";
import type {
  AdminRideCatalog,
  AdminRideOverview,
  MyRide,
  RideBlock,
  RideCatalog,
  RideReport,
  RideSearchResult,
} from "./rides/interfaces";
import type { DownloadedFile } from "./eventReports/interfaces";
import type {
  RequisitionAnalyticsResponse,
  RequisitionOverviewDetail,
  RequisitionOverviewResponse,
} from "./requisitions/interfaces";
import type { Promotion } from "./promotions/interfaces";
import type { AnnualTheme } from "./theme/interfaces";
import type { GuestType, MembershipRequestRow, PagedItems } from "./guests/interfaces";
import type { Sermon, SermonSeries, SermonTag } from "./sermons/interfaces";
import type {
  MyPledgeRow,
  PledgeDetail,
  PledgeFeePreview,
  PledgeListRow,
  PledgePayment,
} from "./pledges/interface";
import {
  BiometricAttendanceImportJob,
  BiometricEventAttendanceListResponse,
  EventReminderRow,
  EventResponseType,
  EventType,
} from "./events/interfaces";
import {
  LifeCenterDetailsType,
  LifeCenterOverview,
  LifeCenterRole,
  LifeCenterMemberType,
  LifeCenterStatsType,
  LifeCenterType,
  SoulWonListType,
  MeetingType,
  EligibleFirstTimerType,
  MeetingExportQuery,
} from "./lifeCenter/interfaces";
import type {
  IMarket,
  IOrderDetail,
  IDeliveryConfig,
  IMarketplaceOverview,
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
  SomProgramFull,
  CohortSchedule,
  ProgramGrading,
  ProgramModulesResponse,
  BankQuestion,
  Gradebook,
  GradingSubmission,
  ProgramCertificates,
  Rubric,
  InstructorOverview,
  LibraryItem,
  LmsAnnouncement,
  LmsApplication,
  LmsReports,
  LearnerAnnouncement,
  LearnerEnrollment,
  LearnerSession,
  LearnerSubmission,
  LmsSession,
  ProgramInstructor,
  SessionAttendance,
} from "./ministrySchool/interfaces";
import { DepartmentDetailsType, DepartmentType } from "./settings/departmentInterfaces";
import type {
  JoinRequestRow,
  OpenDepartmentToJoin,
} from "./departmentJoinRequests/interfaces";
import { Branch, BranchDeleteImpact } from "./settings/branchInterfaces";
import type { AttendanceTimingSettingsConfig } from "./settings/attendanceTimingInterfaces";
import type { EventReportExclusionsConfig } from "./settings/eventReportExclusionInterfaces";
import type { ReportConfig } from "./settings/reportConfigInterfaces";
import type { VisitorFollowUpConfig } from "./settings/visitorFollowUpInterfaces";
import type { RoleEligibilityConfig } from "./settings/eligibilityInterfaces";
import type {
  SystemNotificationAdminCandidate,
  SystemNotificationSettingsConfig,
} from "./settings/systemNotificationInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import {
  RawFollowUpType,
  RawVisitType,
  VisitorDetailsType,
  VisitorType,
} from "./visitors/interfaces";
import {
  Appointment,
  AppointmentBookingsQuery,
  AppointmentReason,
  AppointmentSettings,
  StaffAvailability,
  StaffAvailabilityStatusResponse,
} from "./appointment/interfaces";
import type {
  AiChatbotConfig,
  AiCredentialRecord,
  AiUsageHistoryResponse,
  AiUsageSummary,
} from "./ai/interfaces";
import type { AiTasksResponse } from "./ai/tasksInterfaces";
import type { AiPreferences } from "./ai/preferencesInterfaces";
import type {
  AvailableGivingOption,
  FinanceApprovalConfig,
  FinanceAutoAmounts,
  FinanceData,
  FinancialRecord,
  GivingContribution,
  GivingContributionQuery,
  GivingFeePreview,
  GivingOption,
  PaystackBank,
  ResolvedBankAccount,
} from "./finance/interface";
import type {
  ApprovalConfig,
  RequisitionSimilarItemsResponse,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import type {
  InAppNotification,
  NotificationListPayload,
  NotificationPreference,
  NotificationPushPublicKeyPayload,
  NotificationUnreadCountPayload,
} from "./notifications/interfaces";
import type {
  EventReportDetail,
  EventReportEligibleEvent,
  EventReportOverviewItem,
} from "./eventReports/interfaces";

import type {
  MessageDispatch,
  MessageRecipient,
  MessageTemplate,
  MessagingOverview,
  MessagingSettings,
  PlaceholderInfo,
  TemplateStats,
  UpcomingBirthday,
} from "./messaging/interfaces";

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

  fetchUserStats = (query?: QueryType): Promise<ApiResponse<UserStatsType>> => {
    return this.fetchFromApi("user/stats-users", query);
  };

  // Visit Management
  fetchAllVisitors = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorType[]>> => {
    return this.fetchFromApi("visitor/visitors", query);
  };

  // Guests who joined from the mobile app (Visitors > Guests).
  fetchGuests = (query?: QueryType): Promise<ApiResponse<PagedItems<GuestType>>> => {
    return this.fetchFromApi("user/guests", query);
  };

  // Guest-to-membership requests (Membership management).
  fetchMembershipRequests = (
    query?: QueryType
  ): Promise<ApiResponse<PagedItems<MembershipRequestRow>>> => {
    return this.fetchFromApi("user/membership-requests", query);
  };

  fetchVisitorById = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorDetailsType>> => {
    return this.fetchFromApi(`visitor/visitor`, query);
  };

  // Every visit / follow-up row the user can see (not branch scoped, no pagination).
  fetchVisitorVisits = (query?: QueryType): Promise<ApiResponse<RawVisitType[]>> => {
    return this.fetchFromApi("visitor/visits", query);
  };

  fetchVisitorFollowUps = (
    query?: QueryType
  ): Promise<ApiResponse<RawFollowUpType[]>> => {
    return this.fetchFromApi("visitor/followups", query);
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

  fetchEventOptions = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType[]>> => {
    return this.fetchFromApi("event/list-events-light", query);
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

  /** Reminder rows for one occurrence. Query: { event_id } */
  fetchEventReminders = (
    query?: QueryType
  ): Promise<ApiResponse<EventReminderRow[]>> => {
    return this.fetchFromApi("event/reminders", query);
  };

  fetchPublicEventById = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType>> => {
    return this.fetchFromApi("event/public-event", query);
  };

  fetchEligibleEventReports = (
    query?: QueryType
  ): Promise<ApiResponse<EventReportEligibleEvent[]>> => {
    return this.fetchFromApi("event-reports/eligible-events", query);
  };

  fetchEventReportsOverview = (
    query?: QueryType
  ): Promise<ApiResponse<EventReportOverviewItem[]>> => {
    return this.fetchFromApi("event-reports/overview", query);
  };

  fetchEventReportDetails = (
    query?: QueryType
  ): Promise<ApiResponse<EventReportDetail | null>> => {
    return this.fetchFromApi("event-reports/get-report", query);
  };

  // Department reports and executive summary
  fetchDepartmentReports = (query?: QueryType): Promise<ApiResponse<DeptReportList>> => {
    return this.fetchFromApi("department-reports/list", query);
  };

  fetchDepartmentReport = (query?: QueryType): Promise<ApiResponse<DeptReportDetail>> => {
    return this.fetchFromApi("department-reports/report", query);
  };

  fetchExecutiveSummary = (query?: QueryType): Promise<ApiResponse<ExecutiveSummary>> => {
    return this.fetchFromApi("department-reports/executive-summary", query);
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

  fetchBranches = (query?: QueryType): Promise<ApiResponse<Branch[]>> => {
    return this.fetchFromApi("branch/list-branches", query);
  };

  fetchBranchDeleteImpact = (
    query: QueryType
  ): Promise<ApiResponse<BranchDeleteImpact>> => {
    return this.fetchFromApi("branch/delete-impact", query);
  };

  fetchDepartmentDetails = (
    query?: QueryType
  ): Promise<ApiResponse<DepartmentDetailsType | null>> => {
    return this.fetchFromApi("department/get-department", query);
  };

  // Department join requests
  fetchOpenDepartmentsToJoin = (
    query?: QueryType
  ): Promise<ApiResponse<OpenDepartmentToJoin[]>> => {
    return this.fetchFromApi(
      "department-join-request/open-departments",
      query
    );
  };

  fetchJoinRequests = (
    query?: QueryType
  ): Promise<ApiResponse<JoinRequestRow[]>> => {
    return this.fetchFromApi("department-join-request/list", query);
  };

  // Asset Management
  fetchAssetOverview = (query?: QueryType): Promise<ApiResponse<AssetOverviewResponse>> => {
    return this.fetchFromApi("assets/overview", query);
  };
  fetchAssetHistory = (query?: QueryType): Promise<ApiResponse<AssetHistoryResponse>> => {
    return this.fetchFromApi("assets/history", query);
  };
  fetchStockChecks = (query?: QueryType): Promise<ApiResponse<StockCheckListResponse>> => {
    return this.fetchFromApi("assets/stock-checks", query);
  };
  fetchStockCheckDetail = (query?: QueryType): Promise<ApiResponse<StockCheckResponse>> => {
    return this.fetchFromApi("assets/stock-checks/detail", query);
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
  /** Admin accounts with their branch roles. `include_inactive: "true"` adds deactivated ones. */
  fetchAssignableUsers = (
    query?: QueryType
  ): Promise<ApiResponse<AssignableUser[]>> => {
    return this.fetchFromApi("access/assignable-users", query);
  };
  /** A user's role in each branch. */
  fetchUserBranchAccess = (
    query?: QueryType
  ): Promise<ApiResponse<UserBranchAccess>> => {
    return this.fetchFromApi("access/user-branch-access", query);
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

  /** query.scope: "mine" (incl. drafts) or "all" (submitted, viewer-scoped). */
  fetchRequisitionOverview = (
    query?: QueryType
  ): Promise<ApiResponse<RequisitionOverviewResponse>> => {
    return this.fetchFromApi("requisitions/overview", query);
  };

  fetchRequisitionOverviewDetail = (
    query?: QueryType
  ): Promise<ApiResponse<RequisitionOverviewDetail>> => {
    return this.fetchFromApi("requisitions/overview-detail", query);
  };

  fetchRequisitionAnalytics = (
    query?: QueryType
  ): Promise<ApiResponse<RequisitionAnalyticsResponse>> => {
    return this.fetchFromApi("requisitions/analytics", query);
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

  fetchEventReportExclusions = (): Promise<
    ApiResponse<EventReportExclusionsConfig>
  > => {
    return this.fetchFromApi("settings/event-report-exclusions");
  };

  fetchReportConfig = (): Promise<ApiResponse<ReportConfig>> => {
    return this.fetchFromApi("settings/report-config");
  };

  fetchVisitorFollowUpConfig = (): Promise<
    ApiResponse<VisitorFollowUpConfig>
  > => {
    return this.fetchFromApi("settings/visitor-follow-up-config");
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

  /** Programs with cohorts, classes, instructors, enrollments and completion. Not branch-scoped server-side. */
  fetchProgramsFullDetails = (
    query?: QueryType
  ): Promise<ApiResponse<SomProgramFull[]>> => {
    return this.fetchFromApi("program/programs-full-details", query);
  };

  fetchProgramModules = (query?: QueryType): Promise<ApiResponse<ProgramModulesResponse>> => {
    return this.fetchFromApi("program/modules", query);
  };

  fetchProgramGrading = (query?: QueryType): Promise<ApiResponse<ProgramGrading>> => {
    return this.fetchFromApi("program/grading", query);
  };

  fetchCohortSchedule = (query?: QueryType): Promise<ApiResponse<CohortSchedule>> => {
    return this.fetchFromApi("program/cohort-schedule", query);
  };

  fetchQuestionBank = (query?: QueryType): Promise<ApiResponse<BankQuestion[]>> => {
    return this.fetchFromApi("program/question-bank", query);
  };

  fetchRubrics = (query?: QueryType): Promise<ApiResponse<Rubric[]>> => {
    return this.fetchFromApi("program/rubrics", query);
  };

  fetchGradebook = (query?: QueryType): Promise<ApiResponse<Gradebook>> => {
    return this.fetchFromApi("program/gradebook", query);
  };

  fetchGradingSubmission = (query?: QueryType): Promise<ApiResponse<GradingSubmission>> => {
    return this.fetchFromApi("program/submission", query);
  };

  fetchProgramCertificates = (query?: QueryType): Promise<ApiResponse<ProgramCertificates>> => {
    return this.fetchFromApi("program/certificates", query);
  };

  /** Server-rendered certificate PDF (same design learners download). */
  downloadCertificatePdf = (certificateNumber: string): Promise<DownloadedFile> => {
    return downloadFile(
      this.apiExecution.baseUrl,
      "program/certificate/pdf",
      { certificateNumber },
      `${certificateNumber}.pdf`
    );
  };

  fetchLmsSessions = (query?: QueryType): Promise<ApiResponse<LmsSession[]>> => {
    return this.fetchFromApi("program/sessions", query);
  };

  fetchSessionAttendance = (query?: QueryType): Promise<ApiResponse<SessionAttendance>> => {
    return this.fetchFromApi("program/session-attendance", query);
  };

  fetchCohortAnnouncements = (query?: QueryType): Promise<ApiResponse<LmsAnnouncement[]>> => {
    return this.fetchFromApi("program/announcements", query);
  };

  fetchLmsApplications = (query?: QueryType): Promise<ApiResponse<LmsApplication[]>> => {
    return this.fetchFromApi("program/applications", query);
  };

  fetchApplyEligibility = (
    query?: QueryType
  ): Promise<ApiResponse<{ eligible: boolean; alreadyEnrolled: boolean; reasons: string[] }>> => {
    return this.fetchFromApi("program/apply/eligibility", query);
  };

  fetchProgramInstructors = (query?: QueryType): Promise<ApiResponse<ProgramInstructor[]>> => {
    return this.fetchFromApi("program/program-instructors", query);
  };

  fetchInstructorsOverview = (query?: QueryType): Promise<ApiResponse<InstructorOverview[]>> => {
    return this.fetchFromApi("program/instructors-overview", query);
  };

  fetchContentLibrary = (query?: QueryType): Promise<ApiResponse<LibraryItem[]>> => {
    return this.fetchFromApi("program/library", query);
  };

  fetchLmsReports = (query?: QueryType): Promise<ApiResponse<LmsReports>> => {
    return this.fetchFromApi("program/lms-reports", query);
  };

  // Learner portal: the signed-in member's own enrollments only.
  fetchLearnerOverview = (query?: QueryType): Promise<ApiResponse<LearnerEnrollment[]>> => {
    return this.fetchFromApi("program/learner/overview", query);
  };

  fetchLearnerSessions = (query?: QueryType): Promise<ApiResponse<LearnerSession[]>> => {
    return this.fetchFromApi("program/learner/sessions", query);
  };

  fetchLearnerAnnouncements = (query?: QueryType): Promise<ApiResponse<LearnerAnnouncement[]>> => {
    return this.fetchFromApi("program/learner/announcements", query);
  };

  fetchLearnerSubmission = (query?: QueryType): Promise<ApiResponse<LearnerSubmission>> => {
    return this.fetchFromApi("program/learner/submission", query);
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

  /** Centers, roles, and the meetings/souls in `from`–`to`, for the list and analytics pages. */
  fetchLifeCenterOverview = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterOverview>> => {
    return this.fetchFromApi(`lifecenter/overview`, query);
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
  ): Promise<ApiResponse<LifeCenterRole[]>> => {
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

  fetchMeetings = (
    query?: QueryType
  ): Promise<ApiResponse<MeetingType[]>> => {
    return this.fetchFromApi(`lifecenter/meetings`, query);
  };

  fetchMeetingById = (
    query?: QueryType
  ): Promise<ApiResponse<MeetingType>> => {
    return this.fetchFromApi(`lifecenter/meeting`, query);
  };

  downloadLifeCenterMeetings = ({
    lifeCenterId,
    format,
    from,
    to,
  }: MeetingExportQuery): Promise<DownloadedFile> => {
    return downloadFile(
      this.apiExecution.baseUrl,
      "lifecenter/meetings/export",
      { lifeCenterId, format, ...(from ? { from } : {}), ...(to ? { to } : {}) },
      `life-center-meetings.${format}`
    );
  };

  fetchEligibleFirstTimers = (
    query?: QueryType
  ): Promise<ApiResponse<EligibleFirstTimerType[]>> => {
    return this.fetchFromApi(`lifecenter/soulswon-eligible-first-timers`, query);
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

  fetchOrderById = (
    query?: QueryType
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.fetchFromApi(`orders/get-order-by-id`, query);
  };

  fetchDeliveryConfig = (
    query?: QueryType
  ): Promise<ApiResponse<IDeliveryConfig>> => {
    return this.fetchFromApi(`orders/delivery-config`, query);
  };

  fetchMarketplaceOverview = (
    query?: QueryType
  ): Promise<ApiResponse<IMarketplaceOverview>> => {
    return this.fetchFromApi(`orders/marketplace-overview`, query);
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

  // `appointment/availability/status` is scoped by `can_view_appointments_scoped`:
  // members without the global "view appointments" permission get back only
  // their *own* ("own"-scoped) availability, which is always empty since
  // they aren't staff — so a member's booking form "Who" list reads empty.
  // `appointment/availability/booking-options` is the unscoped (protect-only)
  // counterpart the mobile app uses for exactly this — same payload shape,
  // full staff list. Use this for any self-service (member-facing) booking UI.
  fetchAppointmentBookingOptions = (
    query?: QueryType
  ): Promise<ApiResponse<StaffAvailabilityStatusResponse>> => {
    return this.fetchFromApi("appointment/availability/booking-options", query);
  };

  // Active booking reasons, ordered — any signed-in user (member booking form).
  fetchAppointmentReasons = (
    query?: QueryType
  ): Promise<ApiResponse<AppointmentReason[]>> => {
    return this.fetchFromApi("appointment/reasons", query);
  };

  // Every booking reason incl. inactive — Appointments manage permission.
  fetchManageAppointmentReasons = (
    query?: QueryType
  ): Promise<ApiResponse<AppointmentReason[]>> => {
    return this.fetchFromApi("appointment/reasons/manage", query);
  };

  fetchAppointmentBookings = (
    query?: AppointmentBookingsQuery
  ): Promise<ApiResponse<Appointment[]>> => {
    return this.fetchFromApi("appointment/bookings", query);
  };

  // Booking rules and the notification matrix — Appointments view permission.
  fetchAppointmentSettings = (
    query?: QueryType
  ): Promise<ApiResponse<AppointmentSettings>> => {
    return this.fetchFromApi("appointment/settings", query);
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
  ): Promise<ApiResponse<AnnualTheme[]>> => {
    return this.fetchFromApi("theme/get-themes", query);
  }

  // fetch active annual theme
  fetchActiveAnnualTheme = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("theme/get-active-theme", query);
  }

  // Community (members' feed)
  fetchCommunityMe = (): Promise<ApiResponse<CommunityMe>> => {
    return this.fetchFromApi("community/me");
  };

  /** Query: filter (all|prayer|testimony|discussion|department), departmentId, skip, take. */
  fetchCommunityFeed = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityPost[]>> => {
    return this.fetchFromApi("community/feed", query);
  };

  fetchCommunityDepartments = (): Promise<
    ApiResponse<CommunityDepartment[]>
  > => {
    return this.fetchFromApi("community/departments");
  };

  fetchCommunityPost = (
    id: number
  ): Promise<ApiResponse<CommunityPostDetail>> => {
    return this.fetchFromApi(`community/posts/${id}`);
  };

  fetchCommunityPostReactions = (
    id: number
  ): Promise<ApiResponse<CommunityReactor[]>> => {
    return this.fetchFromApi(`community/posts/${id}/reactions`);
  };

  fetchCommunityCommentReactions = (
    id: number
  ): Promise<ApiResponse<CommunityReactor[]>> => {
    return this.fetchFromApi(`community/comments/${id}/reactions`);
  };

  fetchCommunityBlocks = (): Promise<ApiResponse<CommunityBlock[]>> => {
    return this.fetchFromApi("community/blocks");
  };

  /** Query: q (min 1 char), take (<= 20). */
  searchCommunityMembers = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityPerson[]>> => {
    return this.fetchFromApi("community/members", query);
  };

  /** Query: skip, take. Unread count comes from `fetchCommunityMe`. */
  fetchCommunityNotifications = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityNotification[]>> => {
    return this.fetchFromApi("community/notifications", query);
  };

  /** Query: status (PENDING|REMOVED|RESTORED|ALL, default PENDING). */
  fetchCommunityModerationReports = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityModerationItem[]>> => {
    return this.fetchFromApi("community/moderation/reports", query);
  };

  /** Query: type, status, q, skip, take. */
  fetchCommunityAdminPosts = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityAdminPost[]>> => {
    return this.fetchFromApi("community/admin/posts", query);
  };

  /** Query: skip, take. */
  fetchCommunityAuditLog = (
    query?: QueryType
  ): Promise<ApiResponse<CommunityAuditLogEntry[]>> => {
    return this.fetchFromApi("community/moderation/audit-log", query);
  };

  /** KPI tiles on the admin Community page. */
  fetchCommunityAdminStats = (): Promise<ApiResponse<CommunityAdminStats>> => {
    return this.fetchFromApi("community/admin/stats");
  };

  // Promotions (mobile Home banners)
  fetchPromotions = (
    query?: QueryType
  ): Promise<ApiResponse<Promotion[]>> => {
    return this.fetchFromApi("promotions", query);
  };

  // Messaging
  fetchMessageTemplates = (): Promise<ApiResponse<MessageTemplate[]>> => {
    return this.fetchFromApi("messaging/templates");
  };

  fetchMessagingSettings = (): Promise<ApiResponse<MessagingSettings>> => {
    return this.fetchFromApi("messaging/settings");
  };

  fetchMessagePlaceholders = (
    query?: QueryType
  ): Promise<ApiResponse<PlaceholderInfo[]>> => {
    return this.fetchFromApi("messaging/placeholders", query);
  };

  fetchUpcomingBirthdays = (
    query?: QueryType
  ): Promise<ApiResponse<UpcomingBirthday[]>> => {
    return this.fetchFromApi("messaging/birthdays/upcoming", query);
  };

  fetchMessagingStats = (
    query?: QueryType
  ): Promise<ApiResponse<TemplateStats>> => {
    return this.fetchFromApi("messaging/stats", query);
  };

  /** KPI tiles on the admin Messaging page (one-off messages only). */
  fetchMessagingOverview = (
    query?: QueryType
  ): Promise<ApiResponse<MessagingOverview>> => {
    return this.fetchFromApi("messaging/overview", query);
  };

  /** Query: page, limit, kind, filter (all | scheduled | sent | failed).
   *  Counts per filter come back in `meta.status_counts`. */
  fetchMessageDispatches = (
    query?: QueryType
  ): Promise<ApiResponse<MessageDispatch[]>> => {
    return this.fetchFromApi("messaging/dispatches", query);
  };

  fetchMessageRecipients = (
    id: number,
    query?: QueryType
  ): Promise<ApiResponse<MessageRecipient[]>> => {
    return this.fetchFromApi(`messaging/dispatches/${id}/recipients`, query);
  };

  fetchPromotion = (
    id: number
  ): Promise<ApiResponse<Promotion>> => {
    return this.fetchFromApi(`promotions/${id}`);
  };

  // Sermons
  fetchSermons = (query?: QueryType): Promise<ApiResponse<Sermon[]>> => {
    return this.fetchFromApi("sermons", query);
  };

  fetchOneSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.fetchFromApi(`sermons/${id}`);
  };

  fetchSermonSeries = (
    query?: QueryType
  ): Promise<ApiResponse<SermonSeries[]>> => {
    return this.fetchFromApi("sermons/series", query);
  };

  fetchOneSermonSeries = (id: number): Promise<ApiResponse<SermonSeries>> => {
    return this.fetchFromApi(`sermons/series/${id}`);
  };

  fetchSermonTags = (query?: QueryType): Promise<ApiResponse<SermonTag[]>> => {
    return this.fetchFromApi("sermons/tags", query);
  };

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

  // fetch giving options
  fetchGivingOptions = (
    query?: QueryType
  ): Promise<ApiResponse<GivingOption[]>> => {
    return this.fetchFromApi("givingoption/get-giving-options", query);
  };

  // fetch a single giving option
  fetchGivingOption = (
    query?: QueryType
  ): Promise<ApiResponse<GivingOption>> => {
    return this.fetchFromApi(`givingoption/${query?.id ?? ""}`);
  };

  // giving options the caller may give to (member portal) — no permission needed
  fetchAvailableGivingOptions = (): Promise<
    ApiResponse<AvailableGivingOption[]>
  > => {
    return this.fetchFromApi("givingoption/available");
  };

  // what a donation of `amount` (minor units) will cost the donor
  fetchGivingFeePreview = (
    query?: QueryType
  ): Promise<ApiResponse<GivingFeePreview>> => {
    return this.fetchFromApi("givingoption/fee-preview", query);
  };

  // the caller's own giving history
  fetchMyContributions = (
    query?: QueryType
  ): Promise<ApiResponse<GivingContribution[]>> => {
    return this.fetchFromApi("givingoption/my-contributions", query);
  };

  // settle-and-read a contribution the donor has just returned from paying
  verifyGivingContribution = (
    reference: string
  ): Promise<ApiResponse<GivingContribution | null>> => {
    return this.fetchFromApi(
      `givingoption/verify/${encodeURIComponent(reference)}`
    );
  };

  // fetch giving contributions (admin view)
  fetchGivingContributions = (
    query?: GivingContributionQuery
  ): Promise<ApiResponse<GivingContribution[]>> => {
    return this.fetchFromApi("givingoption/contributions", query);
  };

  // fetch Paystack banks and mobile money providers (proxied server-side)
  fetchPaystackBanks = (
    query?: QueryType
  ): Promise<ApiResponse<PaystackBank[]>> => {
    return this.fetchFromApi("givingoption/banks", query);
  };

  // best-effort account name lookup; data is null when Paystack cannot resolve it
  resolveBankAccount = (
    query?: QueryType
  ): Promise<ApiResponse<ResolvedBankAccount | null>> => {
    return this.fetchFromApi("givingoption/resolve-account", query);
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

  // fetch pledges
  fetchPledges = (
    query?: QueryType
  ): Promise<ApiResponse<PledgeListRow[]>> => {
    return this.fetchFromApi("pledges/get-pledges", query);
  };

  // fetch single pledge
  fetchPledge = (
    query?: QueryType
  ): Promise<ApiResponse<PledgeDetail>> => {
    return this.fetchFromApi("pledges/get-pledge", query);
  };

  // the caller's own pledges (member portal) — no permission needed
  fetchMyPledges = (): Promise<ApiResponse<MyPledgeRow[]>> => {
    return this.fetchFromApi("pledges/my-pledges");
  };

  // what a pledge payment of `amount` (minor units) will cost the payer
  fetchPledgeFeePreview = (
    query?: QueryType
  ): Promise<ApiResponse<PledgeFeePreview>> => {
    return this.fetchFromApi("pledges/payment-fee-preview", query);
  };

  // the caller's own pledge payment history
  fetchMyPledgePayments = (
    query?: QueryType
  ): Promise<ApiResponse<PledgePayment[]>> => {
    return this.fetchFromApi("pledges/my-pledge-payments", query);
  };

  // settle-and-read a pledge payment the member has just returned from paying
  verifyPledgePayment = (
    reference: string
  ): Promise<ApiResponse<PledgePayment | null>> => {
    return this.fetchFromApi(
      `pledges/verify-payment/${encodeURIComponent(reference)}`
    );
  };

  // every online payment against one pledge (finance staff)
  fetchPledgePayments = (
    query?: QueryType
  ): Promise<ApiResponse<PledgePayment[]>> => {
    return this.fetchFromApi("pledges/pledge-payments", query);
  };

  // online giving and pledges redeemed for one week. Query: { from, to }
  fetchFinanceAutoAmounts = (
    query?: QueryType
  ): Promise<ApiResponse<FinanceAutoAmounts>> => {
    return this.fetchFromApi("financials/auto-amounts", query);
  };

  fetchFinanceApprovalConfig = (
    query?: QueryType
  ): Promise<ApiResponse<FinanceApprovalConfig>> => {
    return this.fetchFromApi("financials/get-approval-config", query);
  };

  fetchAiCredentials = (
    query?: QueryType
  ): Promise<ApiResponse<AiCredentialRecord[]>> => {
    return this.fetchFromApi("ai/credentials", query);
  };

  fetchAiChatbotConfig = (): Promise<ApiResponse<AiChatbotConfig>> => {
    return this.fetchFromApi("ai/chatbot/config");
  };

  // Assistant "For you" task feed (branch-scoped via buildBranchQuery).
  fetchAiTasks = (
    query?: QueryType
  ): Promise<ApiResponse<AiTasksResponse>> => {
    return this.fetchFromApi("ai/tasks", query);
  };

  // Per-user assistant reminder preferences.
  fetchAiPreferences = (): Promise<ApiResponse<AiPreferences>> => {
    return this.fetchFromApi("ai/preferences");
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

  // Ride to church (members)
  // `eventId` is optional throughout: without it the server picks the
  // soonest upcoming event (for My ride, the soonest one the member rides to).
  fetchRideCatalog = (
    eventId?: number | null
  ): Promise<ApiResponse<RideCatalog>> => {
    return this.fetchFromApi(
      "rides/catalog",
      eventId ? { event_id: eventId } : undefined
    );
  };

  fetchMyRide = (eventId?: number | null): Promise<ApiResponse<MyRide>> => {
    return this.fetchFromApi(
      "rides/mine",
      eventId ? { event_id: eventId } : undefined
    );
  };

  searchRides = (
    pickupPointId: number,
    eventId?: number | null
  ): Promise<ApiResponse<RideSearchResult>> => {
    return this.fetchFromApi("rides/search", {
      pickup_point_id: pickupPointId,
      ...(eventId ? { event_id: eventId } : {}),
    });
  };

  // Ride to church (safety team / church office)
  /** Query: service_date (YYYY-MM-DD, defaults to the day of the soonest ride event). */
  fetchRideAdminOverview = (
    query?: QueryType
  ): Promise<ApiResponse<AdminRideOverview>> => {
    return this.fetchFromApi("rides/admin/overview", query);
  };

  /** Query: status (OPEN|RESOLVED|ALL, default OPEN). */
  fetchRideReports = (
    query?: QueryType
  ): Promise<ApiResponse<RideReport[]>> => {
    return this.fetchFromApi("rides/admin/reports", query);
  };

  fetchRideAdminCatalog = (): Promise<ApiResponse<AdminRideCatalog>> => {
    return this.fetchFromApi("rides/admin/catalog");
  };

  fetchRideBlocks = (): Promise<ApiResponse<RideBlock[]>> => {
    return this.fetchFromApi("rides/admin/blocks");
  };
}
