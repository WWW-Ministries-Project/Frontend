import type { Branch } from "@/utils/api/settings/branchInterfaces";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ALL_BRANCHES = "ALL_BRANCHES" as const;

export type ActiveBranchId = number | typeof ALL_BRANCHES;

interface BranchState {
  /** Every branch in the church (Settings, pickers). */
  branches: Branch[];
  /**
   * The branches the signed-in user may work in. `null` means every branch
   * (no branch limits known for this user).
   */
  allowedBranchIds: number[] | null;
  activeBranchId: ActiveBranchId;
  /** True once the user picks a branch; until then a multi-branch user starts on their first. */
  hasChosenBranch: boolean;
  setBranches: (branches: Branch[]) => void;
  setAllowedBranchIds: (branchIds: number[] | null) => void;
  setActiveBranchId: (branchId: ActiveBranchId) => void;
  resetBranchSelection: () => void;
}

/**
 * Keeps the active branch inside what the user may see: a user with one branch
 * is always on it; "all branches" needs more than one; an unknown or removed
 * branch falls back to the first allowed one.
 */
const clampActiveBranch = (
  active: ActiveBranchId,
  branches: Branch[],
  allowedBranchIds: number[] | null
): ActiveBranchId => {
  const known = (id: number) =>
    branches.length === 0 || branches.some((branch) => branch.id === id);

  if (!allowedBranchIds) {
    return active === ALL_BRANCHES || known(active) ? active : ALL_BRANCHES;
  }

  const allowed = allowedBranchIds.filter(known);
  if (allowed.length === 0) return ALL_BRANCHES;
  if (allowed.length === 1) return allowed[0];
  if (active === ALL_BRANCHES) return ALL_BRANCHES;
  return allowed.includes(active) ? active : allowed[0];
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      allowedBranchIds: null,
      activeBranchId: ALL_BRANCHES,
      hasChosenBranch: false,
      setBranches: (branches) => {
        const { activeBranchId, allowedBranchIds } = get();
        set({
          branches,
          activeBranchId: clampActiveBranch(activeBranchId, branches, allowedBranchIds),
        });
      },
      setAllowedBranchIds: (allowedBranchIds) => {
        const { activeBranchId, branches, hasChosenBranch } = get();
        const start =
          !hasChosenBranch && allowedBranchIds?.length ? allowedBranchIds[0] : activeBranchId;
        set({
          allowedBranchIds,
          activeBranchId: clampActiveBranch(start, branches, allowedBranchIds),
        });
      },
      setActiveBranchId: (branchId) => {
        const { branches, allowedBranchIds } = get();
        set({
          activeBranchId: clampActiveBranch(branchId, branches, allowedBranchIds),
          hasChosenBranch: true,
        });
      },
      resetBranchSelection: () =>
        set({ activeBranchId: ALL_BRANCHES, allowedBranchIds: null, hasChosenBranch: false }),
    }),
    {
      name: "branch-selection",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeBranchId: state.activeBranchId,
        hasChosenBranch: state.hasChosenBranch,
      }),
    }
  )
);

export const buildBranchQuery = (activeBranchId: ActiveBranchId) =>
  activeBranchId === ALL_BRANCHES ? undefined : { branch_id: activeBranchId };

/** The branches the user may pick from, in church order. */
export const selectAccessibleBranches = (state: {
  branches: Branch[];
  allowedBranchIds: number[] | null;
}): Branch[] =>
  state.allowedBranchIds
    ? state.branches.filter((branch) => state.allowedBranchIds!.includes(branch.id))
    : state.branches;

/** The active branch id to send as `X-Branch-Id`, or null for "all branches". */
export const getActiveBranchHeaderValue = (): number | null => {
  const { activeBranchId } = useBranchStore.getState();
  return activeBranchId === ALL_BRANCHES ? null : activeBranchId;
};
