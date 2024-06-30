import { Department, DepartmentSlice } from "./settingsInterfaces";
const createDepartmentSlice = (set: any, get: any): DepartmentSlice => ({
  departments: [],
  departmentsOptions: [],
  addDepartment: (department) => {
    set((state: any) => ({
      departments: [...state.departments, department],
    }));
    get().setDepartmentsOptions();
  },
  removeDepartment: (departmentId) => {
    set((state: any) => ({
      departments: state.departments.filter(
        (dept: Department) => dept.id !== departmentId
      ),
    }));
    get().setDepartmentsOptions();
  },
  updateDepartment: (updatedDepartment) => {
    set((state: any) => ({
      departments: state.departments.map((dept: Department) =>
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
    set((state: any) => ({
      departmentsOptions: state.departments.map((department: Department) => ({
        name: department.name,
        value: department.id,
      })),
    }));
  },
});

export default createDepartmentSlice;
