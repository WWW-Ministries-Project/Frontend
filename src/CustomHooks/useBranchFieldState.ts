import {
  ALL_BRANCHES,
  selectAccessibleBranches,
  useBranchStore,
} from "@/store/useBranchStore";
import type { Branch } from "@/utils/api/settings/branchInterfaces";

export interface BranchFieldState {
  /** Branches the user may save to. */
  options: Branch[];
  /** The branch every record is saved to, when the user cannot choose. */
  lockedBranch: Branch | null;
  /** Why the field is read-only; shown under it. */
  lockedReason: string | null;
}

/**
 * Whether a form's branch field is a choice or fixed, and why.
 * - One branch: fixed to it ("You only have access to …").
 * - Several, one picked in the top bar: fixed to that one.
 * - "All my branches": a choice among the user's branches.
 */
export function useBranchFieldState(): BranchFieldState {
  const options = useBranchStore(selectAccessibleBranches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  if (options.length === 1) {
    return {
      options,
      lockedBranch: options[0],
      lockedReason: `You only have access to ${options[0].name}, so it’s saved there.`,
    };
  }

  if (activeBranchId !== ALL_BRANCHES) {
    const active = options.find((branch) => branch.id === activeBranchId) ?? null;
    if (active) {
      return {
        options,
        lockedBranch: active,
        lockedReason:
          "Saved to the branch you’re working in. Switch branch in the top bar to change it.",
      };
    }
  }

  return { options, lockedBranch: null, lockedReason: null };
}

