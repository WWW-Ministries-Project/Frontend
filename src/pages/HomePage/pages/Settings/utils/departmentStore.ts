import { create } from "zustand";

interface Department {
  id: number;
  name: string;
}

interface DepartmentOption {
  name: string;
  value: number;
}

interface DepartmentStore {
  departments: Department[];
  departmentsOptions: DepartmentOption[];
  addDepartment: (department: Department) => void;
  removeDepartment: (departmentId: number) => void;
  updateDepartment: (updatedDepartment: Department) => void;
  setDepartments: (departments: Department[]) => void;
  setDepartmentsOptions: () => void;
}

const useDepartmentStore = create<DepartmentStore>((set, get) => ({
  departments: [],
  departmentsOptions: [],
  addDepartment: (department) => {
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
  updateDepartment: (updatedDepartment) => {
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ),
    }));
    get().setDepartmentsOptions();
  },
  setDepartments: (departments) => {
    set({ departments });
    get().setDepartmentsOptions();
  },
  setDepartmentsOptions: () => {
    set((state) => ({
      departmentsOptions: state.departments?.map((department) => ({
        name: department.name,
        value: +department.id,
      })),
    }));
  },
}));

export default useDepartmentStore;
