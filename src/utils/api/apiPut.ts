import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import type {
  BulkAssignAccessLevelPayload,
  BulkAssignAccessLevelResult,
} from "./settings/accessLevelAssignmentInterfaces";
import type {
  CommunityPost,
  UpdateCommunityPostDto,
} from "./community/interfaces";
import type {
  AdminRideArea,
  AdminRidePickupPoint,
  SaveRideAreaDto,
  SaveRidePickupPointDto,
} from "./rides/interfaces";
import type { Promotion, UpdatePromotionDto } from "./promotions/interfaces";
import type { AnnualTheme, AnnualThemePayload } from "./theme/interfaces";
import type { DecideMembershipRequestPayload } from "./guests/interfaces";
import type {
  Sermon,
  SermonSeries,
  UpdateSermonDto,
  UpdateSermonSeriesDto,
} from "./sermons/interfaces";
import { patchData, updateData } from "./apiFunctions";
import type { PledgeDetail, PledgeMutationPayload } from "./pledges/interface";
import {
  LifeCenterMemberPayload,
  LifeCenterRole,
  LifeCenterType,
  MeetingType,
} from "./lifeCenter/interfaces";
import {
  activateMemberPayloadType,
  activateMemberType,
} from "./members/interfaces";
import type { Branch, BranchPayload } from "./settings/branchInterfaces";
import type {
  DepartmentType,
  UpdateDepartmentPayload,
} from "./settings/departmentInterfaces";
import {
  CohortPayloadType,
  BankQuestionPayload,
  CohortSchedule,
  DueRule,
  GradeOverridePayload,
  RubricPayload,
  AttendanceStatus,
  InstructorAbilities,
  LibraryItemPayload,
  ProgramInstructor,
  SessionAttendance,
  SessionPayload,
  GradingCategory,
  ModulePayload,
  ProgramGrading,
  ProgramModulesResponse,
  ReorderProgramTopicsPayload,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import {
  FollowUpPayloadType,
  VisitorType,
  VisitPayloadType,
} from "./visitors/interfaces";
import { EventType } from "./events/interfaces";
import type { EventOnlineLink } from "./events/interfaces";
import type {
  IMarket,
  IProductType,
  IProduct,
  IOrders,
  IOrderDetail,
  IBulkOrderStatusPayload,
  IBulkOrderStatusResult,
  IUpdateOrderPayload,
} from "./marketPlace/interface";
import type {
  Appointment,
  AppointmentReason,
  AppointmentSettings,
  ReorderAppointmentReasonsPayload,
  StaffAvailability,
  UpdateAppointmentBookingPayload,
  UpdateAppointmentReasonPayload,
  UpdateAppointmentStatusPayload,
  UpdateStaffAvailabilityPayload,
} from "./appointment/interfaces";
import type {
  AiCredentialRecord,
  UpdateAiCredentialPayload,
} from "./ai/interfaces";
import type {
  FinanceMutationRequest,
  FinancialRecord,
  GivingOption,
  GivingOptionPayload,
} from "./finance/interface";
import type { UpdateNotificationPreferencePayload } from "./notifications/interfaces";
import type {
  ApproveJoinRequestPayload,
  DeclineJoinRequestPayload,
} from "./departmentJoinRequests/interfaces";

import type {
  MessageTemplate,
  MessageTemplateKey,
  MessagingSettings,
  UpdateMessageTemplateDto,
  UpdateMessagingSettingsDto,
} from "./messaging/interfaces";

export class ApiUpdateCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      updateExecutor: updateData,
      patchExecutor: patchData,
    });
  }

  // Update Event
  updateEvent = (
    payload: Record<string, unknown>,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/update-event", payload, query);
  };

  /** Update every occurrence in a recurring series. Body must include series_id. */
  updateEventSeries = (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/update-series", payload);
  };

  /** Update this occurrence and all following ones. Body must include series_id + from_date. */
  updateEventSeriesFrom = (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/update-series-from", payload);
  };

  /**
   * Set an event's Zoom / YouTube links. Separate from `updateEvent` because
   * that endpoint notifies and SMSes every registrant on any change.
   * An entry with an empty url deletes that platform's link.
   */
  updateEventOnlineLinks = (
    payload: { links: { platform: string; url: string }[] },
    query?: QueryType
  ): Promise<ApiResponse<{ event_id: number; online_links: EventOnlineLink[] }>> => {
    return this.apiExecution.updateData("event/online-links", payload, query);
  };

  updateUniqueEvent = (
    payload: EventType,
    query?: QueryType
  ): Promise<ApiResponse<EventType>> => {
    return this.apiExecution.updateData(
      "event/update-event-type",
      payload,
      query
    );
  };

  // Update Requisition
  updateRequisition = <T = unknown>(
    payload: Record<string, unknown>,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "requisitions/update-requisition",
      payload,
      query
    );
  };

  // Update Position
  updatePosition = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "position/update-position",
      payload,
      query
    );
  };

  // Update Department
  updateDepartment = (
    payload: UpdateDepartmentPayload,
    query?: QueryType
  ): Promise<ApiResponse<DepartmentType>> => {
    return this.apiExecution.updateData(
      "department/update-department",
      payload,
      query
    );
  };

  updateBranch = (
    payload: BranchPayload,
    query?: QueryType
  ): Promise<ApiResponse<Branch>> => {
    return this.apiExecution.updateData(
      "branch/update-branch",
      payload,
      query
    );
  };

  // Update Access Level
  updateAccessRight = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "access/update-access-level",
      payload,
      query
    );
  };

  // Assign Access Level to User
  assignAccessRight = (payload: {
    user_id: string | number;
    access_level_id: string | number;
  }): Promise<ApiResponse<AccessRight>> => {
    return this.apiExecution.updateData(
      "access/assign_access_to_user",
      payload
    );
  };

  // Assign and/or unassign many users on one access level
  bulkAssignAccessLevel = (
    payload: BulkAssignAccessLevelPayload
  ): Promise<ApiResponse<BulkAssignAccessLevelResult>> => {
    return this.apiExecution.updateData(
      "access/bulk-assign-access-level",
      payload
    );
  };

  // Update Program
  updateProgram = (
    payload: ProgramsPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/program`, payload, query);
  };

  updateProgramModule = (payload: ModulePayload, query: QueryType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/module", payload, query);
  };

  reorderProgramModules = (payload: {
    programId: number;
    modules: { id: number; order_number: number }[];
  }): Promise<ApiResponse<ProgramModulesResponse>> => {
    return this.apiExecution.updateData("program/reorder-modules", payload);
  };

  setTopicModule = (payload: {
    topicId: number;
    moduleId: number | null;
    order_number?: number;
  }): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/topic-module", payload);
  };

  updateProgramGrading = (
    payload: Partial<Omit<ProgramGrading, "programId">>,
    query: QueryType
  ): Promise<ApiResponse<ProgramGrading>> => {
    return this.apiExecution.updateData("program/grading", payload, query);
  };

  updateUnitSettings = (payload: {
    topicId: number;
    due_rule?: DueRule | null;
    grading_category?: GradingCategory | null;
  }): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/unit-settings", payload);
  };

  updateBankQuestion = (payload: Partial<BankQuestionPayload>, query: QueryType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/question-bank", payload, query);
  };

  updateRubric = (payload: Partial<RubricPayload>, query: QueryType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/rubric", payload, query);
  };

  setUnitRubric = (payload: { topicId: number; rubricId: number | null }): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/unit-rubric", payload);
  };

  gradeWithRubric = (payload: {
    submissionId: number;
    scores: Record<string, string>;
    feedback?: string;
  }): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/grade-with-rubric", payload);
  };

  setGradeOverrides = (payload: GradeOverridePayload): Promise<ApiResponse<{ updated: number }>> => {
    return this.apiExecution.updateData("program/grade-overrides", payload);
  };

  updateLmsSession = (payload: SessionPayload, query: QueryType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/session", payload, query);
  };

  saveSessionAttendance = (payload: {
    sessionId: number;
    records: { enrollmentId: number; status: AttendanceStatus; note?: string | null }[];
  }): Promise<ApiResponse<SessionAttendance>> => {
    return this.apiExecution.updateData("program/session-attendance", payload);
  };

  decideLmsApplication = (payload: {
    id: number;
    decision: "APPROVE" | "DECLINE";
    courseId?: number | null;
    note?: string;
  }): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/application/decide", payload);
  };

  updateProgramInstructor = (
    payload: Partial<InstructorAbilities>,
    query: QueryType
  ): Promise<ApiResponse<ProgramInstructor[]>> => {
    return this.apiExecution.updateData("program/program-instructor", payload, query);
  };

  updateLibraryItem = (
    payload: LibraryItemPayload,
    query: QueryType
  ): Promise<ApiResponse<{ unitsUpdated: number }>> => {
    return this.apiExecution.updateData("program/library-item", payload, query);
  };

  setCohortDueDate = (payload: {
    cohortId: number;
    topicId: number;
    dueDate: string | null;
  }): Promise<ApiResponse<CohortSchedule>> => {
    return this.apiExecution.updateData("program/cohort-due-date", payload);
  };

  // Update Cohort
  updateCohort = (
    payload: CohortPayloadType & { id: number },
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/cohort`, payload, query);
  };

  // Update Class
  updateClass = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/course`, payload, query);
  };
  // Update Cohort
  updateStudentProgress = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/progress-updates",
      payload,
      query
    );
  };

  // Update Enrollment
  updateEnrollment = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/enrollments/update-enrollment",
      payload,
      query
    );
  };

  // Update Topic
  updateTopic = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/topic`, payload, query);
  }

  reorderProgramTopics = (
    payload: ReorderProgramTopicsPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/reorder-topics`, payload);
  };

  // mark topic as completed
  markTopicAsCompleted = (
    payload: unknown,
    // query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/complete-topic", payload);
  }

  // activate assignment
  activateCohortAssignment = (
    payload: unknown,
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/activate-cohort-assignment",
      payload
    );
  };

  // deactivate assignment
  deactivateCohortAssignment = (
    payload: unknown,
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/deactivate-cohort-assignment",
      payload
    );
  };

  gradeAssignmentSubmission = (
    payload: {
      submissionId: string | number;
      grade: number;
      feedback?: string | null;
    },
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/grade-assignment", payload);
  };

  gradeAssignmentSubmissions = (
    payload: {
      submissionIds: Array<string | number>;
      grade: number;
      feedback?: string | null;
    },
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("program/grade-assignments", payload);
  };

  /* Visitor Management */

  updateVisitor = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<VisitorType>> => {
    return this.apiExecution.updateData(`visitor/visitor`, payload, query);
  };

  updateVisit = (
    payload: VisitPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("visitor/visit", payload, query);
  };

  // Follow-Up Management
  updateFollowUp = (
    payload: FollowUpPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("visitor/followup", payload, query);
  };

  // Prayer Request Management
  // updatePrayerRequest = <T>(
  //   payload: Record<string, any>,
  //   query?: QueryType
  // ): Promise<ApiResponse<T>> => {
  //   return this.apiExecution.updateData(
  //     "visitor/prayerrequest",
  //     payload,
  //     query
  //   );
  // };

  updateMember = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("user/update-user", payload, query);
  };

  updateMemberStatus = <T>(
    payload: Record<string, never> = {},
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "user/update-member-status",
      payload,
      query
    );
  };

  activateMember = (
    payload: activateMemberPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<activateMemberType>> => {
    return this.apiExecution.updateData(
      "user/update-user-status",
      payload,
      query
    );
  };

  updateLifeCenter = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterType>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-lifecenter",
      payload,
      query
    );
  };

  updateSoul = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("lifecenter/soulwon", payload, query);
  };

  updateMeeting = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<MeetingType>> => {
    return this.apiExecution.updateData("lifecenter/meeting", payload, query);
  };

  updateLifeCenterRole = (
    payload: Pick<LifeCenterRole, "name">,
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterRole>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-role",
      payload,
      query
    );
  };

  updateLifeCenterMember = (
    payload: LifeCenterMemberPayload,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-member-role",
      payload,
      query
    );
  };

  updateMarket = (
    payload: Omit<IMarket, "event_name">,
    query?: QueryType
  ): Promise<ApiResponse<IMarket>> => {
    return this.apiExecution.updateData("market/update-market", payload, query);
  };

  updateProductType = (
    payload: IProductType,
    query?: QueryType
  ): Promise<ApiResponse<IProductType>> => {
    return this.apiExecution.updateData(
      "product/update-product-type",
      payload,
      query
    );
  };

  updateProductCategory = (
    payload: IProductType,
    query?: QueryType
  ): Promise<ApiResponse<IProductType>> => {
    return this.apiExecution.updateData(
      "product/update-product-category",
      payload,
      query
    );
  };

  updateProduct = (
    payload: IProduct,
    query?: QueryType
  ): Promise<ApiResponse<IProduct>> => {
    return this.apiExecution.updateData(
      "product/update-product",
      payload,
      query
    );
  };

  updateStaffAvailability = (
    payload: UpdateStaffAvailabilityPayload,
    query?: QueryType
  ): Promise<ApiResponse<StaffAvailability>> => {
    const availabilityId = query?.id;

    if (!availabilityId) {
      throw new Error("Availability id is required for update");
    }

    return this.apiExecution.updateData(
      `appointment/availability/${availabilityId}`,
      payload
    );
  };

  updateAppointmentBooking = (
    payload: UpdateAppointmentBookingPayload,
    query?: QueryType
  ): Promise<ApiResponse<Appointment>> => {
    const bookingId = query?.id;

    if (!bookingId) {
      throw new Error("Booking id is required for update");
    }

    return this.apiExecution.updateData(
      `appointment/bookings/${bookingId}`,
      payload
    );
  };

  updateAppointmentReason = (
    payload: UpdateAppointmentReasonPayload,
    query?: QueryType
  ): Promise<ApiResponse<AppointmentReason>> => {
    const reasonId = query?.id;

    if (!reasonId) {
      throw new Error("Reason id is required for update");
    }

    return this.apiExecution.updateData(
      `appointment/reasons/${reasonId}`,
      payload
    );
  };

  reorderAppointmentReasons = (
    payload: ReorderAppointmentReasonsPayload
  ): Promise<ApiResponse<AppointmentReason[]>> => {
    return this.apiExecution.updateData("appointment/reasons/reorder", payload);
  };

  updateAppointmentSettings = (
    payload: Partial<AppointmentSettings>
  ): Promise<ApiResponse<AppointmentSettings>> => {
    return this.apiExecution.updateData("appointment/settings", payload);
  };

  // Stop or restart new bookings for one person. Existing bookings stay.
  setStaffBookingsPaused = (
    payload: { paused: boolean },
    query?: QueryType
  ): Promise<ApiResponse<{ userId: string; paused: boolean }>> => {
    const userId = query?.id;

    if (!userId) {
      throw new Error("Staff id is required to pause bookings");
    }

    return this.apiExecution.updateData(
      `appointment/availability/staff/${userId}/pause`,
      payload
    );
  };

  updateAppointmentStatus = (
    payload: UpdateAppointmentStatusPayload,
    query?: QueryType
  ): Promise<ApiResponse<Appointment>> => {
    const appointmentId = query?.id;

    if (!appointmentId) {
      throw new Error("Appointment id is required for status update");
    }

    return this.apiExecution.updateData("appointment/status", payload, {
      id: appointmentId,
    });
  };

  updateOrderDeliveryStatus = (
    payload: {
      id: number | string;
      status: "pending" | "shipped" | "delivered" | "cancelled";
    }
  ): Promise<ApiResponse<IOrders>> => {
    return this.apiExecution.updateData("orders/update-delivery-status", payload);
  };

  cancelOrder = (
    payload: { id: number | string }
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/cancel-order", payload);
  };

  updateOrder = (
    payload: IUpdateOrderPayload
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/update-order", payload);
  };

  bulkUpdateOrderStatus = (
    payload: IBulkOrderStatusPayload
  ): Promise<ApiResponse<IBulkOrderStatusResult>> => {
    return this.apiExecution.updateData("orders/bulk-update-status", payload);
  };

  // uodate church attendance
  updateChurchAttendance = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/church-attendance", payload, query);
  }

  // update annual theme
  updateAnnualTheme = (
    payload: Partial<AnnualThemePayload> | unknown,
    query?: QueryType
  ): Promise<ApiResponse<AnnualTheme>> => {
    return this.apiExecution.updateData("theme/update-theme", payload, query);
}

  // update community post (author or Community manager)
  updateCommunityPost = (
    id: number,
    payload: UpdateCommunityPostDto
  ): Promise<ApiResponse<CommunityPost>> => {
    return this.apiExecution.updateData(`community/posts/${id}`, payload);
  };

  markCommunityNotificationRead = (
    id: number
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData(`community/notifications/${id}/read`, {});
  };

  // update promotion
  updatePromotion = (
    id: number,
    payload: UpdatePromotionDto
  ): Promise<ApiResponse<Promotion>> => {
    return this.apiExecution.updateData(`promotions/${id}`, payload);
  }

  // Messaging
  updateMessageTemplate = (
    key: MessageTemplateKey,
    payload: UpdateMessageTemplateDto
  ): Promise<ApiResponse<MessageTemplate>> => {
    return this.apiExecution.updateData(`messaging/templates/${key}`, payload);
  };

  updateMessagingSettings = (
    payload: UpdateMessagingSettingsDto
  ): Promise<ApiResponse<MessagingSettings>> => {
    return this.apiExecution.updateData("messaging/settings", payload);
  };

  // Sermons
  updateSermon = (
    id: number,
    payload: UpdateSermonDto
  ): Promise<ApiResponse<Sermon>> => {
    return this.apiExecution.updateData(`sermons/${id}`, payload);
  };

  updateSermonSeries = (
    id: number,
    payload: UpdateSermonSeriesDto
  ): Promise<ApiResponse<SermonSeries>> => {
    return this.apiExecution.updateData(`sermons/series/${id}`, payload);
  };

// update receipt config
  updateReceiptConfig = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("receiptconfig/update-receipt-config", payload, query);
  }

  // update payment config
  // update payment config
  updatePaymentConfig = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "paymentconfig/update-payment-config",
      payload,
      query
    );
  };

  // update bankAccount config
  // update bankAccount config
  updateBankAccountConfig = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "bankaccountconfig/update-bank-account-config",
      payload,
      query
    );
  };

  // update giving option (syncs the Paystack subaccount)
  updateGivingOption = (
    payload: GivingOptionPayload,
    query?: QueryType
  ): Promise<ApiResponse<GivingOption>> => {
    return this.apiExecution.updateData(
      "givingoption/update-giving-option",
      payload,
      query
    );
  };

  // restore an archived giving option
  restoreGivingOption = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<GivingOption>> => {
    return this.apiExecution.updateData(
      "givingoption/restore-giving-option",
      payload,
      query
    );
  };

  // update tithe breakdown config
  updateTitheBreakdownConfig = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "tithebreakdownconfig/update-tithe-breakdown-config",
      payload,
      query
    );
  }

  // update financial
  updateFinancial = (
    payload: FinanceMutationRequest,
    query?: QueryType
  ): Promise<ApiResponse<FinancialRecord>> => {
    return this.apiExecution.updateData(
      "financials/update-financial",
      payload,
      query
    );
  };

  updatePledge = (
    payload: PledgeMutationPayload,
    query?: QueryType
  ): Promise<ApiResponse<PledgeDetail>> => {
    return this.apiExecution.updateData("pledges/update-pledge", payload, query);
  };

  updateAiCredential = (
    id: string,
    payload: UpdateAiCredentialPayload
  ): Promise<ApiResponse<AiCredentialRecord>> => {
    return this.apiExecution.updateData(`ai/credentials/${id}`, payload);
  };

  approveJoinRequest = (
    payload: ApproveJoinRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData(
      "department-join-request/approve",
      payload
    );
  };

  declineJoinRequest = (
    payload: DeclineJoinRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData(
      "department-join-request/decline",
      payload
    );
  };

  approveMembershipRequest = (
    payload: DecideMembershipRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData("user/membership-requests/approve", payload);
  };

  declineMembershipRequest = (
    payload: DecideMembershipRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData("user/membership-requests/decline", payload);
  };

  markNotificationRead = (
    notificationId: string,
    payload: Record<string, never> = {}
  ): Promise<ApiResponse<unknown>> => {
    if (!notificationId) {
      throw new Error("Notification id is required to mark as read");
    }

    return this.apiExecution.patchData(
      `notifications/${notificationId}/read`,
      payload
    );
  };

  markNotificationUnread = (
    notificationId: string,
    payload: Record<string, never> = {}
  ): Promise<ApiResponse<unknown>> => {
    if (!notificationId) {
      throw new Error("Notification id is required to mark as unread");
    }

    return this.apiExecution.patchData(
      `notifications/${notificationId}/unread`,
      payload
    );
  };

  markAllNotificationsRead = (
    payload: Record<string, never> = {}
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.patchData("notifications/read-all", payload);
  };

  updateNotificationPreference = (
    notificationType: string,
    payload: UpdateNotificationPreferencePayload
  ): Promise<ApiResponse<unknown>> => {
    if (!notificationType?.trim()) {
      throw new Error("Notification type is required to update preferences");
    }

    return this.apiExecution.patchData(
      `notifications/preferences/${encodeURIComponent(notificationType)}`,
      payload
    );
  };

  // Ride to church (safety team / church office)
  resolveRideReport = (
    id: number,
    payload: { resolution_note?: string }
  ): Promise<ApiResponse<{ id: number; status: string }>> => {
    return this.apiExecution.patchData(
      `rides/admin/reports/${id}/resolve`,
      payload
    );
  };

  updateRidePickupPoint = (
    id: number,
    payload: SaveRidePickupPointDto
  ): Promise<ApiResponse<AdminRidePickupPoint>> => {
    return this.apiExecution.updateData(
      `rides/admin/pickup-points/${id}`,
      payload
    );
  };

  updateRideArea = (
    id: number,
    payload: SaveRideAreaDto
  ): Promise<ApiResponse<AdminRideArea>> => {
    return this.apiExecution.updateData(`rides/admin/areas/${id}`, payload);
  };
}
