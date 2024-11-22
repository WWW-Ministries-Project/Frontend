import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { deleteData, fetchData, postData } from "./helperFunctions";
import type { ApiCallOptions, ApiResponse } from "./interfaces";

// Define the ApiExecution class
class ApiExecution {
  baseUrl: string;
  fetchExecutor?: (
    baseUrl: string,
    path: string,
    query?: Record<string, any>
  ) => Promise<ApiResponse<any>>;
  deleteExecutor?: (
    baseUrl: string,
    path: string,
    query?: Record<string, any>
  ) => Promise<ApiResponse<any>>;
  postExecutor?: (
    baseUrl: string,
    path: string,
    payload: Record<string, any>
  ) => Promise<ApiResponse<any>>;

  constructor({
    baseUrl = "https://wwm-bk.greatsohis.online/",
    fetchExecutor,
    deleteExecutor,
    postExecutor,
  }: ApiCallOptions) {
    this.baseUrl = baseUrl;
    this.fetchExecutor = fetchExecutor;
    this.deleteExecutor = deleteExecutor;
    this.postExecutor = postExecutor;
  }

  fetchData<T>(
    path: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (!this.fetchExecutor) throw new Error("Fetch executor not defined");
    return this.fetchExecutor(this.baseUrl, path, query);
  }

  deleteData<T>(
    path: string,
    query?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (!this.deleteExecutor) throw new Error("Delete executor not defined");
    return this.deleteExecutor(this.baseUrl, path, query);
  }

  postData<T>(
    path: string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (!this.postExecutor) throw new Error("Post executor not defined");
    return this.postExecutor(this.baseUrl, path, payload);
  }
}

class ApiCalls {
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

  fetchDepartments = (): Promise<any> => {
    return this.fetchFromApi("department/list-departments");
  };
  fetchRequisitions = (
    query?: Record<string, string | number>
  ): Promise<any> => {
    return this.fetchFromApi("requisitions/list-requisition", query);
  };
  fetchRequisitionDetails = (
    query?: Record<string, string | number>
  ): Promise<any> => {
    return this.fetchFromApi("requisitions/get-requisition/", query);
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

  deleteMember = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("user/delete-user", { id });
  };
  deleteEvent = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("event/delete-event", { id });
  }
}

class ApiCreationCalls {
  private apiExecution: ApiExecution;
  constructor() {
    this.apiExecution = new ApiExecution({
      postExecutor: postData,
    });
  }
  private postToApi<T>(
    path: string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.postData(path, payload);
  }

  createMember = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/register", payload);
  };
  createRequisition = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("requisitions/create-requisition", payload);
  };

  updateMember = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    //todo :speak to BE TO UPDATE THIS TO PUT
    return this.postToApi<T>("user/update-user", payload);
  };
}

class UnifiedApi {
  fetch: ApiCalls;
  delete: ApiDeletionCalls;
  post: ApiCreationCalls;

  constructor() {
    this.fetch = new ApiCalls();
    this.delete = new ApiDeletionCalls();
    this.post = new ApiCreationCalls();
  }
}

// Create an instance of the unified API class and export it
export default new UnifiedApi();
