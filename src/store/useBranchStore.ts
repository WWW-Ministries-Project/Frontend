import type { Branch } from "@/utils/api/settings/branchInterfaces";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ALL_BRANCHES = "ALL_BRANCHES" as const;

type ActiveBranchId = number | typeof ALL_BRANCHES;

interface BranchState {
  branches: Branch[];
  activeBranchId: ActiveBranchId;
  setBranches: (branches: Branch[]) => void;
  setActiveBranchId: (branchId: ActiveBranchId) => void;
  resetBranchSelection: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      activeBranchId: ALL_BRANCHES,
      setBranches: (branches) => {
        const currentActive = get().activeBranchId;
        const activeStillExists =
          currentActive === ALL_BRANCHES ||
          branches.some((branch) => branch.id === currentActive);

        set({
          branches,
          activeBranchId: activeStillExists ? currentActive : ALL_BRANCHES,
        });
      },
      setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),
      resetBranchSelection: () => set({ activeBranchId: ALL_BRANCHES }),
    }),
    {
      name: "branch-selection",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ activeBranchId: state.activeBranchId }),
    }
  )
);

export const buildBranchQuery = (activeBranchId: ActiveBranchId) =>
  activeBranchId === ALL_BRANCHES ? undefined : { branch_id: activeBranchId };
