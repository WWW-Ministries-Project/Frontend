import { assetType } from "@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { fetchData } from "./apiFunctions";
import { EventResponseType, EventType } from "./events/interfaces";
import {
  LifeCenterDetailsType,
  LifeCenterMemberType,
  LifeCenterStatsType,
  LifeCenterType,
} from "./lifeCenter/interfaces";
import type {
  IMarket,
  IProduct,
  IProductType,
  IProductTypeResponse,
} from "./marketPlace/interface";
import { IMemberInfo, MembersType, UserStatsType } from "./members/interfaces";
import {
  DetailedCohortType,
  DetailedCourseType,
  EnrollmentDataType,
  ProgramResponse,
  Programs,
} from "./ministrySchool/interfaces";
import { DepartmentType } from "./settings/departmentInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import { VisitorDetailsType, VisitorType } from "./visitors/interfaces";

export class ApiCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      fetchExecutor: fetchData,
    });
  }

  private fetchFromApi<T>(
    endpoint: string,
    query?: QueryType
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.fetchData(endpoint, query);
  }

  // Members Management
  fetchAllMembers = (
    query?: QueryType
  ): Promise<ApiResponse<MembersType[]>> => {
    return this.fetchFromApi("user/list-users", query);
  };
  fetchMembersForOptions = (
    query?: QueryType
  ): Promise<ApiResponse<MembersType[]>> => {
    return this.fetchFromApi("user/list-users-light", query);
  };

  fetchAMember = (query?: QueryType): Promise<ApiResponse<IMemberInfo>> => {
    return this.fetchFromApi("user/get-user", query);
  };

  fetchUserStats = (): Promise<ApiResponse<UserStatsType>> => {
    return this.fetchFromApi("user/stats-users");
  };

  // Visit Management
  fetchAllVisitors = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorType[]>> => {
    return this.fetchFromApi("visitor/visitors", query);
  };

  fetchVisitorById = (
    query?: QueryType
  ): Promise<ApiResponse<VisitorDetailsType>> => {
    return this.fetchFromApi(`visitor/visitor`, query);
  };

  fetchAllVisits = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("visit", query);
  };

  fetchVisitById = (id: string, query?: QueryType): Promise<unknown> => {
    return this.fetchFromApi(`visit/${id}`, query);
  };

  fetchAllVisitsByVisitorId = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`visitor/visit/visitor`, query);
  };
  // Event Management
  fetchEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType[]>> => {
    return this.fetchFromApi("event/list-events", query);
  };

  fetchUpcomingEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventResponseType[]>> => {
    return this.fetchFromApi("event/upcoming-events", query);
  };

  // Position Management
  fetchPositions = (
    query?: QueryType
  ): Promise<ApiResponse<PositionType[]>> => {
    return this.fetchFromApi("position/list-positions", query);
  };

  // Department Management
  fetchDepartments = (
    query?: QueryType
  ): Promise<ApiResponse<DepartmentType[]>> => {
    return this.fetchFromApi("department/list-departments", query);
  };

  // Asset Management
  fetchAssets = (): Promise<ApiResponse<assetType[]>> => {
    return this.fetchFromApi("assets/list-assets");
  };
  fetchAnAsset = (query?: QueryType): Promise<ApiResponse<assetType>> => {
    return this.fetchFromApi("assets/get-asset", query);
  };

  // Access Levels
  fetchAccessLevels = (
    query?: QueryType
  ): Promise<ApiResponse<AccessRight[]>> => {
    return this.fetchFromApi("access/list-access-levels", query);
  };
  fetchAnAccess = (query?: QueryType): Promise<ApiResponse<AccessRight>> => {
    return this.fetchFromApi("access/get-access-level", query);
  };

  // // Requisition Management
  // fetchRequisitions = (query?: QueryType): Promise<unknown> => {
  //   return this.fetchFromApi("requisitions/staff-requisition", query);
  // };

  // fetchRequisitionDetails = (query?: QueryType): Promise<unknown> => {
  //   return this.fetchFromApi("requisitions/get-requisition/", query);
  // };

  // fetchMyRequests = (query?: Record<string, string | number>): Promise<unknown> => {
  //   return this.fetchFromApi("requisitions/my-requisitions", query);
  // };

  // Program Management
  fetchAllPrograms = (
    query?: QueryType
  ): Promise<ApiResponse<ProgramResponse[]>> => {
    return this.fetchFromApi("program/programs", query);
  };

  fetchAllApplicablePrograms = (
    query?: QueryType
  ): Promise<ApiResponse<Programs[]>> => {
    return this.fetchFromApi("program/get-member-programs", query);
  };

  fetchProgramById = (
    query?: QueryType
  ): Promise<ApiResponse<ProgramResponse>> => {
    return this.fetchFromApi(`program/program`, query);
  };
  // @Jojo please the name is confusing
  fetchMembers = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/users", query);
  };

  fetchUserByEmailAndCohort = (
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi("user/get-user-email", query);
  };

  // Cohort Management
  fetchAllCohorts = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/cohorts", query);
  };

  fetchCohortById = (
    query?: QueryType
  ): Promise<ApiResponse<DetailedCohortType>> => {
    return this.fetchFromApi(`program/cohort`, query);
  };

  fetchCohortsByProgramId = (
    programId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi(`program/program-cohorts/${programId}`, query);
  };

  // Course Management
  fetchAllCourses = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/courses", query);
  };

  fetchCourseById = (
    query?: QueryType
  ): Promise<ApiResponse<DetailedCourseType>> => {
    return this.fetchFromApi(`program/course`, query);
  };

  fetchStudentById = (
    query?: QueryType
  ): Promise<ApiResponse<EnrollmentDataType>> => {
    return this.fetchFromApi(`program/progress`, query);
  };

  // Enrollment Management
  fetchEnrollmentsByCourse = (
    courseId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/course-enrollment", query);
  };

  fetchEnrollmentsByUser = (
    userId: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("program/user-enrollment", query);
  };

  fetchEnrollmentsByUserId = (
    query?: QueryType
  ): Promise<ApiResponse<EnrollmentDataType>> => {
    return this.fetchFromApi(`program/my-enrollment`, query);
  };

  // Follow-Up Management
  fetchAllFollowUps = (query?: QueryType): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("followup", query);
  };

  fetchFollowUpById = (
    id: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`followup/${id}`, query);
  };

  // Prayer Request Management
  fetchAllPrayerRequests = (
    query?: QueryType
  ): Promise<ApiResponse<unknown[]>> => {
    return this.fetchFromApi("prayerrequest", query);
  };

  fetchPrayerRequestById = (
    id: string,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`prayerrequest/${id}`, query);
  };

  //life center
  fetchAllLifeCenters = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterType[]>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenters`, query);
  };

  fetchLifeCenterById = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterDetailsType>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenter/`, query);
  };

  fetchLifeCenterByUserId = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterDetailsType>> => {
    return this.fetchFromApi(`lifecenter/my-lifecenter/`, query);
  };

  fetchLifeCenterStats = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterStatsType>> => {
    return this.fetchFromApi(`lifecenter/stats`, query);
  };

  fetchAllUniqueEvents = (
    query?: QueryType
  ): Promise<ApiResponse<EventType[]>> => {
    return this.fetchFromApi(`event/get-event-types`, query);
  };

  fetchLifCenterRoles = (
    query?: QueryType
  ): Promise<ApiResponse<ILifeCernterRoles[]>> => {
    return this.fetchFromApi(`lifecenter/get-roles`, query);
  };

  fetchLifCenterMembers = (
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterMemberType[]>> => {
    return this.fetchFromApi(`lifecenter/get-lifecenter-members`, query);
  };

  fetchMarkets = (query?: QueryType): Promise<ApiResponse<IMarket[]>> => {
    return this.fetchFromApi(`market/list-markets`, query);
  };

  fetchMarketById = (query?: QueryType): Promise<ApiResponse<IMarket>> => {
    return this.fetchFromApi(`market/get-market-by-id/`, query);
  };

  fetchProductTypes = (
    query?: QueryType
  ): Promise<ApiResponse<IProductType[]>> => {
    return this.fetchFromApi(`product/list-product-type`, query);
  };

  fetchProductCategories = (
    query?: QueryType
  ): Promise<ApiResponse<IProductType[]>> => {
    return this.fetchFromApi(`product/list-product-category`, query);
  };

  fetchProductsByMarket = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse[]>> => {
    return this.fetchFromApi(`product/list-products-by-market/`, query);
  };

  fetchProductById = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse>> => {
    return this.fetchFromApi(`product/get-product-by-id/`, query);
  };

  fetchAllProducts = (
    query?: QueryType
  ): Promise<ApiResponse<IProductTypeResponse[]>> => {
    return this.fetchFromApi(`product/list-products`, query);
  };

  //orders
  verifyPayment = (query?: QueryType): Promise<ApiResponse<unknown>> => {
    return this.fetchFromApi(`orders/verify-payment/`, query);
  };
}
