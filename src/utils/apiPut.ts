import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { ApiExecution } from "./apiConstructor";
import { updateData } from "./helperFunctions";
import { ApiResponse } from "./interfaces";

export class ApiUpdateCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      updateExecutor: updateData,
    });
  }

  // Update Event
  updateEvent = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("event/update-event", payload);
  };

  // Update Asset
  updateAsset = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("assets/update-asset", payload);
  };

  // Update Requisition
  updateRequisition = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData<T>(
      "requisitions/update-requisition",
      payload
    );
  };

  // Update Position
  updatePosition = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("position/update-position", payload);
  };

  // Update Department
  updateDepartment = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "department/update-department",
      payload
    );
  };

  // Update Access Level
  updateAccessRight = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("access/update-access-level", payload);
  };

  // Assign Access Level to User
  assignAccessRight = <T>(payload: {
    user_id: string | number;
    access_level_id: string | number;
  }): Promise<ApiResponse<AccessRight>> => {
    return this.apiExecution.updateData(
      "access/assign_access_to_user",
      payload
    );
  };

  // Update Program
  updateProgram = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(`program/programs/${payload.id}`, payload.payload);
  };

  // Update Cohort
  updateCohort = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(`program/cohorts/${payload.id}`, payload.payload);
  };

  // Update Class
  updateClass = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(`program/courses/${payload.id}`, payload);
  };
  // Update Cohort
  updateStudentProgress = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("program/progress-updates", payload);
  };

  // Update Enrollment
  updateEnrollment = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("program/enrollments/update-enrollment", payload);
  };

  // Visitor Management
  updateVisitor = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(`visitor/visitors/${payload.id}`, payload);
  };

  // Visit Management
  updateVisit = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("visitor/visit", payload);
  };

  // Follow-Up Management
  updateFollowUp = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("visitor/followup", payload);
  };

  // Prayer Request Management
  updatePrayerRequest = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("visitor/prayerrequest", payload);
  };
}
