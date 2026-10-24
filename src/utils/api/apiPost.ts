import type {
  DeptReportDetail,
  DeptReportSelector,
  EventReportSignOffPayload,
} from "./reports/interfaces";
import type { RequisitionReminderResponse } from "./requisitions/interfaces";
import type { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { postData } from "./apiFunctions";
import type {
  CommunityComment,
  CommunityCommentReactionType,
  CommunityModerationKind,
  CommunityPost,
  CommunityReactionSummary,
  CommunityReactionType,
  CreateCommunityBlockDto,
  CreateCommunityCommentDto,
  CreateCommunityPostDto,
  CreateCommunityReportDto,
} from "./community/interfaces";
import type {
  AdminRideArea,
  AdminRidePickupPoint,
  DeclineRequestDto,
  DriverRide,
  MyRide,
  PublishRideDto,
  RequestSeatDto,
  RideAlertDto,
  RideReportDto,
  SaveRideAreaDto,
  SaveRidePickupPointDto,
} from "./rides/interfaces";
import type { CreatePromotionDto, Promotion } from "./promotions/interfaces";
import type { AnnualTheme, AnnualThemePayload } from "./theme/interfaces";
import type {
  Sermon,
  SermonSeries,
  CreateSermonDto,
  CreateSermonSeriesDto,
} from "./sermons/interfaces";
import type {
  AssetSavePayload,
  AssetSnapshot,
  AssetStatusPayload,
  AssetStatusResponse,
  AssetRow,
  RepairRequisitionPayload,
  RepairRequisitionResponse,
  StockCheckResponse,
} from "./assets/interfaces";
import type {
  InitializePledgePaymentPayload,
  InitializePledgePaymentResult,
  PledgeDetail,
  PledgeMutationPayload,
  PledgePayment,
  PledgeRemindResult,
  PledgerInput,
  Redemption,
  RetryPledgePaymentPayload,
} from "./pledges/interface";
import {
  LeaderReminderReason,
  LifeCenterMemberPayload,
  LifeCenterSavePayload,
  LifeCenterType,
  MeetingPayload,
  MeetingType,
  SoulWonPayload,
} from "./lifeCenter/interfaces";
import {
  CohortPayloadType,
  BankQuestion,
  BankQuestionPayload,
  ExtensionPayload,
  ModulePayload,
  Rubric,
  RubricPayload,
  AnnouncementPayload,
  ApplyResult,
  InstructorAbilities,
  LibraryItem,
  LibraryItemPayload,
  LmsAnnouncement,
  LmsSession,
  ProgramInstructor,
  SessionPayload,
  ProgramModule,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import type {
  BulkUpdateMemberStatusPayload,
  BulkUpdateMemberStatusResponse,
  BulkUpdateUserStatusPayload,
  BulkUpdateUserStatusResponse,
} from "./members/interfaces";
import {
  CreateDepartmentPayload,
  DepartmentType,
} from "./settings/departmentInterfaces";
import type {
  BulkJoinRequestPayload,
  CreateJoinRequestPayload,
} from "./departmentJoinRequests/interfaces";
import type { Branch, BranchPayload } from "./settings/branchInterfaces";
import type {
  GiveAccessPayload,
  GiveAccessResult,
} from "./settings/accessLevelAssignmentInterfaces";
import type {
  AttendanceTimingSettingsConfig,
  AttendanceTimingSettingsPayload,
} from "./settings/attendanceTimingInterfaces";
import type {
  EventReportExclusionsConfig,
  EventReportExclusionsPayload,
} from "./settings/eventReportExclusionInterfaces";
import type { ReportConfig, ReportConfigPayload } from "./settings/reportConfigInterfaces";
import type {
  RoleEligibilityConfig,
  RoleEligibilityConfigPayload,
} from "./settings/eligibilityInterfaces";
import type {
  SystemNotificationSettingsConfig,
  SystemNotificationSettingsPayload,
} from "./settings/systemNotificationInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import type {
  FollowUpPayloadType,
  VisitPayloadType,
} from "./visitors/interfaces";
import {
  BiometricAttendanceImportPayload,
  BiometricAttendanceImportStartResponse,
  EventReminderRow,
  EventType,
  PublicEventRegistrationPayload,
  ValidateEventMemberPayload,
  ValidatedEventMember,
} from "./events/interfaces";
import type {
  IMarket,
  IProductType,
  IProduct,
  ICheckOut,
  CheckOutResponse,
  RetryOrderPaymentPayload,
  ICreateOrderForMemberPayload,
  IOrderDetail,
} from "./marketPlace/interface";
import {
  Appointment,
  AppointmentActionPayload,
  AppointmentReason,
  CreateAppointmentBookingPayload,
  CreateAppointmentReasonPayload,
  CreateStaffAvailabilityPayload,
  CreateStaffTimeOffPayload,
  StaffAvailability,
  StaffTimeOff,
} from "./appointment/interfaces";
import type {
  FinanceApprovalConfig,
  FinanceApprovalConfigPayload,
  FinanceMutationRequest,
  FinancialRecord,
  GivingContribution,
  GivingOption,
  GivingOptionPayload,
  InitializeGivingPayload,
  InitializeGivingResult,
  RetryGivingPayload,
} from "./finance/interface";
import type {
  ApprovalConfig,
  EventReportApprovalConfigPayload,
  RequisitionApprovalActionPayload,
  RequisitionApprovalConfigPayload,
  SubmitRequisitionPayload,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import axios from "@/axiosInstance";
import { baseUrl } from "@/pages/Authentication/utils/helpers";
import { applyActiveBranchPayload } from "./branchScope";
import type {
  AiChatRequest,
  AiChatbotRequest,
  AiChatResponse,
  AiCredentialRecord,
  AiInsightResponse,
  AiInsightsRequest,
  CreateAiCredentialPayload,
} from "./ai/interfaces";
import type { NotificationPushSubscriptionPayload } from "./notifications/interfaces";
import type {
  DownloadedFile,
  EventReportGeneratePayload,
  EventReportGenerateResponse,
  EventReportGenerateResult,
  EventReportServiceSummaryFormat,
} from "./eventReports/interfaces";
import type {
  AudienceCount,
  CreateGeneralMessageDto,
  MessageAudience,
  MessageDispatch,
  MessagePreview,
  MessagePreviewRequest,
} from "./messaging/interfaces";
import { extractFileNameFromDisposition } from "../helperFunctions";

interface PostRequestOptions {
  headers?: Record<string, string>;
}

const serializeQuery = (query?: QueryType): string => {
  if (!query) return "";

  const normalizedQuery = Object.entries(query).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      accumulator[key] = String(value);
      return accumulator;
    },
    {}
  );

  return `?${new URLSearchParams(normalizedQuery).toString()}`;
};

const toStringValue = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export class ApiCreationCalls {
  private apiExecution: ApiExecution;
  constructor() {
    this.apiExecution = new ApiExecution({
      postExecutor: postData,
    });
  }
  private postToApi<T>(
    path: string,
    payload: unknown
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.postData(path, payload);
  }

  private async postToApiWithOptions<T>(
    path: string,
    payload: unknown,
    options?: PostRequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${path}`;
    const response = await axios.post<{ data: T }>(
      url,
      applyActiveBranchPayload(path, payload),
      {
      headers: options?.headers,
      }
    );

    return {
      data: response.data.data,
      status: response.status,
      error: "",
      success: true,
    };
  }

  private async postToApiWithRawResponse<T>(
    path: string,
    payload: unknown
  ): Promise<
    ApiResponse<T | null> & {
      message?: string;
    }
  > {
    const url = `${baseUrl}${path}`;
    const response = await axios.post(url, applyActiveBranchPayload(path, payload));
    const payloadRecord =
      response.data && typeof response.data === "object"
        ? (response.data as Record<string, unknown>)
        : {};
    const dataRecord =
      payloadRecord.data && typeof payloadRecord.data === "object"
        ? (payloadRecord.data as Record<string, unknown>)
        : null;

    return {
      data: (payloadRecord.data as T) ?? null,
      status: response.status,
      error: "",
      success: true,
      message:
        toStringValue(payloadRecord.message) ||
        toStringValue(dataRecord?.message) ||
        undefined,
    };
  }

  createMember = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/register", payload);
  };

  bulkUpdateMemberStatus = (
    payload: BulkUpdateMemberStatusPayload
  ): Promise<ApiResponse<BulkUpdateMemberStatusResponse>> => {
    return this.postToApi("user/update-member-status/bulk", payload);
  };

  bulkUpdateUserStatus = (
    payload: BulkUpdateUserStatusPayload
  ): Promise<ApiResponse<BulkUpdateUserStatusResponse>> => {
    return this.postToApi("user/update-user-status/bulk", payload);
  };

  createEvent = (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/create-event", payload);
  };

  /** Replaces an occurrence's reminders. Needs at least one offset. */
  saveEventReminders = (payload: {
    event_id: number;
    reminders: number[];
  }): Promise<ApiResponse<EventReminderRow[]>> => {
    return this.postToApi<EventReminderRow[]>("event/reminders", payload);
  };

  createUniqueEvent = (payload: EventType): Promise<ApiResponse<EventType>> => {
    return this.postToApi<EventType>("event/create-event-type", payload);
  };

  // Assets
  saveAsset = (payload: AssetSavePayload): Promise<ApiResponse<AssetRow>> => {
    return this.postToApi<AssetRow>("assets/save-asset", payload);
  };
  updateAssetStatus = (payload: AssetStatusPayload): Promise<ApiResponse<AssetStatusResponse>> => {
    return this.postToApi<AssetStatusResponse>("assets/update-status", payload);
  };
  restoreAssets = (payload: { snapshots: AssetSnapshot[] }): Promise<ApiResponse<{ assets: AssetRow[] }>> => {
    return this.postToApi<{ assets: AssetRow[] }>("assets/restore", payload);
  };
  confirmAssetLost = (payload: { id: number }): Promise<ApiResponse<{ asset: AssetRow; previous: AssetSnapshot }>> => {
    return this.postToApi<{ asset: AssetRow; previous: AssetSnapshot }>("assets/confirm-lost", payload);
  };
  raiseRepairRequisition = (payload: RepairRequisitionPayload): Promise<ApiResponse<RepairRequisitionResponse>> => {
    return this.postToApi<RepairRequisitionResponse>("assets/repair-requisition", payload);
  };
  clearRepairRequisition = (payload: { id: number }): Promise<ApiResponse<{ asset: AssetRow }>> => {
    return this.postToApi<{ asset: AssetRow }>("assets/clear-repair-requisition", payload);
  };
  /** action: start | cancel | mark | set-fix | add-extra | remove-extra | submit | reopen | remind | recount | mark-rest-missing | close */
  stockCheckAction = <T = StockCheckResponse>(
    action: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>(`assets/stock-checks/${action}`, payload);
  };
  createRequisition = <T = unknown>(
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("requisitions/create-requisition", payload);
  };
  upsertRequisitionApprovalConfig = (
    payload: RequisitionApprovalConfigPayload
  ): Promise<ApiResponse<ApprovalConfig>> => {
    return this.postToApi("requisitions/upsert-approval-config", payload);
  };
  upsertRoleEligibilityConfig = (
    payload: RoleEligibilityConfigPayload
  ): Promise<ApiResponse<RoleEligibilityConfig>> => {
    return this.postToApi("settings/upsert-role-eligibility-config", payload);
  };

  upsertAttendanceTimingConfig = (
    payload: AttendanceTimingSettingsPayload
  ): Promise<ApiResponse<AttendanceTimingSettingsConfig>> => {
    return this.postToApi("settings/upsert-attendance-timing-config", payload);
  };

  upsertEventReportExclusions = (
    payload: EventReportExclusionsPayload
  ): Promise<ApiResponse<EventReportExclusionsConfig>> => {
    return this.postToApi("settings/upsert-event-report-exclusions", payload);
  };

  upsertReportConfig = (
    payload: ReportConfigPayload
  ): Promise<ApiResponse<ReportConfig>> => {
    return this.postToApi("settings/upsert-report-config", payload);
  };

  upsertSystemNotificationConfig = (
    payload: SystemNotificationSettingsPayload
  ): Promise<ApiResponse<SystemNotificationSettingsConfig>> => {
    return this.postToApi("settings/upsert-system-notification-config", payload);
  };

  upsertEventReportApprovalConfig = (
    payload: EventReportApprovalConfigPayload
  ): Promise<ApiResponse<ApprovalConfig>> => {
    return this.postToApi("event-reports/upsert-approval-config", payload);
  };

  // Event report sign-off
  approveEventReport = (payload: EventReportSignOffPayload): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event-reports/approve", payload);
  };

  returnEventReport = (payload: EventReportSignOffPayload): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event-reports/return", payload);
  };

  resubmitEventReport = (payload: EventReportSignOffPayload): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event-reports/resubmit", payload);
  };

  commentOnEventReport = (payload: EventReportSignOffPayload): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event-reports/comment", payload);
  };

  // Department reports
  submitDepartmentReport = (payload: DeptReportSelector): Promise<ApiResponse<DeptReportDetail>> => {
    return this.postToApi("department-reports/submit", payload);
  };

  approveDepartmentReport = (payload: DeptReportSelector): Promise<ApiResponse<DeptReportDetail>> => {
    return this.postToApi("department-reports/approve", payload);
  };

  returnDepartmentReport = (
    payload: DeptReportSelector & { note: string }
  ): Promise<ApiResponse<DeptReportDetail>> => {
    return this.postToApi("department-reports/return", payload);
  };

  commentOnDepartmentReport = (
    payload: DeptReportSelector & { text: string }
  ): Promise<ApiResponse<DeptReportDetail>> => {
    return this.postToApi("department-reports/comment", payload);
  };

  remindDepartmentReport = (
    payload: DeptReportSelector
  ): Promise<ApiResponse<{ sent_to: number }>> => {
    return this.postToApi("department-reports/remind", payload);
  };

  decideLeadershipRequest = (payload: {
    request_id: number;
    decision: "APPROVE" | "RESPOND";
    response?: string;
  }): Promise<ApiResponse<{ id: number; outcome: string; response: string | null }>> => {
    return this.postToApi("department-reports/requests/decide", payload);
  };

  generateEventReport = (
    payload: EventReportGeneratePayload
  ): Promise<EventReportGenerateResponse> => {
    return this.postToApiWithRawResponse<EventReportGenerateResult>(
      "event-reports/generate",
      payload
    ) as Promise<EventReportGenerateResponse>;
  };

  downloadEventReportServiceSummary = async (
    payload: EventReportGeneratePayload,
    format: EventReportServiceSummaryFormat
  ): Promise<DownloadedFile> => {
    const queryString = serializeQuery({ format });
    const url = `${baseUrl}event-reports/generate-service-summary${queryString}`;
    const response = await axios.post(url, payload, {
      responseType: "blob",
    });
    const contentDisposition =
      response.headers["content-disposition"] ??
      response.headers["Content-Disposition"];
    const fileName =
      extractFileNameFromDisposition(contentDisposition) ||
      `service-summary-${payload.event_id}-${payload.event_date}.${format}`;

    return {
      blob: response.data,
      fileName,
      contentType: (response.headers["content-type"] ??
        response.headers["Content-Type"]) as string | null | undefined,
    };
  };

  submitRequisition = (
    payload: SubmitRequisitionPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("requisitions/submit-requisition", payload);
  };
  requisitionApprovalAction = (
    payload: RequisitionApprovalActionPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("requisitions/approval-action", payload);
  };
  addRequisitionComment = (payload: {
    requisition_id: number;
    comment: string;
  }): Promise<ApiResponse<{ id: number; created_at: string }>> => {
    return this.postToApi("requisitions/add-comment", payload);
  };
  sendRequisitionReminder = (payload: {
    requisition_id: number;
  }): Promise<ApiResponse<RequisitionReminderResponse>> => {
    return this.postToApi("requisitions/send-reminder", payload);
  };

  subscribeToNotificationPush = (
    payload: NotificationPushSubscriptionPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("notifications/push/subscribe", payload);
  };

  unsubscribeFromNotificationPush = (
    payload: NotificationPushSubscriptionPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("notifications/push/unsubscribe", payload);
  };

  createAccessRight = <T>(payload: unknown): Promise<ApiResponse<T>> =>
    this.postToApi<T>("access/create-access-level", payload);

  createDepartment = (
    payload: CreateDepartmentPayload
  ): Promise<ApiResponse<DepartmentType[]>> => {
    return this.postToApi("department/create-department", payload);
  };
  createJoinRequest = (
    payload: CreateJoinRequestPayload
  ): Promise<ApiResponse<{ id: number }>> => {
    return this.postToApi("department-join-request/create", payload);
  };

  bulkJoinRequestAction = (
    payload: BulkJoinRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("department-join-request/bulk", payload);
  };

  createBranch = (payload: BranchPayload): Promise<ApiResponse<Branch>> => {
    return this.postToApi("branch/create-branch", payload);
  };
  createPosition = (payload: unknown): Promise<ApiResponse<PositionType[]>> => {
    return this.postToApi("position/create-position", payload);
  };

  // Create Program
  createProgram = (payload: ProgramsPayloadType): Promise<unknown> => {
    return this.postToApi("program/program", payload);
  };

  createProgramModule = (payload: ModulePayload): Promise<ApiResponse<ProgramModule>> => {
    return this.postToApi("program/module", payload);
  };

  createBankQuestion = (payload: BankQuestionPayload): Promise<ApiResponse<BankQuestion>> => {
    return this.postToApi("program/question-bank", payload);
  };

  addBankQuestionsToUnit = (payload: {
    topicId: number;
    questionIds: number[];
  }): Promise<ApiResponse<{ added: number; skipped: number; total: number }>> => {
    return this.postToApi("program/question-bank/add-to-unit", payload);
  };

  createRubric = (payload: RubricPayload): Promise<ApiResponse<Rubric>> => {
    return this.postToApi("program/rubric", payload);
  };

  issueCertificates = (payload: {
    programId: number;
    userIds: number[];
  }): Promise<ApiResponse<{ issued: number; results: { userId: number; ok: boolean; error?: string }[] }>> => {
    return this.postToApi("program/certificates/issue", payload);
  };

  createLmsSession = (payload: SessionPayload): Promise<ApiResponse<LmsSession>> => {
    return this.postToApi("program/session", payload);
  };

  sendCohortAnnouncement = (payload: AnnouncementPayload): Promise<ApiResponse<LmsAnnouncement>> => {
    return this.postToApi("program/announcement", payload);
  };

  applyToProgram = (payload: { courseId: number; note?: string }): Promise<ApiResponse<ApplyResult>> => {
    return this.postToApi("program/apply", payload);
  };

  addProgramInstructors = (
    payload: { programId: number; userIds: number[] } & Partial<InstructorAbilities>
  ): Promise<ApiResponse<ProgramInstructor[]>> => {
    return this.postToApi("program/program-instructors", payload);
  };

  createLibraryItem = (payload: LibraryItemPayload): Promise<ApiResponse<LibraryItem>> => {
    return this.postToApi("program/library-item", payload);
  };

  useLibraryItem = (payload: {
    itemId: number;
    programId: number;
    moduleId?: number | null;
    title?: string;
  }): Promise<ApiResponse<{ topicId: number; name: string }>> => {
    return this.postToApi("program/library/use", payload);
  };

  grantAssignmentExtension = (payload: ExtensionPayload): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/assignment-extension", payload);
  };

  // Create Cohort
  createCohort = (
    payload: CohortPayloadType
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/cohort", payload);
  };

  // Create Course
  createCourse = (payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/course", payload);
  };

  // Enroll User
  enrollUser = (payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/enroll", payload);
  };

  createTopic = (payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/topic", payload);
  }

  // Submit MCQ Assignment
  submitMCQAssignment = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/submit-mcq-assignment", payload);
  };

  submitEssayAssignment = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/submit-essay-assignment", payload);
  };

  // Unenroll User
  unenrollUser = <T>(
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/unenroll", payload);
  };

  /** Let a member sign in to the admin app with a role in one branch. */
  giveAccess = (
    payload: GiveAccessPayload
  ): Promise<ApiResponse<GiveAccessResult>> => {
    return this.postToApi("user/give-access", payload);
  };

  /** Admin: email someone a link to set a new password. */
  sendResetLink = (payload: {
    user_id: number;
  }): Promise<ApiResponse<{ user_id: number; email: string; expires_in: string }>> => {
    return this.postToApi("user/send-reset-link", payload);
  };

  forgotPassword = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/forgot-password", payload);
  };

  changePassword = <T>(payload: {
    current_password: string;
    newpassword: string;
  }): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/change-password", payload);
  };

  /*Visitor Management*/
  createVisitor = <T>(payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi<T>("visitor/visitors", payload);
  };

  convertVisitorToMember = <T = unknown>(
    visitorId: string | number,
    payload: Record<string, unknown> = {}
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>(`visitor/convert-to-member?id=${visitorId}`, payload);
  };
  // Visit
  createVisit = (payload: VisitPayloadType): Promise<ApiResponse<unknown>> => {
    return this.postToApi("visitor/visit", payload);
  };

  // Follow-Up Management
  createFollowUp = (
    payload: FollowUpPayloadType
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("visitor/followup", payload);
  };

  // Prayer Request Management
  // createPrayerRequest = <T>(
  //   payload: Record<string, any>
  // ): Promise<ApiResponse<T>> => {
  //   return this.postToApi<T>("visitor/prayerrequest", payload);
  // };

  createLifeCenter = (
    payload: LifeCenterSavePayload
  ): Promise<ApiResponse<LifeCenterType>> => {
    return this.postToApi("lifecenter/create-lifecenter", payload);
  };

  createSoul = (
    payload: SoulWonPayload
  ): Promise<
    ApiResponse<{
      id: string | number;
      first_name: string;
      last_name: string;
    }>
  > => {
    return this.postToApi("lifecenter/soulwon", payload);
  };

  createMeeting = (payload: MeetingPayload): Promise<ApiResponse<MeetingType>> => {
    return this.postToApi("lifecenter/meeting", payload);
  };

  createLifeCenterRole = (payload: {
    name: string;
  }): Promise<ApiResponse<{ id: string; name: string }>> => {
    return this.postToApi("lifecenter/create-role", payload);
  };

  createLifeCenterMember = (
    payload: LifeCenterMemberPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("lifecenter/add-lifecenter-member", payload);
  };

  remindLifeCenterLeader = (payload: {
    lifeCenterId: number | string;
    reason: LeaderReminderReason;
  }): Promise<ApiResponse<{ sent_to: string }>> => {
    return this.postToApi("lifecenter/remind-leader", payload);
  };

  //marketPlace
  createMarket = (
    payload: Omit<IMarket, "id" | "event_name">
  ): Promise<ApiResponse<IMarket>> => {
    return this.postToApi("market/create-market", payload);
  };

  duplicateMarket = (
    payload: Omit<IMarket, "id" | "event_name"> & { source_market_id: string }
  ): Promise<ApiResponse<{ market: IMarket; products_count: number }>> => {
    return this.postToApi("market/duplicate-market", payload);
  };

  //products
  createProductType = (payload: {
    name: string;
  }): Promise<ApiResponse<IProductType>> => {
    return this.postToApi("product/create-product-type", payload);
  };

  createProductCategory = (payload: {
    name: string;
  }): Promise<ApiResponse<IProductType>> => {
    return this.postToApi("product/create-product-category", payload);
  };

  createProduct = (payload: IProduct): Promise<ApiResponse<IProduct>> => {
    return this.postToApi("product/create-product", payload);
  };

  createOrder = (
    payload: ICheckOut
  ): Promise<ApiResponse<CheckOutResponse>> => {
    return this.postToApi("orders/create-order", payload);
  };

  retryOrderPayment = (
    payload: RetryOrderPaymentPayload
  ): Promise<ApiResponse<CheckOutResponse>> => {
    return this.postToApi("orders/retry-payment", payload);
  };

  createOrderForMember = (
    payload: ICreateOrderForMemberPayload
  ): Promise<ApiResponse<(CheckOutResponse & { updated_order: IOrderDetail }) | IOrderDetail>> => {
    return this.postToApi("orders/create-for-member", payload);
  };

  reconcileHubtelPendingPayments = (
    limit = 100
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi(
      `orders/reconcile-hubtel-pending-payments?limit=${limit}`,
      {}
    );
  };

  createStaffAvailability = (
    payload: CreateStaffAvailabilityPayload
  ): Promise<ApiResponse<StaffAvailability>> => {
    return this.postToApi("appointment/availability", payload);
  };

  createAppointmentBooking = (
    payload: CreateAppointmentBookingPayload
  ): Promise<ApiResponse<Appointment>> => {
    return this.postToApi("appointment/book", payload);
  };

  createAppointmentReason = (
    payload: CreateAppointmentReasonPayload
  ): Promise<ApiResponse<AppointmentReason>> => {
    return this.postToApi("appointment/reasons", payload);
  };

  // Accept, suggest, decline, cancel, record outcome, remind, reassign…
  appointmentBookingAction = (
    id: string | number,
    payload: AppointmentActionPayload
  ): Promise<ApiResponse<Appointment>> => {
    return this.postToApi(`appointment/bookings/${id}/actions`, payload);
  };

  createStaffTimeOff = (
    userId: string | number,
    payload: CreateStaffTimeOffPayload
  ): Promise<ApiResponse<StaffTimeOff>> => {
    return this.postToApi(
      `appointment/availability/staff/${userId}/time-off`,
      payload
    );
  };

  // Record Attendance
  recordChurchAttendance = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/church-attendance", payload);
  }

  importBiometricAttendance = (
    payload: BiometricAttendanceImportPayload
  ): Promise<ApiResponse<BiometricAttendanceImportStartResponse>> => {
    return this.postToApi("event/import-biometric-attendance", payload);
  };

  registerEvent = (payload: {
    event_id: string | number;
  }): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/register", payload);
  };

  validatePublicEventMember = (
    payload: ValidateEventMemberPayload
  ): Promise<ApiResponse<ValidatedEventMember>> => {
    return this.postToApi("event/public-validate-member", payload);
  };

  publicRegisterEvent = (
    payload: PublicEventRegistrationPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/public-register", payload);
  };

  //Create theme
  createAnnualTheme = (
    payload: AnnualThemePayload | unknown
  ): Promise<ApiResponse<AnnualTheme>> => {
    return this.postToApi("theme/create-theme", payload);
  }

  // Community
  createCommunityPost = (
    payload: CreateCommunityPostDto
  ): Promise<ApiResponse<CommunityPost>> => {
    return this.postToApi("community/posts", payload);
  };

  // Messaging
  previewMessage = (
    payload: MessagePreviewRequest
  ): Promise<ApiResponse<MessagePreview>> => {
    return this.postToApi("messaging/preview", payload);
  };

  countMessageAudience = (payload: {
    audience: MessageAudience;
  }): Promise<ApiResponse<AudienceCount>> => {
    return this.postToApi("messaging/audience/count", payload);
  };

  createGeneralMessage = (
    payload: CreateGeneralMessageDto
  ): Promise<ApiResponse<MessageDispatch>> => {
    return this.postToApi("messaging/dispatches", payload);
  };

  cancelMessageDispatch = (id: number): Promise<ApiResponse<MessageDispatch>> => {
    return this.postToApi(`messaging/dispatches/${id}/cancel`, {});
  };

  retryFailedMessages = (
    id: number
  ): Promise<ApiResponse<{ retried: number }>> => {
    return this.postToApi(`messaging/dispatches/${id}/retry-failed`, {});
  };

  /** Toggles the viewer's reaction of `type`. */
  toggleCommunityPostReaction = (
    id: number,
    type: CommunityReactionType
  ): Promise<ApiResponse<CommunityReactionSummary[]>> => {
    return this.postToApi(`community/posts/${id}/reactions`, { type });
  };

  createCommunityComment = (
    postId: number,
    payload: CreateCommunityCommentDto
  ): Promise<ApiResponse<CommunityComment>> => {
    return this.postToApi(`community/posts/${postId}/comments`, payload);
  };

  toggleCommunityCommentReaction = (
    id: number,
    type: CommunityCommentReactionType
  ): Promise<ApiResponse<CommunityReactionSummary[]>> => {
    return this.postToApi(`community/comments/${id}/reactions`, { type });
  };

  hideCommunityPost = (id: number): Promise<ApiResponse<{ id: number }>> => {
    return this.postToApi(`community/posts/${id}/hide`, {});
  };

  hideCommunityComment = (
    id: number
  ): Promise<ApiResponse<{ id: number }>> => {
    return this.postToApi(`community/comments/${id}/hide`, {});
  };

  /** Also hides the target for the reporter. */
  createCommunityReport = (
    payload: CreateCommunityReportDto
  ): Promise<ApiResponse<{ id: number }>> => {
    return this.postToApi("community/reports", payload);
  };

  /** The server resolves the real author, so anonymous authors can be
   *  blocked without being revealed. */
  createCommunityBlock = (
    payload: CreateCommunityBlockDto
  ): Promise<ApiResponse<{ ok: true }>> => {
    return this.postToApi("community/blocks", payload);
  };

  markAllCommunityNotificationsRead = (): Promise<
    ApiResponse<{ count: number }>
  > => {
    return this.postToApi("community/notifications/read-all", {});
  };

  moderateCommunityContent = (
    kind: CommunityModerationKind,
    id: number,
    action: "remove" | "restore" | "warn"
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi(`community/moderation/${kind}/${id}/${action}`, {});
  };

  // Promotions
  createPromotion = (
    payload: CreatePromotionDto
  ): Promise<ApiResponse<Promotion>> => {
    return this.postToApi("promotions", payload);
  };

  publishPromotion = (
    id: number
  ): Promise<ApiResponse<Promotion>> => {
    return this.postToApi(`promotions/${id}/publish`, {});
  };

  unpublishPromotion = (id: number): Promise<ApiResponse<Promotion>> => {
    return this.postToApi(`promotions/${id}/unpublish`, {});
  };

  /** Rewrites sort_order to 1..n in the order given. */
  reorderPromotions = (ids: number[]): Promise<ApiResponse<Promotion[]>> => {
    return this.postToApi("promotions/reorder", { ids });
  };

  /** Community manager: pin or unpin a post above the feed. */
  pinCommunityPost = (
    id: number,
    pinned: boolean
  ): Promise<ApiResponse<{ id: number; isPinned: boolean }>> => {
    return this.postToApi(`community/admin/posts/${id}/pin`, { pinned });
  };

  archivePromotion = (
    id: number
  ): Promise<ApiResponse<Promotion>> => {
    return this.postToApi(`promotions/${id}/archive`, {});
  };

  // Sermons
  createSermon = (payload: CreateSermonDto): Promise<ApiResponse<Sermon>> => {
    return this.postToApi("sermons", payload);
  };

  publishSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.postToApi(`sermons/${id}/publish`, {});
  };

  unpublishSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.postToApi(`sermons/${id}/unpublish`, {});
  };

  createSermonSeries = (
    payload: CreateSermonSeriesDto
  ): Promise<ApiResponse<SermonSeries>> => {
    return this.postToApi("sermons/series", payload);
  };

  // create receipt config 
  createReceiptConfig = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("receiptconfig/create-receipt-config", payload);
  }

  // create payment config
  createPaymentConfig = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("paymentconfig/create-payment-config", payload);
  };

  // create bankAccount config
  createBankAccountConfig = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("bankaccountconfig/create-bank-account-config", payload);
  };

  // create giving option (also creates its Paystack subaccount)
  createGivingOption = (
    payload: GivingOptionPayload
  ): Promise<ApiResponse<GivingOption>> => {
    return this.postToApi("givingoption/create-giving-option", payload);
  };

  // create tithe breakdown config
  createTitheBreakdownConfig = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("tithebreakdownconfig/create-tithe-breakdown-config", payload); 
  }

  // create financial
  createFinancial = (
    payload: FinanceMutationRequest
  ): Promise<ApiResponse<FinancialRecord>> => {
    return this.postToApi("financials/create-financial", payload);
  };

  createPledge = (
    payload: PledgeMutationPayload
  ): Promise<ApiResponse<PledgeDetail>> => {
    return this.postToApi("pledges/create-pledge", payload);
  };

  addPledgers = (payload: {
    group_id: number;
    pledgers: PledgerInput[];
  }): Promise<ApiResponse<unknown>> => {
    return this.postToApi("pledges/add-pledgers", payload);
  };

  createRedemption = (payload: {
    pledger_id: number;
    amount: number;
    date: string;
    method: string;
    note?: string;
    image_url?: string | null;
  }): Promise<ApiResponse<Redemption>> => {
    return this.postToApi("pledges/create-redemption", payload);
  };

  // start a Paystack payment for the caller's own pledge (member portal)
  initializePledgePayment = (
    payload: InitializePledgePaymentPayload
  ): Promise<ApiResponse<InitializePledgePaymentResult>> => {
    return this.postToApi("pledges/initialize-payment", payload);
  };

  // start a Paystack giving payment for the caller (member portal)
  initializeGiving = (
    payload: InitializeGivingPayload
  ): Promise<ApiResponse<InitializeGivingResult>> => {
    return this.postToApi("givingoption/initialize", payload);
  };

  // start a fresh attempt at one of the caller's unsuccessful contributions.
  // The result carries a NEW reference — the failed row stays in history.
  retryGivingPayment = (
    payload: RetryGivingPayload
  ): Promise<ApiResponse<InitializeGivingResult>> => {
    return this.postToApi("givingoption/retry-payment", payload);
  };

  // start a fresh attempt at one of the caller's unsuccessful pledge payments
  retryPledgePayment = (
    payload: RetryPledgePaymentPayload
  ): Promise<ApiResponse<InitializePledgePaymentResult>> => {
    return this.postToApi("pledges/retry-payment", payload);
  };

  upsertFinanceApprovalConfig = (
    payload: FinanceApprovalConfigPayload
  ): Promise<ApiResponse<FinanceApprovalConfig>> => {
    return this.postToApi("financials/upsert-approval-config", payload);
  };

  // finance approver approves a submitted weekly record. Query: { id }
  approveFinancial = (id: string): Promise<ApiResponse<FinancialRecord>> => {
    return this.postToApi(`financials/approve-financial?id=${encodeURIComponent(id)}`, {});
  };

  // finance approver sends a submitted weekly record back as a draft
  returnFinancial = (
    id: string,
    note: string
  ): Promise<ApiResponse<FinancialRecord>> => {
    return this.postToApi(`financials/return-financial?id=${encodeURIComponent(id)}`, { note });
  };

  // ask Paystack for the latest status of unsettled contributions
  recheckContributions = (
    references: string[]
  ): Promise<ApiResponse<GivingContribution[]> & { checked?: number; failed?: number }> => {
    return this.postToApi("givingoption/contributions/recheck", { references });
  };

  // invite a member whose gift failed or was abandoned to give again
  nudgeContribution = (reference: string): Promise<ApiResponse<unknown>> => {
    return this.postToApi("givingoption/contributions/nudge", { reference });
  };

  // record the redemption for a settled pledge payment that wasn't credited
  creditPledgePayment = (paymentId: string): Promise<ApiResponse<PledgePayment>> => {
    return this.postToApi("pledges/credit-payment", { payment_id: paymentId });
  };

  // remind pledgers with a balance (all, or the given pledgers)
  remindPledgers = (payload: {
    pledge_id: number;
    pledger_ids?: number[];
  }): Promise<ApiResponse<PledgeRemindResult>> => {
    return this.postToApi("pledges/remind-pledgers", payload);
  };

  createAiCredential = (
    payload: CreateAiCredentialPayload
  ): Promise<ApiResponse<AiCredentialRecord>> => {
    return this.postToApi("ai/credentials", payload);
  };

  sendAiMessage = (
    payload: AiChatRequest,
    options?: { idempotencyKey?: string }
  ): Promise<ApiResponse<AiChatResponse>> => {
    const idempotencyKey = options?.idempotencyKey?.trim();
    const headers = idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : undefined;

    return this.postToApiWithOptions("ai/chat", payload, { headers });
  };

  sendAiChatbotMessage = (
    payload: AiChatbotRequest,
    options?: { idempotencyKey?: string }
  ): Promise<ApiResponse<AiChatResponse>> => {
    const idempotencyKey = options?.idempotencyKey?.trim();
    const headers = idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : undefined;

    return this.postToApiWithOptions("ai/chatbot", payload, { headers });
  };

  createAiInsights = (
    module: string,
    payload: AiInsightsRequest
  ): Promise<ApiResponse<AiInsightResponse>> => {
    const encodedModule = encodeURIComponent(module.trim());
    return this.postToApi(`ai/insights/${encodedModule}`, payload);
  };

  // Ride to church (members)
  publishRide = (payload: PublishRideDto): Promise<ApiResponse<DriverRide>> => {
    return this.postToApi("rides/offers", payload);
  };

  cancelRideOffer = (
    id: number
  ): Promise<ApiResponse<{ id: number; status: string }>> => {
    return this.postToApi(`rides/offers/${id}/cancel`, {});
  };

  requestRideSeat = (payload: RequestSeatDto): Promise<ApiResponse<MyRide>> => {
    return this.postToApi("rides/requests", payload);
  };

  acceptRideRequest = (id: number): Promise<ApiResponse<MyRide>> => {
    return this.postToApi(`rides/requests/${id}/accept`, {});
  };

  declineRideRequest = (
    id: number,
    payload: DeclineRequestDto
  ): Promise<ApiResponse<MyRide>> => {
    return this.postToApi(`rides/requests/${id}/decline`, payload);
  };

  cancelRideRequest = (
    id: number
  ): Promise<ApiResponse<{ id: number; status: string }>> => {
    return this.postToApi(`rides/requests/${id}/cancel`, {});
  };

  /** Acknowledge a declined / driver-cancelled request ("Find another ride"). */
  dismissRideRequest = (id: number): Promise<ApiResponse<{ id: number }>> => {
    return this.postToApi(`rides/requests/${id}/dismiss`, {});
  };

  setRideAlert = (
    payload: RideAlertDto
  ): Promise<
    ApiResponse<{ pickup_point_id: number; event_id?: number; alert_on: boolean }>
  > => {
    return this.postToApi("rides/alerts", payload);
  };

  reportRide = (
    payload: RideReportDto
  ): Promise<ApiResponse<{ id: number; blocked: boolean }>> => {
    return this.postToApi("rides/reports", payload);
  };

  // Ride to church (safety team / church office)
  adminCancelRide = (
    id: number,
    payload: { reason?: string }
  ): Promise<
    ApiResponse<{ id: number; status: string; passengers_notified: number }>
  > => {
    return this.postToApi(`rides/admin/offers/${id}/cancel`, payload);
  };

  createRidePickupPoint = (
    payload: SaveRidePickupPointDto
  ): Promise<ApiResponse<AdminRidePickupPoint>> => {
    return this.postToApi("rides/admin/pickup-points", payload);
  };

  createRideArea = (
    payload: SaveRideAreaDto
  ): Promise<ApiResponse<AdminRideArea>> => {
    return this.postToApi("rides/admin/areas", payload);
  };
}
