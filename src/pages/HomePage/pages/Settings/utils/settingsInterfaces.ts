export interface Department {
  id: number;
  name: string;
  description?: string;
  department_head?: number;
  department_head_info?: { id: number; name: string };
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

// type IsPlainObject<T> = T extends object
//   ? // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//     T extends Function | File | Date | Blob | RegExp
//     ? false
//     : T extends Array<unknown>
//     ? false
//     : true
//   : false;

// type Accessify<T> = {
//   [K in keyof T]: IsPlainObject<T[K]> extends true ? Accessify<T[K]> : boolean;
// };

// export type IMembersFormAccess = Accessify<IMembersForm>;

export type AccessState = {
  [moduleName: string]: {
    topPermission: string;
    access?: {
      [subModule: string]: {
        [field: string]: boolean;
      };
    };
  };
};
