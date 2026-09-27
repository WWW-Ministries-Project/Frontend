import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import {
  showConfirmDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccessLevelAssignedUser, AccessRight } from "../utils/settingsInterfaces";

interface AccessLevelMembersPanelProps {
  accessRight: AccessRight;
  canManageAccessRights: boolean;
  onMembersUpdated: () => void;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getAssignedUserName = (user: AccessLevelAssignedUser): string =>
  user.name || user.full_name || `User #${user.id}`;

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

  const assignedUsers = useMemo(
    () => accessRight.users_assigned || [],
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

  // Anyone already on this level is listed above, so only offer the rest.
  const availableCandidates = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((user) => user.id));
    const term = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      if (assignedIds.has(candidate.id)) return false;
      if (candidate.access_level?.id === accessRight.id) return false;
      if (!term) return true;
      return [candidate.name, candidate.email, candidate.member_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [accessRight.id, assignedUsers, candidates, search]);

  const toggleSelected = (id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = useCallback(
    async (payload: { assign_user_ids?: number[]; unassign_user_ids?: number[] }) => {
      setSaving(true);
      try {
        await api.put.bulkAssignAccessLevel({
          access_level_id: accessRight.id,
          ...payload,
        });
        const assignedCount = payload.assign_user_ids?.length || 0;
        showNotification(
          assignedCount > 0
            ? `${assignedCount} member${assignedCount === 1 ? "" : "s"} assigned to ${accessRight.name}`
            : `Member removed from ${accessRight.name}`,
          "success"
        );
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
    if (ids.length === 0) return;

    const movingCount = candidates.filter(
      (candidate) => selectedIds.has(candidate.id) && candidate.access_level
    ).length;

    if (movingCount === 0) {
      void submit({ assign_user_ids: ids });
      return;
    }

    showConfirmDialog(
      "Move members to this access level?",
      () => void submit({ assign_user_ids: ids }),
      {
        message: `${movingCount} of the selected member${
          ids.length === 1 ? "" : "s"
        } already ${
          movingCount === 1 ? "has" : "have"
        } an access level. Assigning ${accessRight.name} will replace it.`,
        confirmLabel: "Assign",
      }
    );
  };

  const handleUnassign = (user: AccessLevelAssignedUser) => {
    showConfirmDialog(
      `Remove ${getAssignedUserName(user)} from ${accessRight.name}?`,
      () => void submit({ unassign_user_ids: [user.id] }),
      {
        message:
          "They will be left with no access level until one is assigned.",
        confirmLabel: "Remove",
      }
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-primary">
            Assigned Members
          </h4>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {assignedUsers.length} members
          </span>
        </div>

        {assignedUsers.length === 0 ? (
          <EmptyState
            scope="section"
            msg="No members assigned"
            description="This access level has not been assigned to any users yet."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignedUsers.map((user) => {
              const displayName = getAssignedUserName(user);

              return (
                <article
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl border border-lightGray bg-white p-4 shadow-sm"
                >
                  <Avatar name={displayName} photo={user.user_info?.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-primary">
                      {displayName}
                    </p>
                    <p className="text-xs text-primaryGray">
                      User ID: {user.id}
                    </p>
                  </div>
                  {canManageAccessRights && (
                    <Button
                      value="Remove"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => handleUnassign(user)}
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
                Add Members
              </h4>
              <p className="text-sm text-primaryGray">
                Only ministry workers can hold an access level. Members who
                already have one will be moved to {accessRight.name}.
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
                : "Every ministry worker is already on this access level."}
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
                      {candidate.access_level ? (
                        <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                          Current: {candidate.access_level.name}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-primaryGray">
                          No access level
                        </span>
                      )}
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
