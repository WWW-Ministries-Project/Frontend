import type { MembersType } from "../members/interfaces";

export type DepartmentType = {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
  member_count?: number;
};

export type DepartmentDetailsType = DepartmentType & {
  members: MembersType[];
};
