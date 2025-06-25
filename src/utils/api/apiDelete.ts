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
    return this.deleteFromApi<void>("lifecenter/remove-lifecenter-member", query);
  };
}
