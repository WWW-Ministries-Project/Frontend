import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { notify } from "@/components/feedback";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { MembersType } from "@/utils/api/members/interfaces";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import type { BranchAccessGrant } from "@/utils/interfaces";

import type { AccessRight } from "../utils/settingsInterfaces";
import { plural } from "../utils/settingsModel";

/** Accounts, roles and the actions the Users screen runs on them. */

export const grantsOf = (user: AssignableUser): BranchAccessGrant[] => user.branch_access ?? [];
export const isActive = (user: AssignableUser) => user.is_active !== false;
export const roleIn = (user: AssignableUser, branchId: number) =>
  grantsOf(user).find((grant) => grant.branch_id === branchId)?.access_level_id ?? null;

/** "15m" → "15 minutes", "7d" → "7 days". */
export const describeExpiry = (value?: string | null) => {
  const match = /^(\d+)\s*([smhdw])$/i.exec((value || "").trim());
  if (!match) return "";
  const unit = { s: "second", m: "minute", h: "hour", d: "day", w: "week" }[
    match[2].toLowerCase() as "s" | "m" | "h" | "d" | "w"
  ];
  return plural(Number(match[1]), unit);
};

export const useUsersData = () => {
  const branches = useBranchStore((s) => s.branches);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [roles, setRoles] = useState<AccessRight[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [members, setMembers] = useState<MembersType[] | null>(null);
  const membersRequest = useRef<Promise<void> | null>(null);

  const refetch = useCallback(async (quiet = true) => {
    if (!quiet) setLoading(true);
    try {
      const [accounts, levels] = await Promise.all([
        api.fetch.fetchAssignableUsers({ include_inactive: "true" }),
        api.fetch.fetchAccessLevels(),
      ]);
      setUsers(accounts.data ?? []);
      setRoles(levels.data ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch(false);
  }, [refetch]);

  /** Members (with or without an account); loaded once, on demand. */
  const loadMembers = useCallback((force = false) => {
    if (membersRequest.current && !force) return membersRequest.current;
    membersRequest.current = api.fetch
      .fetchMembersForOptions()
      .then((res) => setMembers(res.data ?? []))
      .catch(() => {
        membersRequest.current = null;
      });
    return membersRequest.current;
  }, []);

  const branchName = useCallback(
    (id: number) =>
      branches.find((branch) => branch.id === id)?.name ??
      users.flatMap(grantsOf).find((grant) => grant.branch_id === id)?.branch_name ??
      "this branch",
    [branches, users]
  );
  const roleName = useCallback(
    (id: number | null) => (id ? roles.find((role) => role.id === id)?.name ?? "this role" : "No access"),
    [roles]
  );
  const userName = useCallback((id: number) => users.find((user) => user.id === id)?.name ?? "This user", [users]);

  /** Sets (or with `roleId` null, removes) the role of each user in one branch. */
  const patchGrants = useCallback(
    (changes: Map<number, number | null>, branchId: number) =>
      setUsers((current) =>
        current.map((user) => {
          if (!changes.has(user.id)) return user;
          const roleId = changes.get(user.id) ?? null;
          const rest = grantsOf(user).filter((grant) => grant.branch_id !== branchId);
          const next = roleId
            ? [
                ...rest,
                {
                  branch_id: branchId,
                  branch_name: branchName(branchId),
                  access_level_id: roleId,
                  access_level_name: roleName(roleId),
                },
              ].sort((a, b) => a.branch_name.localeCompare(b.branch_name))
            : rest;
          return { ...user, branch_access: next };
        })
      ),
    [branchName, roleName]
  );

  /**
   * Gives `ids` the role `roleId` (or no access) in `branchId`, then offers
   * an undo that puts back each person's previous role there.
   * Throws when the request fails (the API layer has already told them).
   */
  const assign = useCallback(
    async (ids: number[], branchId: number, roleId: number | null, message: string, bulk = false) => {
      const previous = new Map(
        ids.map((id) => {
          const user = users.find((u) => u.id === id);
          return [id, user ? roleIn(user, branchId) : null] as const;
        })
      );
      if (bulk && roleId) {
        await api.put.bulkAssignAccessLevel({ access_level_id: roleId, assign_user_ids: ids, branch_id: branchId });
      } else {
        await Promise.all(
          ids.map((id) => api.put.setUserBranchAccess({ user_id: id, branch_id: branchId, access_level_id: roleId }))
        );
      }
      patchGrants(new Map(ids.map((id) => [id, roleId])), branchId);
      void refetch();
      notify.success({
        title: "Access changed",
        message,
        undo: async () => {
          const restore = [...previous].filter(([, prev]) => prev !== roleId);
          await Promise.all(
            restore.map(([id, prev]) =>
              api.put.setUserBranchAccess({ user_id: id, branch_id: branchId, access_level_id: prev })
            )
          );
          patchGrants(new Map(restore), branchId);
          void refetch();
        },
      });
    },
    [users, patchGrants, refetch]
  );

  /** Activates or deactivates accounts. Throws when the request fails. */
  const setActive = useCallback(
    async (ids: number[], on: boolean) => {
      const res = await api.post.bulkUpdateUserStatus({ user_ids: ids, is_active: on });
      const results = res.data?.results;
      // Older responses carry no per-user results; treat them as all done.
      const failedRows = (results ?? []).filter((row) => !row.success);
      const failedIds = new Set(failedRows.map((row) => Number(row.user_id)));
      const doneIds = ids.filter((id) => !failedIds.has(id));
      setUsers((current) =>
        current.map((user) => (doneIds.includes(user.id) ? { ...user, is_active: on } : user))
      );
      void refetch();
      const verb = on ? "activated" : "deactivated";
      if (failedRows.length) {
        const nameOf = (id: number) => users.find((user) => user.id === id)?.name ?? `User ${id}`;
        notify.partial({
          title: `${doneIds.length} of ${ids.length} users ${verb}`,
          message: "The others didn’t change. Check the reasons, then try again.",
          failed: failedRows.map((row) => ({
            label: nameOf(Number(row.user_id)),
            reason: row.message || undefined,
          })),
        });
        return;
      }
      notify.success({
        title: `${doneIds.length} ${doneIds.length === 1 ? "user" : "users"} ${verb}`,
        message: on ? "They can sign in again." : "They can’t sign in until reactivated.",
      });
    },
    [refetch, users]
  );

  const memberNames = useMemo(() => {
    const map = new Map<number, string>();
    (members ?? []).forEach((member) => map.set(member.id, member.name));
    users.forEach((user) => map.set(user.id, user.name));
    return map;
  }, [members, users]);

  return {
    users,
    roles,
    loading,
    failed,
    members,
    memberNames,
    refetch,
    loadMembers,
    branchName,
    roleName,
    userName,
    assign,
    setActive,
  };
};

export type UsersData = ReturnType<typeof useUsersData>;
