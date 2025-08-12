import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { StateCreator } from "zustand";
import { Department, DepartmentSlice, StoreState } from "./settingsInterfaces";

const createDepartmentSlice: StateCreator<
  StoreState,
  [["zustand/devtools", never]],
  [],
  DepartmentSlice
> = (set, get) => ({
  departments: [],
  total: 0,
  departmentsOptions: [],
  positionOptions: {},

  addDepartment: (department: Department) => {
    set((state) => ({
      departments: [...state.departments, department],
    }));
    get().setDepartmentsOptions();
    get().setPositionOptions();
  },

  removeDepartment: (departmentId) => {
    set((state) => ({
      departments: state.departments.filter((dept) => dept.id !== departmentId),
    }));
    get().setDepartmentsOptions();
    get().setPositionOptions();
  },

  updateDepartment: (updatedDepartment: Department) => {
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ),
    }));
    get().setDepartmentsOptions();
    get().setPositionOptions();
  },

  setDepartments: (departments: Department[], total: number = 0) => {
    set({ departments, total });
    get().setDepartmentsOptions();
    get().setPositionOptions();
  },

  setDepartmentsOptions: () => {
    set((state) => ({
      departmentsOptions: state.departments.map((department) => ({
        label: department.name,
        value: department.id + "",
      })),
    }));
  },

  setPositionOptions: () => {
    set((state) => ({
      positionOptions: state.departments.reduce((acc, department) => {
        acc[department.id] = (department.position || []).map((position) => ({
          label: position.name,
          value: String(position.id),
        }));
        return acc;
      }, {} as Record<number, ISelectOption[]>),
    }));
  },
});

export default createDepartmentSlice;
