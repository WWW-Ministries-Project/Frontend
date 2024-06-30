import { StateCreator } from 'zustand';

export interface Department {
  id: number;
  name: string;
}

export interface DepartmentOption {
  name: string;
  value: number;
}

export interface DepartmentSlice {
  departments: Department[];
  departmentsOptions: DepartmentOption[];
  addDepartment: (department: Department) => void;
  removeDepartment: (departmentId: number) => void;
  updateDepartment: (updatedDepartment: Department) => void;
  setDepartments: (departments: Department[]) => void;
  setDepartmentsOptions: () => void;
}

export interface Position {
  id: number;
  name: string;
}

export interface PositionOption {
  title: string;
  value: number;
}

export interface PositionSlice {
  positions: Position[];
  positionsOptions: PositionOption[];
  addPosition: (position: Position) => void;
  removePosition: (positionId: number) => void;
  updatePosition: (updatedPosition: Position) => void;
  setPositions: (positions: Position[]) => void;
  setPositionsOptions: () => void;
}

export type StoreState = DepartmentSlice & PositionSlice;
