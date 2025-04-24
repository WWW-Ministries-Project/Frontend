import { assetType } from "@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface";
import { IMemberInfo } from "@/pages/HomePage/pages/Members/utils";
import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { fetchData } from "./apiFunctions";
import { VisitorType } from "./visitors/interfaces";

export class ApiCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      fetchExecutor: fetchData,
    });
  }

  private fetchFromApi<T>(
    endpoint: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.fetchData(endpoint, query);
  }

  // Members Management
  fetchAllMembers = (
    query?: Record<string, any>
  ): Promise<ApiResponse<UserType[]>> => {
    return this.fetchFromApi("user/list-users", query);
  };

  fetchAMember = (
    query?: Record<string, any>
  ): Promise<ApiResponse<IMemberInfo>> => {
    return this.fetchFromApi("user/get-user", query);
  };


  fetchUserStats = (): Promise<any> => {
    return this.fetchFromApi("user/stats-users");
  };

  // Visit Management
  fetchAllVisits = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("visit", query);
  };

  fetchVisitById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`visit/${id}`, query);
  };

  fetchAllVisitsByVisitorId = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi(`visitor/visit/visitor/${id}`, query);
  };
  fetchAllVisitors = (
    query?: Record<string, any>
  ): Promise<ApiResponse<VisitorType[]>> => {
    return this.fetchFromApi("visitor/visitors", query);
  };

  fetchVisitorById = (
    query?: QueryType
  ): Promise<ApiResponse<{ data: any }>> => {
    return this.fetchFromApi(`visitor/visitors`, query);
  };

  // Event Management
  fetchEvents = (query?: Record<string, any>): Promise<any> => {
    return this.fetchFromApi("event/list-events", query);
  };

  // Position Management
  fetchPositions = (): Promise<any> => {
    return this.fetchFromApi("position/list-positions");
  };

  // Department Management
  fetchDepartments = (): Promise<any> => {
    return this.fetchFromApi("department/list-departments");
  };

  // Asset Management
  fetchAssets = (): Promise<any> => {
    return this.fetchFromApi("assets/list-assets");
  };
  fetchAnAsset = (
    query?: Record<string, any>
  ): Promise<ApiResponse<assetType>> => {
    return this.fetchFromApi("assets/get-asset", query);
  };

  // Access Levels
  fetchAccessLevels = (
    query?: Record<string, string | number>
  ): Promise<ApiResponse<AccessRight[]>> => {
    return this.fetchFromApi("access/list-access-levels", query);
  };
  fetchAnAccess = (
    query?: Record<string, string | number>
  ): Promise<ApiResponse<AccessRight>> => {
    return this.fetchFromApi("access/get-access-level", query);
  };

  // Requisition Management
  fetchRequisitions = (
    query?: Record<string, string | number>
  ): Promise<any> => {
    return this.fetchFromApi("requisitions/staff-requisition", query);
  };

  fetchRequisitionDetails = (
    query?: Record<string, string | number>
  ): Promise<any> => {
    return this.fetchFromApi("requisitions/get-requisition/", query);
  };

  fetchMyRequests = (query?: Record<string, string | number>): Promise<any> => {
    return this.fetchFromApi("requisitions/my-requisitions", query);
  };

  // Program Management
  fetchAllPrograms = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/programs", query);
  };

  fetchProgramById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`program/programs/${id}`, query);
  };
// @Jojo please the name is confusing
  fetchMembers = (query?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/users", query);
  };

  fetchUserByEmailAndCohort = (
    email: string,
    cohortId: number,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi("user/get-user-email", {
      ...query,
      email,
      cohortId
    });
  };

  // Cohort Management
  fetchAllCohorts = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/cohorts", query);
  };

  fetchCohortById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`program/cohorts/${id}`, query);
  };

  fetchCohortsByProgramId = (
    programId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi(`program/program-cohorts/${programId}`, query);
  };

  // Course Management
  fetchAllCourses = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/courses", query);
  };

  fetchCourseById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`program/courses/${id}`, query);
  };

  fetchStudentById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`program/progress/${id}`, query);
  };

  // Enrollment Management
  fetchEnrollmentsByCourse = (
    courseId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/course-enrollment", query);
  };

  fetchEnrollmentsByUser = (
    userId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("program/user-enrollment", query);
  };

  // Follow-Up Management
  fetchAllFollowUps = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("followup", query);
  };

  fetchFollowUpById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`followup/${id}`, query);
  };

  // Prayer Request Management
  fetchAllPrayerRequests = (
    query?: Record<string, any>
  ): Promise<ApiResponse<any[]>> => {
    return this.fetchFromApi("prayerrequest", query);
  };

  fetchPrayerRequestById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    return this.fetchFromApi(`prayerrequest/${id}`, query);
  };
}
