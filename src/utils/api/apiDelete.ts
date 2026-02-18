import type { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { deleteData } from "./apiFunctions";

export class ApiDeletionCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      deleteExecutor: deleteData,
    });
  }

  private deleteFromApi<T>(
    path: string,
    query: QueryType
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.deleteData(path, query);
  }

  deleteMember = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("user/delete-user", query);
  };

  deleteEvent = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("event/delete-event", query);
  };

  deleteUniqueEvent = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("event/delete-event-type", query);
  };

  deleteAsset = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("assets/delete-asset", query);
  };

  deleteAccess = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("access/delete-access-level", query);
  };

  deleteRequest = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("requisitions/delete-requisition", query);
  };

  deletePosition = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("position/delete-position", query);
  };

  deleteDepartment = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("department/delete-department", query);
  };

  // New Delete Methods

  deleteProgram = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/program`, query);
  };

  deleteCohort = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/cohort`, query);
  };

  deleteCourse = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/course`, query);
  };

  // delete Topic
  deleteTopic = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/topic`, query);
  }

  /* Visitor Management */
  deleteVisitor = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`visitor/visitor`, query);
  };

  // Visit Management
  deleteVisit = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`visit`, query);
  };

  // Follow-Up Management
  deleteFollowUp = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`followup`, query);
  };

  // Prayer Request Management
  deletePrayerRequest = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`prayerrequest`, query);
  };

  //life center
  deleteLifeCenter = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`lifecenter/delete-lifecenter`, query);
  };

  deleteSoulWon = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("lifecenter/soulwon", query);
  };

  deleteLifeCenterRole = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("lifecenter/delete-role", query);
  };

  deleteLifeCenterMember = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(
      "lifecenter/remove-lifecenter-member",
      query
    );
  };

  //marketplace
  deleteMarket = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("market/delete-market", query);
  };

  deleteProductType = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("product/delete-product-type", query);
  };

  deleteProductCategory = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("product/delete-product-category", query);
  };

  deleteProduct = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("product/delete-product", query);
  };

  deleteStaffAvailability = (query: QueryType): Promise<ApiResponse<void>> => {
    const availabilityId = query?.id;

    if (!availabilityId) {
      throw new Error("Availability id is required for delete");
    }

    return this.apiExecution.deleteData(
      `appointment/availability/${availabilityId}`
    );
  };

  deleteAppointmentBooking = (query: QueryType): Promise<ApiResponse<void>> => {
    const bookingId = query?.id;

    if (!bookingId) {
      throw new Error("Booking id is required for delete");
    }

    return this.apiExecution.deleteData(`appointment/bookings/${bookingId}`);
  };

  // Delete Church Attendance Record
  deleteChurchAttendance = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("event/church-attendance", query);
  }

  // Delete Annual Theme
  deleteAnnualTheme = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("theme/delete-theme", query);
  }

  // delete receipt confiq
  deleteReceiptConfig = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("receiptconfig/delete-receipt-config", query);
  }

  // delete payment config
  deletePaymentConfig = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("paymentconfig/delete-payment-config", query);
  }

  // delete bank account config
  deleteBankAccountConfig = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("bankaccountconfig/delete-bank-account-config", query);
  };

  // delete tithe breakdown config
  deleteTitheBreakdownConfig = (
    query: QueryType
  ): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("tithebreakdownconfig/delete-tithe-breakdown-config", query);
  };
}
