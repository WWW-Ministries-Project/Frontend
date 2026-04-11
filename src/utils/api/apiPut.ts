import { LifeCenterMemberForm } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterMemberForm";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { ISoulsWonForm } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWonForm";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { patchData, updateData } from "./apiFunctions";
import { AssetPayloadType } from "./assets/interfaces";
import { LifeCenterType } from "./lifeCenter/interfaces";
import {
  activateMemberPayloadType,
  activateMemberType,
} from "./members/interfaces";
import {
  CohortPayloadType,
  ReorderProgramTopicsPayload,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import {
  FollowUpPayloadType,
  VisitorType,
  VisitPayloadType,
} from "./visitors/interfaces";
import { EventType } from "./events/interfaces";
import type { IMarket, IProductType, IProduct } from "./marketPlace/interface";
import type {
  Appointment,
  StaffAvailability,
  UpdateAppointmentBookingPayload,
  UpdateAppointmentStatusPayload,
  UpdateStaffAvailabilityPayload,
} from "./appointment/interfaces";
import type {
  AiCredentialRecord,
  UpdateAiCredentialPayload,
} from "./ai/interfaces";
import type { FinanceData, FinancialRecord } from "./finance/interface";
import type { UpdateNotificationPreferencePayload } from "./notifications/interfaces";

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

  // Update Asset
  updateAsset = (payload: AssetPayloadType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("assets/update-asset", payload);
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
  updateDepartment = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "department/update-department",
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

  // Update Program
  updateProgram = (
    payload: ProgramsPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/program`, payload, query);
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
    return this.apiExecution.updateData(`program/complete-topic
`, payload);
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
  ): Promise<ApiResponse<ISoulsWonForm>> => {
    return this.apiExecution.updateData("lifecenter/soulwon", payload, query);
  };

  updateLifeCenterRole = (
    payload: ILifeCernterRoles,
    query?: QueryType
  ): Promise<ApiResponse<ILifeCernterRoles>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-role",
      payload,
      query
    );
  };

  updateLifeCenterMember = (
    payload: LifeCenterMemberForm,
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterMemberForm>> => {
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

  // uodate church attendance
  updateChurchAttendance = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/church-attendance", payload, query);
  }

  // update annual theme
  updateAnnualTheme = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("theme/update-theme", payload, query);
}

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
    payload: FinanceData,
    query?: QueryType
  ): Promise<ApiResponse<FinancialRecord>> => {
    return this.apiExecution.updateData(
      "financials/update-financial",
      payload,
      query
    );
  };

  updateAiCredential = (
    id: string,
    payload: UpdateAiCredentialPayload
  ): Promise<ApiResponse<AiCredentialRecord>> => {
    return this.apiExecution.updateData(`ai/credentials/${id}`, payload);
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
}
