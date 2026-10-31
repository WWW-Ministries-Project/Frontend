import { useEffect } from "react";

import { handleSessionChanged } from "@/features/notifications/sessionRealtime";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { useUserStore } from "@/store/userStore";
import { resolveAllowedBranchIds } from "@/utils/branchAccess";

/** Fired by the API client when the server refuses the active branch. */
export const BRANCH_FORBIDDEN_EVENT = "app:branch-forbidden";

/**
 * Keeps branch state in step with the signed-in user:
 * - limits the branch switcher to the branches the user holds a role in
 *   (members: their home branch);
 * - re-derives permissions from the active branch's role on every switch;
 * - when the API refuses a branch (role removed meanwhile), falls back to the
 *   user's first branch and reloads their access.
 */
export function useBranchAccessSync() {
  const userCategory = useUserStore((state) => state.user_category);
  const homeBranchId = useUserStore((state) => state.branch_id);
  const branchAccess = useUserStore((state) => state.branch_access);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const setAllowedBranchIds = useBranchStore((state) => state.setAllowedBranchIds);

  useEffect(() => {
    setAllowedBranchIds(
      resolveAllowedBranchIds({
        user_category: userCategory,
        branch_id: homeBranchId,
        branch_access: branchAccess,
      })
    );
  }, [userCategory, homeBranchId, branchAccess, setAllowedBranchIds]);

  useEffect(() => {
    const state = useUserStore.getState();
    if (!state.id || !state.branch_access?.length) return;
    // setUser picks the active branch's permissions from branch_access.
    state.setUser(state);
  }, [activeBranchId]);

  useEffect(() => {
    const handleForbidden = () => {
      useBranchStore.setState({ activeBranchId: ALL_BRANCHES, hasChosenBranch: false });
      const { allowedBranchIds, setAllowedBranchIds: reapply } = useBranchStore.getState();
      reapply(allowedBranchIds);
      handleSessionChanged();
    };
    window.addEventListener(BRANCH_FORBIDDEN_EVENT, handleForbidden);
    return () => window.removeEventListener(BRANCH_FORBIDDEN_EVENT, handleForbidden);
  }, []);
}
