import { useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction } from "@/pages/HomePage/utils";
import { selectAccessibleBranches, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { BranchAccessGrant } from "@/utils/interfaces";

interface RoleOption {
  id: number;
  name: string;
}

interface BranchAccessEditorProps {
  userId: number;
  userName: string;
  roles: RoleOption[];
  disabled?: boolean;
}

const selectClass =
  "h-10 rounded-lg border border-lightGray bg-white px-3 text-sm text-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-background disabled:text-primaryGray";

/**
 * A user's role in each branch: one row per branch they can work in, plus a
 * row to give them another branch. Roles are the same everywhere; only which
 * role applies differs per branch.
 */
export function BranchAccessEditor({
  userId,
  userName,
  roles,
  disabled,
}: BranchAccessEditorProps) {
  const { canManage, canView } = useAccessControl();
  const canSee = canView("Access_rights");
  const canEdit = canManage("Access_rights") && !disabled;
  const myBranches = useBranchStore(selectAccessibleBranches);
  const myBranchIds = useMemo(() => new Set(myBranches.map((b) => b.id)), [myBranches]);

  const query = useMemo(() => ({ user_id: userId }), [userId]);
  const { data, loading, refetch } = useFetch(
    api.fetch.fetchUserBranchAccess,
    query,
    !canSee
  );
  const [override, setOverride] = useState<BranchAccessGrant[] | null>(null);
  const grants = override ?? data?.data?.branch_access ?? [];

  const [saving, setSaving] = useState<number | null>(null);
  const [newBranch, setNewBranch] = useState("");
  const [newRole, setNewRole] = useState("");

  const roleName = (id: number) => roles.find((role) => role.id === id)?.name ?? "";
  const branchesToAdd = myBranches.filter(
    (branch) => !grants.some((grant) => grant.branch_id === branch.id)
  );

  const save = async (branchId: number, branchName: string, accessLevelId: number | null) => {
    setSaving(branchId);
    try {
      const response = await api.put.setUserBranchAccess({
        user_id: userId,
        branch_id: branchId,
        access_level_id: accessLevelId,
      });
      setOverride(response.data?.branch_access ?? null);
      refetch();
      notify.success({
        title: "Access changed",
        message: accessLevelId
          ? `${userName} is now ${roleName(accessLevelId)} in ${branchName}.`
          : `${userName} no longer has access to ${branchName}.`,
      });
      return true;
    } catch {
      // The API error handler already shows what went wrong.
      return false;
    } finally {
      setSaving(null);
    }
  };

  const confirmRemove = (grant: BranchAccessGrant) =>
    confirmAction({
      title: `Remove ${userName}’s access to ${grant.branch_name}?`,
      message: "Their access in other branches stays.",
      confirmLabel: "Remove access",
      tone: "danger",
      onConfirm: () => save(grant.branch_id, grant.branch_name, null),
    });

  const addBranch = async () => {
    const branch = myBranches.find((item) => String(item.id) === newBranch);
    if (!branch || !newRole) {
      notify.warning({
        title: "Pick a branch and a role",
        message: "Both are needed to give access.",
      });
      return;
    }
    if (await save(branch.id, branch.name, Number(newRole))) {
      setNewBranch("");
      setNewRole("");
    }
  };

  if (!canSee) return null;

  return (
    <section aria-labelledby="branch-access-title" className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 id="branch-access-title" className="text-base font-semibold text-primary">
          Branch access
        </h3>
        <p className="text-sm text-primaryGray">
          One role per branch. They only see data from the branches listed here.
        </p>
      </div>

      {loading && !grants.length ? (
        <div className="h-12 animate-pulse rounded-lg bg-background" />
      ) : grants.length === 0 ? (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-primary">
          No branch access yet. They can sign in but won’t see any admin module.
        </p>
      ) : (
        <ul className="space-y-2">
          {grants.map((grant) => {
            const editable = canEdit && myBranchIds.has(grant.branch_id);
            return (
              <li
                key={grant.branch_id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-lightGray bg-white py-2 pl-3 pr-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                  {grant.branch_name}
                </span>
                {editable ? (
                  <select
                    aria-label={`Role in ${grant.branch_name}`}
                    className={selectClass}
                    value={grant.access_level_id}
                    disabled={saving === grant.branch_id}
                    onChange={(event) =>
                      save(grant.branch_id, grant.branch_name, Number(event.target.value))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-primaryGray">{grant.access_level_name}</span>
                )}
                {editable && (
                  <button
                    type="button"
                    aria-label={`Remove access to ${grant.branch_name}`}
                    onClick={() => confirmRemove(grant)}
                    disabled={saving === grant.branch_id}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-error/40 text-error hover:bg-error/10 disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && branchesToAdd.length > 0 && roles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Branch to add"
            className={selectClass}
            value={newBranch}
            onChange={(event) => setNewBranch(event.target.value)}
          >
            <option value="">Branch…</option>
            {branchesToAdd.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Role to give"
            className={selectClass}
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
          >
            <option value="">Role…</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addBranch}
            disabled={saving !== null}
            className="h-10 rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-background disabled:opacity-50"
          >
            + Add branch
          </button>
        </div>
      )}
    </section>
  );
}
