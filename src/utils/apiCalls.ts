import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { deleteData, fetchData } from "./helperFunctions";
import type { ApiCallOptions, ApiResponse } from "./interfaces";

// Define the ApiExecution class
class ApiExecution {
  baseUrl: string;
  fetchExecutor?: (baseUrl: string, path: string) => Promise<ApiResponse<any>>;
  deleteExecutor?: (
    baseUrl: string,
    path: string,
    query?: Record<string, any>
  ) => Promise<ApiResponse<any>>;

  constructor({
    baseUrl = "https://wwm-bk.greatsohis.online/",
    fetchExecutor,
    deleteExecutor,
  }: ApiCallOptions) {
    this.baseUrl = baseUrl;
    this.fetchExecutor = fetchExecutor;
    this.deleteExecutor = deleteExecutor;
  }

  fetchData<T>(path: string): Promise<ApiResponse<T>> {
    if (!this.fetchExecutor) throw new Error("Fetch executor not defined");
    return this.fetchExecutor(this.baseUrl, path);
  }

  deleteData<T>(
    path: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (!this.deleteExecutor) throw new Error("Delete executor not defined");
    return this.deleteExecutor(this.baseUrl, path, query);
  }
}

class ApiCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      fetchExecutor: fetchData,
    });
  }

  private fetchFromApi<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.apiExecution.fetchData(endpoint);
  }

  fetchAllMembers = (): Promise<ApiResponse<{data:UserType[]}>> => {
    return this.fetchFromApi("user/list-users");
  };

  fetchUserStats = (): Promise<any> => {
    return this.fetchFromApi("user/stats-users");
  };

  fetchUpcomingEvents = (): Promise<any> => {
    return this.fetchFromApi("event/list-events");
  };

  fetchPositions = (): Promise<any> => {
    return this.fetchFromApi("position/list-positions");
  };

  fetchDepartments = (): Promise<any> => {
    return this.fetchFromApi("department/list-departments");
  };
  fetchRequisitions = (): Promise<any> => {
    return this.fetchFromApi("requisitions/list-requisition");
  };
}

class ApiDeletionCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      deleteExecutor: deleteData,
    });
  }

  private deleteFromApi<T>(path: string, query: {}): Promise<ApiResponse<T>> {
    return this.apiExecution.deleteData(path, query);
  }

  deleteMember = (id: string): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("user/delete-user", { id });
  };
}

class UnifiedApi {
  fetch: ApiCalls;
  delete: ApiDeletionCalls;

  constructor() {
    this.fetch = new ApiCalls();
    this.delete = new ApiDeletionCalls();
  }
}

// Create an instance of the unified API class and export it
export default new UnifiedApi();
