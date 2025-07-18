import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";

export interface Department {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
  position?: Position[];
}

export interface DepartmentOption {
  label: string;
  value: number;
}

export interface DepartmentSlice {
  departments: Department[];
  departmentsOptions: DepartmentOption[];
  positionOptions: Record<number, ISelectOption[]>;
  addDepartment: (department: Department) => void;
  removeDepartment: (departmentId: number) => void;
  updateDepartment: (updatedDepartment: Department) => void;
  setDepartments: (departments: Department[]) => void;
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
  // positionsOptions: PositionOption[];
  addPosition: (position: Position) => void;
  removePosition: (positionId: number | string) => void;
  updatePosition: (updatedPosition: Position) => void;
  setPositions: (positions: Position[]) => void;
  // setPositionsOptions: () => void;
}

export type StoreState = DepartmentSlice & PositionSlice;

//access right
export interface AccessRight {
  id: number;
  name: string;
  permissions?: Record<string, string>;
}
export interface AccessRightOption {
  id: number;
  name: string;
  accessLevel: "Can View" | "Can Manage" | "Super Admin";
}
