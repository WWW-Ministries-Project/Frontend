export type DepartmentType = {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
}