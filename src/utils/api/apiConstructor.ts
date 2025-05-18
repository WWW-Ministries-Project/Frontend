import { baseUrl as url } from "@/pages/Authentication/utils/helpers";
import {
  ApiCallOptions,
  ApiResponse,
  PayloadExecutorType,
  QueryExecutorType,
  QueryType,
} from "../interfaces";
export class ApiExecution {
  baseUrl: string;
  fetchExecutor?: QueryExecutorType;
  deleteExecutor?: QueryExecutorType;
  postExecutor?: PayloadExecutorType;
  updateExecutor?: PayloadExecutorType;
  patchExecutor?: PayloadExecutorType;

  constructor({
    baseUrl = url,
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

  fetchData<T>(path: string, query?: QueryType): Promise<ApiResponse<T>> {
    if (!this.fetchExecutor) throw new Error("Fetch executor not defined");
    return this.fetchExecutor(this.baseUrl, path, query);
  }

  deleteData<T>(
    path: string,
    query?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    if (!this.deleteExecutor) throw new Error("Delete executor not defined");
    return this.deleteExecutor(this.baseUrl, path, query);
  }

  postData<T>(path: string, payload: unknown): Promise<ApiResponse<T>> {
    if (!this.postExecutor) throw new Error("Post executor not defined");
    return this.postExecutor(this.baseUrl, path, payload);
  }

  updateData<T, K>(
    path: string,
    payload: K,
    query?: QueryType
  ): Promise<ApiResponse<T>> {
    if (!this.updateExecutor) throw new Error("Update executor not defined");
    return this.updateExecutor(this.baseUrl, path, payload, query);
  }

  patchData<T, K>(
    path: string,
    payload: K,
    query?: QueryType
  ): Promise<ApiResponse<T>> {
    if (!this.patchExecutor) throw new Error("Patch executor not defined");
    return this.patchExecutor(this.baseUrl, path, payload, query);
  }
}
