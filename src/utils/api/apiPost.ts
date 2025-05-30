import type { ApiResponse } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { postData } from "./apiFunctions";
import { AssetPayloadType } from "./assets/interfaces";
import { ProgramsPayloadType } from "./ministrySchool/interfaces";
import { DepartmentType } from "./settings/departmentInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import type {
  FollowUpPayloadType,
  VisitPayloadType,
} from "./visitors/interfaces";

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
  createEvent = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("event/create-event", payload);
  };
  createAsset = <T>(payload: AssetPayloadType): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("assets/create-asset", payload);
  };
  // createRequisition = <T>(
  //   payload: Record<string, any>
  // ): Promise<ApiResponse<T>> => {
  //   return this.postToApi<T>("requisitions/create-requisition", payload);
  // };
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
  createCohort = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/cohorts", payload);
  };

  // Create Course
  createCourse = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/courses", payload);
  };

  // Enroll User
  enrollUser = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/enroll", payload);
  };

  // Unenroll User
  unenrollUser = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("program/unenroll", payload);
  };

  forgotPassword = <T>(
    payload: unknown
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/forgot-password", payload);
  };

  /*Visitor Management*/
  createVisitor = <T>(payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi<T>("visitor/visitors", payload);
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
}
