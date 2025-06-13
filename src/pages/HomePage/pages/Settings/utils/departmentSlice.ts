import { StateCreator } from "zustand";
import { Department, DepartmentSlice, StoreState } from "./settingsInterfaces";

const createDepartmentSlice: StateCreator<
  StoreState,
  [["zustand/devtools", never]],
  [],
  DepartmentSlice
> = (set, get) => ({
  departments: [],
  departmentsOptions: [],
  addDepartment: (department: Department) => {
    set((state) => ({
      departments: [...state.departments, department],
    }));
    get().setDepartmentsOptions();
  },
  removeDepartment: (departmentId) => {
    set((state) => ({
      departments: state.departments.filter((dept) => dept.id !== departmentId),
    }));
    get().setDepartmentsOptions();
  },
  updateDepartment: (updatedDepartment: Department) => {
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ),
    }));
    get().setDepartmentsOptions();
  },
  setDepartments: (departments: Department[]) => {
    set({ departments });
    get().setDepartmentsOptions();
  },
  setDepartmentsOptions: () => {
    set((state) => ({
      departmentsOptions: state.departments.map((department) => ({
        label: department.name,
        value: department.id,
      })),
    }));
  },
});

export default createDepartmentSlice;
