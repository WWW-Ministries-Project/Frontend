import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import {
  showConfirmDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import {
  ALL_BRANCHES,
  selectAccessibleBranches,
  useBranchStore,
} from "@/store/useBranchStore";
import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccessLevelGrant, AccessRight } from "../utils/settingsInterfaces";

interface AccessLevelMembersPanelProps {
  accessRight: AccessRight;
  canManageAccessRights: boolean;
  onMembersUpdated: () => void;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getGrantUserName = (grant: AccessLevelGrant): string =>
  grant.name || `User #${grant.user_id}`;

const getInitials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

const Avatar = ({ name, photo }: { name: string; photo?: string | null }) =>
  photo ? (
    <img
      src={photo}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-full border border-lightGray object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {getInitials(name)}
    </div>
  );

export const AccessLevelMembersPanel = ({
  accessRight,
  canManageAccessRights,
  onMembersUpdated,
}: AccessLevelMembersPanelProps) => {
  const [candidates, setCandidates] = useState<AssignableUser[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const branches = useBranchStore(selectAccessibleBranches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [branchId, setBranchId] = useState<string>(
    activeBranchId === ALL_BRANCHES ? "" : String(activeBranchId)
  );
  const [branchError, setBranchError] = useState(false);

  useEffect(() => {
    setBranchId(activeBranchId === ALL_BRANCHES ? "" : String(activeBranchId));
  }, [activeBranchId]);

  const chosenBranch = branches.find((branch) => String(branch.id) === branchId) ?? null;

  // One entry per person per branch: roles are given branch by branch.
  const grants = useMemo<AccessLevelGrant[]>(
    () =>
      accessRight.grants ??
      (accessRight.users_assigned || []).map((user) => ({
        user_id: user.id,
        name: user.name || user.full_name || "",
        photo: user.user_info?.photo ?? null,
        branch_id: 0,
        branch_name: "",
      })),
    [accessRight]
  );

  useEffect(() => {
    if (!canManageAccessRights) return;
    let cancelled = false;

    const loadCandidates = async () => {
      setLoadingCandidates(true);
      setLoadError(null);
      try {
        const response = await api.fetch.fetchAssignableUsers();
        if (!cancelled) setCandidates(response.data || []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            toErrorMessage(error, "Unable to load ministry workers.")
          );
        }
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    };

    void loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [canManageAccessRights, reloadKey]);

  const roleInChosenBranch = useCallback(
    (candidate: AssignableUser) =>
      chosenBranch
        ? candidate.branch_access?.find((grant) => grant.branch_id === chosenBranch.id) ?? null
        : null,
    [chosenBranch]
  );

  // Anyone who already has this role in the chosen branch is listed above.
  const availableCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      if (roleInChosenBranch(candidate)?.access_level_id === accessRight.id) return false;
      if (!term) return true;
      return [candidate.name, candidate.email, candidate.member_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [accessRight.id, candidates, roleInChosenBranch, search]);

  const toggleSelected = (id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = useCallback(
    async (
      payload: { assign_user_ids?: number[]; unassign_user_ids?: number[] },
      branch: { id: number; name: string },
      removedName?: string
    ) => {
      setSaving(true);
      try {
        await api.put.bulkAssignAccessLevel({
          access_level_id: accessRight.id,
          branch_id: branch.id,
          ...payload,
        });
        const assignedCount = payload.assign_user_ids?.length || 0;
        if (assignedCount > 0) {
          notify.success({
            title: "People added",
            message: `${assignedCount} ${assignedCount === 1 ? "person is" : "people are"} now ${accessRight.name} in ${branch.name}.`,
          });
        } else {
          notify.success({
            title: "Removed from role",
            message: `${removedName ?? "They"} no longer ${removedName ? "has" : "have"} access to ${branch.name}.`,
          });
        }
        setSelectedIds(new Set());
        setReloadKey((key) => key + 1);
        onMembersUpdated();
      } catch (error) {
        showNotification(
          toErrorMessage(error, "Unable to update access level members."),
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [accessRight.id, accessRight.name, onMembersUpdated]
  );

  const handleAssign = () => {
    const ids = Array.from(selectedIds);
    if (!chosenBranch) {
      setBranchError(true);
      return;
    }
    if (ids.length === 0) {
      notify.warning({ title: "Pick at least one person", message: "Tick the people to add." });
      return;
    }
    const branch = { id: chosenBranch.id, name: chosenBranch.name };

    const movingCount = candidates.filter(
      (candidate) => selectedIds.has(candidate.id) && roleInChosenBranch(candidate)
    ).length;

    if (movingCount === 0) {
      void submit({ assign_user_ids: ids }, branch);
      return;
    }

    showConfirmDialog(
      `Change their role in ${branch.name}?`,
      () => void submit({ assign_user_ids: ids }, branch),
      {
        message: `${movingCount} of them will move from their current role in ${branch.name}. Their access in other branches stays.`,
        confirmLabel: "Change role",
      }
    );
  };

  const handleUnassign = (grant: AccessLevelGrant) => {
    const name = getGrantUserName(grant);
    if (!grant.branch_id) return;
    showConfirmDialog(
      `Remove ${name} from ${accessRight.name} in ${grant.branch_name}?`,
      () =>
        void submit(
          { unassign_user_ids: [grant.user_id] },
          { id: grant.branch_id, name: grant.branch_name },
          name
        ),
      {
        message: `They lose access to ${grant.branch_name}. Their access in other branches stays.`,
        confirmLabel: "Remove",
        tone: "danger",
      }
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-primary">
            People with this role
          </h4>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {new Set(grants.map((grant) => grant.user_id)).size} people
          </span>
        </div>

        {grants.length === 0 ? (
          <EmptyState
            scope="section"
            msg="No one has this role yet"
            description="Add people and they get these permissions right away."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {grants.map((grant) => {
              const displayName = getGrantUserName(grant);

              return (
                <article
                  key={`${grant.user_id}-${grant.branch_id}`}
                  className="flex items-center gap-3 rounded-xl border border-lightGray bg-white p-4 shadow-sm"
                >
                  <Avatar name={displayName} photo={grant.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-primary">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-primaryGray">
                      {[grant.email, grant.branch_name].filter(Boolean).join(" · ") ||
                        `User ID: ${grant.user_id}`}
                    </p>
                  </div>
                  {canManageAccessRights && grant.branch_id > 0 && (
                    <Button
                      value="Remove"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => handleUnassign(grant)}
                      className="!min-h-8 !px-3 !py-1 text-xs text-error hover:bg-error/10"
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {canManageAccessRights && (
        <section className="space-y-3 rounded-xl border border-lightGray bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-primary">
                Add people
              </h4>
              <p className="text-sm text-primaryGray">
                Each person has one role per branch. Adding someone here sets
                their role in the branch you choose.
              </p>
            </div>
            <Button
              value={
                selectedIds.size > 0
                  ? `Assign ${selectedIds.size} selected`
                  : "Assign selected"
              }
              onClick={handleAssign}
              disabled={saving || selectedIds.size === 0}
              loading={saving}
              className="!min-h-9 !px-3 !py-1 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="assign-branch" className="text-sm font-medium text-primary">
              In branch
            </label>
            <select
              id="assign-branch"
              value={branchId}
              aria-invalid={branchError || undefined}
              aria-describedby={branchError ? "assign-branch-error" : undefined}
              onChange={(event) => {
                setBranchId(event.target.value);
                setBranchError(false);
              }}
              className="h-10 max-w-sm rounded-lg border border-lightGray bg-white px-3 text-sm text-primary focus:border-primary focus:outline-none"
            >
              <option value="">Choose a branch…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {branchError && (
              <p id="assign-branch-error" role="alert" className="text-xs text-error">
                Choose the branch.
              </p>
            )}
          </div>

          <SearchBar
            placeholder="Search by name, email or member ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loadingCandidates ? (
            <p className="text-sm text-primaryGray">Loading ministry workers...</p>
          ) : loadError ? (
            <div className="flex items-center gap-3 text-sm text-error">
              <span>{loadError}</span>
              <Button
                value="Retry"
                variant="secondary"
                onClick={() => setReloadKey((key) => key + 1)}
                className="!min-h-8 !px-3 !py-1 text-xs"
              />
            </div>
          ) : availableCandidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-lightGray bg-white p-4 text-sm text-primaryGray">
              {search.trim()
                ? "No ministry workers match your search."
                : "Everyone already has this role here."}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-lightGray overflow-y-auto rounded-lg border border-lightGray bg-white">
              {availableCandidates.map((candidate) => {
                const checked = selectedIds.has(candidate.id);

                return (
                  <li key={candidate.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving}
                        onChange={() => toggleSelected(candidate.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <Avatar name={candidate.name} photo={candidate.photo} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-primary">
                          {candidate.name}
                        </p>
                        <p className="truncate text-xs text-primaryGray">
                          {[candidate.member_id, candidate.email]
                            .filter(Boolean)
                            .join(" • ") || `User ID: ${candidate.id}`}
                        </p>
                      </div>
                      {(() => {
                        const grantsCount = candidate.branch_access?.length ?? 0;
                        if (!chosenBranch) {
                          return (
                            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-primaryGray">
                              {grantsCount} branch{grantsCount === 1 ? "" : "es"}
                            </span>
                          );
                        }
                        const current = roleInChosenBranch(candidate);
                        return current ? (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-primaryGray">
                            {current.access_level_name}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                            No access here
                          </span>
                        );
                      })()}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
