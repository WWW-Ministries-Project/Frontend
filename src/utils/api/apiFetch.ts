import { assetType } from "@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface";
import { IMemberInfo } from "@/pages/HomePage/pages/Members/utils";
import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { ApiResponse } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { fetchData } from "./apiFunctions";

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

  // User Management
  fetchAllMembers = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: UserType[] }>> => {
    return this.fetchFromApi("user/list-users", query);
  };
  fetchAMember = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: IMemberInfo }>> => {
    return this.fetchFromApi("user/get-user", query);
  };

  // Fetch User Stats
  fetchUserStats = (): Promise<any> => {
    return this.fetchFromApi("user/stats-users");
  };

  // Event Management
  fetchEvents = (query?: Record<string, any>): Promise<any> => {
    return this.fetchFromApi("event/list-events", query);
  };

  // Position Management
  fetchPositions = (): Promise<any> => {
    return this.fetchFromApi("position/list-positions");
  };

  // Asset Management
  fetchAssets = (): Promise<any> => {
    return this.fetchFromApi("assets/list-assets");
  };
  fetchAnAsset = (
    query?: Record<string, any>
  ): Promise<{ data: assetType }> => {
    return this.fetchFromApi("assets/get-asset", query);
  };

  // Department Management
  fetchDepartments = (): Promise<any> => {
    return this.fetchFromApi("department/list-departments");
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

  // Access Levels
  fetchAccessLevels = (
    query?: Record<string, string | number>
  ): Promise<ApiResponse<{ data: AccessRight[] }>> => {
    return this.fetchFromApi("access/list-access-levels", query);
  };
  fetchAnAccess = (
    query?: Record<string, string | number>
  ): Promise<ApiResponse<{ data: AccessRight }>> => {
    return this.fetchFromApi("access/get-access-level", query);
  };

  fetchMyRequests = (query?: Record<string, string | number>): Promise<any> => {
    return this.fetchFromApi("requisitions/my-requisitions", query);
  };

  // Program Management
  fetchAllPrograms = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/programs", query);
  };

  fetchProgramById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any }>> => {
    return this.fetchFromApi(`program/programs/${id}`, query);
  };

  // Cohort Management
  fetchAllCohorts = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/cohorts", query);
  };

  fetchCohortById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any }>> => {
    return this.fetchFromApi(`program/cohorts/${id}`, query);
  };

  fetchCohortsByProgramId = (
    programId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi(`program/program-cohorts/${programId}`, query);
  };

  // Course Management
  fetchAllCourses = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/courses", query);
  };

  fetchCourseById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any }>> => {
    return this.fetchFromApi(`program/courses/${id}`, query);
  };

  fetchStudentById = (
    id: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any }>> => {
    return this.fetchFromApi(`program/progress/${id}`, query);
  };

  // Enrollment Management
  fetchEnrollmentsByCourse = (
    courseId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/course-enrollment", query);
  };

  fetchEnrollmentsByUser = (
    userId: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/user-enrollment", query);
  };

  fetchMembers = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: any[] }>> => {
    return this.fetchFromApi("program/users", query);
  };
}
