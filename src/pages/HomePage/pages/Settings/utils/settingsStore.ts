import { create } from "zustand";
import createDepartmentSlice from "./departmentSlice";
import createPositionSlice from "./positionSlice";
import { StoreState } from "./settingsInterfaces";

//TODO : check and remove unused 3rd argument
const useSettingsStore = create<StoreState>((set, get,store) => ({
  ...createDepartmentSlice(set, get, store),
  ...createPositionSlice(set, get, store),
}));

export default useSettingsStore;
