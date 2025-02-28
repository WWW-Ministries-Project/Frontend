import { assetType } from "@/pages/HomePage/pages/AssetsManagement/utils/assetsInterface";
import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { ApiExecution } from "./apiConstructor";
import { fetchData } from "./helperFunctions";
import type { ApiResponse } from "./interfaces";

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

  fetchAllMembers = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: UserType[] }>> => {
    return this.fetchFromApi("user/list-users", query);
  };
  fetchAMember = (
    query?: Record<string, any>
  ): Promise<ApiResponse<{ data: UserType }>> => {
    return this.fetchFromApi("user/get-user", query);
  };

  fetchUserStats = (): Promise<any> => {
    return this.fetchFromApi("user/stats-users");
  };

  fetchEvents = (query?: Record<string, any>): Promise<any> => {
    return this.fetchFromApi("event/list-events", query);
  };

  fetchPositions = (): Promise<any> => {
    return this.fetchFromApi("position/list-positions");
  };

  fetchAssets = (): Promise<any> => {
    return this.fetchFromApi("assets/list-assets");
  };
  fetchAnAsset = (query?: Record<string, any>): Promise<{data: assetType}> => {
    return this.fetchFromApi("assets/get-asset",query);
  };


  fetchDepartments = (): Promise<any> => {
    return this.fetchFromApi("department/list-departments");
  };
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

  fetchMyRequests = (
    query?: Record<string, string | number>
  ): Promise<any> => {
    return this.fetchFromApi("requisitions/my-requisitions", query);
  };
}
