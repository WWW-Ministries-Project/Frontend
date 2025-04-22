export interface pictureType {
  picture: Blob | string;
  src: string;
}

export interface ApiResponse<T> {
  success: any;
  error: string;
  status: number;
  data: T;
}

export type QueryType = Record<string, string>;
export type QueryExecutorType = <T>(
  baseUrl: string,
  path: string,
  query?: QueryType
) => Promise<ApiResponse<T>>;

export type PayloadExecutorType = <T, K>(
  baseUrl: string,
  path: string,
  payload: K,
  query?: QueryType
) => Promise<ApiResponse<T>>;
export interface ApiCallOptions {
  baseUrl?: string;
  fetchExecutor?: QueryExecutorType;
  deleteExecutor?: QueryExecutorType;
  postExecutor?: PayloadExecutorType;
  updateExecutor?: PayloadExecutorType;
}

export interface userType {
  id: string;
  email: string;
  name: string;
  permissions: Record<string, boolean>;
}
