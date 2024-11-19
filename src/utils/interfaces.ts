export interface pictureType {
  picture: Blob | string;
  src: string;
}

export interface ApiResponse<T> {
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
  ) => Promise<ApiResponse<any>>;
  postExecutor?: (
    baseUrl: string,
    path: string,
    payload: Record<string, any>
  ) => Promise<ApiResponse<any>>;
}
