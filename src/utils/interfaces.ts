export interface pictureType {
  picture: Blob | string;
  src: string;
}

export interface IPaginationMeta {
  current_page: number;
  take: number;
  total: number;
  page_size: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: unknown;
  error: string;
  status: number;
  data: T;
  meta?: IPaginationMeta;
}

export type QueryType = Record<string, string | number>;
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
  patchExecutor?: PayloadExecutorType;
}

export interface userType {
  id: string;
  member_id?: string;
  email: string;
  name: string;
  permissions: Record<string, boolean>;
  access_permissions?: Record<string, unknown>;
  user_category?: "member" | "admin" | string;
  profile_img?: string;
  phone: string | null;
  member_since?: string | Date | null;
  membership_type: string;
  ministry_worker: boolean;
  department?: string[];
  department_positions?: Array<string | Record<string, unknown>>;
  life_center_leader?: boolean;
  instructor?: boolean;
}
export interface userTypeWithToken
  extends Omit<userType, "permissions" | "access_permissions"> {
  permissions?: Record<string, unknown> | string[] | null;
  access_permissions?: Record<string, unknown>;
  iat: number;
  exp: number;
}
