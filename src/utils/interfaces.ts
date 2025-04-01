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

export interface ApiCallOptions {
  baseUrl?: string; // Optional baseUrl
  fetchExecutor?: (baseUrl: string, path: string) => Promise<ApiResponse<any>>;
  deleteExecutor?: (
    baseUrl: string,
    path: string,
    query?: Record<string, any>
  ) => Promise<ApiResponse<any> | undefined>;
  postExecutor?: (
    baseUrl: string,
    path: string,
    payload: Record<string, any>
  ) => Promise<ApiResponse<any> | undefined>;
  updateExecutor?: (
    baseUrl: string,
    path: string,
    payload: Record<string, any>
  ) => Promise<ApiResponse<any> | undefined>;
}

export interface userType {
  id: string;
  email: string;
  name: string;
  permissions: Record<string, boolean>;
}
