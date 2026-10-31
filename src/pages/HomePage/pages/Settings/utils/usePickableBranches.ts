import { useMemo } from "react";

import { useBranchStore } from "@/store/useBranchStore";

/**
 * Branches the signed-in admin may act in (give roles, edit, make default).
 * The API answers 403 BRANCH_FORBIDDEN for any other branch.
 */
export const usePickableBranches = () => {
  const branches = useBranchStore((s) => s.branches);
  const allowed = useBranchStore((s) => s.allowedBranchIds);
  return useMemo(
    () => (allowed ? branches.filter((branch) => allowed.includes(branch.id)) : branches),
    [branches, allowed]
  );
};
