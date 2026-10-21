import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { ExclusionsMap, PermissionValue } from "@/utils/accessControl";

export interface Department {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
  member_count?: number;
  position?: Position[];
  status?: "OPEN" | "CLOSED";
}

export interface DepartmentSlice {
  departments: Department[];
  departmentTotal: number;
  departmentsOptions: ISelectOption[];
  positionOptions: Record<number, ISelectOption[]>;
  addDepartment: (department: Department) => void;
  removeDepartment: (departmentId: number) => void;
  updateDepartment: (updatedDepartment: Department) => void;
  setDepartments: (departments: Department[], total: number) => void;
  setDepartmentsOptions: () => void;
  setPositionOptions: () => void;
}

export interface Position {
  id: number;
  name: string;
}

export interface PositionOption {
  label: string;
  value: number;
}

export interface PositionSlice {
  positions: Position[];
  positionTotal: number;
  // positionsOptions: PositionOption[];
  addPosition: (position: Position) => void;
  removePosition: (positionId: number | string) => void;
  updatePosition: (updatedPosition: Position) => void;
  setPositions: (positions: Position[], total: number) => void;
  // setPositionsOptions: () => void;
}

export type StoreState = DepartmentSlice & PositionSlice;

export interface AccessLevelAssignedUser {
  id: number;
  name?: string;
  full_name?: string;
  user_info?: {
    photo?: string;
  };
}

export interface AccessLevelExclusionUser {
  id: number;
  name?: string;
  full_name?: string;
}

//access right
/** One person holding a role in one branch. */
export interface AccessLevelGrant {
  user_id: number;
  name: string;
  email?: string | null;
  is_active?: boolean;
  photo?: string | null;
  branch_id: number;
  branch_name: string;
}

export interface AccessRight {
  id: number;
  name: string;
  description?: string | null;
  permissions?: {
    [key: string]: PermissionValue | ExclusionsMap | undefined;
    Exclusions?: ExclusionsMap;
  };
  users_assigned?: AccessLevelAssignedUser[];
  /** Who holds this role, per branch (limited to the viewer's branches). */
  grants?: AccessLevelGrant[];
  exclusion_users?: Record<string, AccessLevelExclusionUser[]>;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface AccessRightOption {
  id: number;
  name: string;
  accessLevel: "Can View" | "Can Manage" | "Super Admin";
}
