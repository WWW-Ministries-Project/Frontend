import type { MembersType } from "../members/interfaces";

export type DepartmentStatus = "OPEN" | "CLOSED";

export type DepartmentType = {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
  member_count?: number;
  status?: DepartmentStatus;
};

export type DepartmentDetailsType = DepartmentType & {
  members: MembersType[];
};

/**
 * The API stores `department_head`, `branch_id` and the audit columns as
 * integers, and Prisma rejects the whole write if one of them arrives as a
 * string. Keep these fields numeric here so a stringly-typed id from a store
 * fails at build time rather than as a 500 from the server.
 */
export type DepartmentMutationPayload = {
  name: string;
  description?: string;
  department_head?: number;
  /** "" means "inherit the default branch", which the API resolves. */
  branch_id?: number | "";
  status?: DepartmentStatus;
  /**
   * Ignored by current backends, which take the actor from the auth token.
   * Still sent so the client keeps working against older deployments.
   */
  created_by?: number;
};

export type CreateDepartmentPayload = DepartmentMutationPayload;

export type UpdateDepartmentPayload = DepartmentMutationPayload & {
  id: number;
};
