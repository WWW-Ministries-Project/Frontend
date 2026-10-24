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
  // `user/list-users?include_status_counts=true` only.
  status_counts?: Record<string, number>;
}

export interface ApiResponse<T> {
  success: unknown;
  error: string;
  status: number;
  data: T;
  message?: string;
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

/** A user's role in one branch. Roles are global; grants are per branch. */
export interface BranchAccessGrant {
  branch_id: number;
  branch_name: string;
  access_level_id: number;
  access_level_name: string;
  /** Sent by `user/current-user`; absent in the JWT to keep the cookie small. */
  permissions?: Record<string, unknown>;
  /** Home workspace keys this branch's role grants (`user/current-user`). */
  workspaces?: string[];
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
  /** Set on guest (non-member) accounts; members-only features hide for them. */
  is_guest?: boolean | null;
  /** The member's home branch. */
  branch_id?: number | null;
  branch_name?: string | null;
  /** Admins only: the branches they can work in and their role in each. */
  branch_access?: BranchAccessGrant[];
}
export interface userTypeWithToken
  extends Omit<userType, "permissions" | "access_permissions"> {
  permissions?: Record<string, unknown> | string[] | null;
  access_permissions?: Record<string, unknown>;
  iat: number;
  exp: number;
}
