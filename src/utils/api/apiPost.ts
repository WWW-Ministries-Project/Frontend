import { LifeCenterMemberForm } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterMemberForm";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { ISoulsWonForm } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWonForm";
import type { ApiResponse } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { postData } from "./apiFunctions";
import { AssetPayloadType } from "./assets/interfaces";
import { LifeCenterType } from "./lifeCenter/interfaces";
import {
  CohortPayloadType,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import { DepartmentType } from "./settings/departmentInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import type {
  FollowUpPayloadType,
  VisitPayloadType,
} from "./visitors/interfaces";
import { EventType } from "./events/interfaces";
import type {
  IMarket,
  IProductType,
  IProduct,
  ICheckOut,
  CheckOutResponse,
  RetryOrderPaymentPayload,
} from "./marketPlace/interface";
import {
  Appointment,
  CreateAppointmentBookingPayload,
  CreateStaffAvailabilityPayload,
  StaffAvailability,
} from "./appointment/interfaces";
import type { FinanceData, FinancialRecord } from "./finance/interface";
import type {
  RequisitionApprovalActionPayload,
  RequisitionApprovalConfig,
  RequisitionApprovalConfigPayload,
  SubmitRequisitionPayload,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";

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

  createMember = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/register", payload);
  };
  createEvent = (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/create-event", payload);
  };

  createUniqueEvent = (payload: EventType): Promise<ApiResponse<EventType>> => {
    return this.postToApi<EventType>("event/create-event-type", payload);
  };

  createAsset = (
    payload: AssetPayloadType
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("assets/create-asset", payload);
  };
  createRequisition = <T = unknown>(
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("requisitions/create-requisition", payload);
  };
  upsertRequisitionApprovalConfig = (
    payload: RequisitionApprovalConfigPayload
  ): Promise<ApiResponse<RequisitionApprovalConfig>> => {
    return this.postToApi("requisitions/upsert-approval-config", payload);
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
  createAccessRight = <T>(payload: unknown): Promise<ApiResponse<T>> =>
    this.postToApi<T>("access/create-access-level", payload);

  createDepartment = (
    payload: unknown
  ): Promise<ApiResponse<DepartmentType[]>> => {
    return this.postToApi("department/create-department", payload);
  };
  createPosition = (payload: unknown): Promise<ApiResponse<PositionType[]>> => {
    return this.postToApi("position/create-position", payload);
  };

  // Create Program
  createProgram = (payload: ProgramsPayloadType): Promise<unknown> => {
    return this.postToApi("program/program", payload);
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

  // Submit Assignments
  

  // Unenroll User
  unenrollUser = <T>(
    payload: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/unenroll", payload);
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
    payload: LifeCenterType
  ): Promise<ApiResponse<LifeCenterType>> => {
    return this.postToApi("lifecenter/create-lifecenter", payload);
  };

  createSoul = (payload: ISoulsWonForm): Promise<ApiResponse<undefined>> => {
    return this.postToApi("lifecenter/soulwon", payload);
  };

  createLifeCenterRole = (
    payload: ILifeCernterRoles
  ): Promise<ApiResponse<{ id: string; name: string }>> => {
    return this.postToApi("lifecenter/create-role", payload);
  };

  createLifeCenterMember = (
    payload: LifeCenterMemberForm
  ): Promise<ApiResponse<LifeCenterMemberForm>> => {
    return this.postToApi("lifecenter/add-lifecenter-member", payload);
  };

  //marketPlace
  createMarket = (
    payload: Omit<IMarket, "id" | "event_name">
  ): Promise<ApiResponse<IMarket>> => {
    return this.postToApi("market/create-market", payload);
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

  // Record Attendance
  recordChurchAttendance = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/church-attendance", payload);
  }

  registerEvent = (payload: {
    event_id: string | number;
  }): Promise<ApiResponse<unknown>> => {
    return this.postToApi("event/register", payload);
  };

  //Create theme
  createAnnualTheme = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("theme/create-theme", payload);
  }

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

  // create tithe breakdown config
  createTitheBreakdownConfig = (
    payload: unknown
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("tithebreakdownconfig/create-tithe-breakdown-config", payload); 
  }

  // create financial
  createFinancial = (
    payload: FinanceData
  ): Promise<ApiResponse<FinancialRecord>> => {
    return this.postToApi("financials/create-financial", payload);
  };
}
