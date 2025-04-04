import { baseUrl as url } from "@/pages/Authentication/utils/helpers";
import { ApiCallOptions, ApiResponse } from "../interfaces";
export class ApiExecution {
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
  updateExecutor?: (
    baseUrl: string,
    path: string,
    payload: Record<string, any>
  ) => Promise<ApiResponse<any>>;

  constructor({
    baseUrl=url ,
    fetchExecutor,
    deleteExecutor,
    postExecutor,
    updateExecutor,
  }: ApiCallOptions) {
    this.baseUrl = baseUrl!;
    this.fetchExecutor = fetchExecutor;
    this.deleteExecutor = deleteExecutor;
    this.postExecutor = postExecutor;
    this.updateExecutor = updateExecutor;
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

  updateData<T>(
    path: string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (!this.updateExecutor) throw new Error("Update executor not defined");
    return this.updateExecutor(this.baseUrl, path, payload);
  }
}
