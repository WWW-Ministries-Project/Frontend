import { create } from "zustand";
import createDepartmentSlice from "./departmentSlice";
import createPositionSlice from "./positionSlice";
import { StoreState } from "./settingsInterfaces";

const useSettingsStore = create<StoreState>((set, get) => ({
  ...createDepartmentSlice(set, get),
  ...createPositionSlice(set, get),
}));

export default useSettingsStore;
