import { api } from "@/utils";
import type { DepartmentStatus, UpdateDepartmentPayload } from "@/utils";

import type { DepartmentRecord } from "./departmentShared";

/**
 * `department/update-department` requires the name on every call. Fields left
 * `undefined` (description, head, branch) are kept as they are on the server.
 */
const baseUpdate = (department: DepartmentRecord): UpdateDepartmentPayload => ({
  id: department.id,
  name: department.name,
});

export const setDepartmentStatus = (
  department: DepartmentRecord,
  status: DepartmentStatus
) => api.put.updateDepartment({ ...baseUpdate(department), status });

export const setDepartmentHead = (
  department: DepartmentRecord,
  memberId: number
) =>
  api.put.updateDepartment({ ...baseUpdate(department), department_head: memberId });

export const deleteDepartment = (departmentId: number) =>
  api.delete.deleteDepartment({ id: String(departmentId) });

/** Sends `department_head: null`, which the API treats as "no head". */
export const clearDepartmentHead = (department: DepartmentRecord) =>
  api.put.updateDepartment({
    ...baseUpdate(department),
    department_head: null,
  } as unknown as UpdateDepartmentPayload);
