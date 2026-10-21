import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ALL_BRANCHES, useBranchStore, type ActiveBranchId } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import type { Branch } from "@/utils/api/settings/branchInterfaces";

import type { AccessLevelGrant, AccessRight } from "../utils/settingsInterfaces";
import { permissionsPayload, type RoleDraft } from "../utils/settingsModel";

/** Base path of the access-rights screens. */
export const ACCESS_BASE = "/home/settings/access-rights";
export const rolePath = (id: number | string, tab?: "people", add?: boolean) => {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (add) params.set("add", "1");
  const query = params.toString();
  return `${ACCESS_BASE}/${id}${query ? `?${query}` : ""}`;
};

/** Roles and admin accounts, loaded once per screen. */
export const useAccessData = () => {
  const [roles, setRoles] = useState<AccessRight[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);

  const reloadRoles = useCallback(async () => {
    const response = await api.fetch.fetchAccessLevels();
    const list = Array.isArray(response.data) ? response.data : [];
    if (alive.current) setRoles(list);
    return list;
  }, []);

  const reloadUsers = useCallback(async () => {
    const response = await api.fetch.fetchAssignableUsers({ include_inactive: "true" });
    const list = Array.isArray(response.data) ? response.data : [];
    if (alive.current) setUsers(list);
    return list;
  }, []);

  const reload = useCallback(async () => {
    const [nextRoles] = await Promise.all([reloadRoles(), reloadUsers()]);
    return nextRoles;
  }, [reloadRoles, reloadUsers]);

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    Promise.all([reloadRoles(), reloadUsers().catch(() => [])])
      .then(() => alive.current && setFailed(false))
      .catch(() => alive.current && setFailed(true))
      .finally(() => alive.current && setLoading(false));
    return () => {
      alive.current = false;
    };
  }, [reloadRoles, reloadUsers]);

  return { roles, users, loading, failed, reloadRoles, reloadUsers, reload };
};

/** Every member, for the "hide these people" pickers. Loads only when enabled. */
export const useMemberOptions = (enabled: boolean) => {
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;
    let alive = true;
    api.fetch
      .fetchMembersForOptions()
      .then((response) => {
        if (!alive || !Array.isArray(response.data)) return;
        setMembers(
          response.data
            .filter((member) => member && typeof member.id === "number")
            .map((member) => ({ id: member.id, name: member.name || `Member #${member.id}` }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => {
        loaded.current = false;
      });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return members;
};

/** Active branch scope plus the branch list the pickers offer. */
export const useBranchScope = () => {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const branches = useBranchStore((s) => s.branches);
  const allowed = useBranchStore((s) => s.allowedBranchIds);

  return useMemo(() => {
    const pickable: Branch[] = allowed ? branches.filter((b) => allowed.includes(b.id)) : branches;
    const branchName = (id?: number | null) => branches.find((b) => b.id === id)?.name ?? "—";
    const isAll = activeBranchId === ALL_BRANCHES;
    return {
      activeBranchId: activeBranchId as ActiveBranchId,
      isAll,
      scopeName: isAll ? "all branches" : branchName(activeBranchId as number),
      branches: pickable,
      branchName,
    };
  }, [activeBranchId, branches, allowed]);
};

/** Grants in the active branch (all of them for "all branches"). */
export const grantsInScope = (role: AccessRight, scope: ActiveBranchId): AccessLevelGrant[] =>
  (role.grants || []).filter((g) => scope === ALL_BRANCHES || g.branch_id === scope);

export const uniquePeople = (grants: AccessLevelGrant[]) => {
  const map = new Map<number, AccessLevelGrant>();
  grants.forEach((g) => {
    if (!map.has(g.user_id)) map.set(g.user_id, g);
  });
  return [...map.values()];
};

export const isNameTaken = (roles: AccessRight[], name: string, exceptId?: number) =>
  roles.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === name.trim().toLowerCase());

/** A name like "Front Desk (copy)" that no other role uses yet. */
export const copyName = (roles: AccessRight[], name: string) => {
  let candidate = `${name} (copy)`;
  let n = 2;
  while (isNameTaken(roles, candidate)) {
    candidate = `${name} (copy ${n})`;
    n += 1;
  }
  return candidate;
};

/** Creates a role and returns it (the endpoint answers with the full list). */
export const createRole = async (
  name: string,
  description: string,
  draft: RoleDraft,
  reloadRoles: () => Promise<AccessRight[]>
): Promise<AccessRight | undefined> => {
  const response = await api.post.createAccessRight<AccessRight[] | AccessRight>({
    name,
    description,
    permissions: permissionsPayload(draft),
  });
  const match = (list: AccessRight[]) =>
    list.find((r) => r.name.trim().toLowerCase() === name.trim().toLowerCase());
  const data = response.data;
  const fresh = await reloadRoles();
  if (Array.isArray(data)) return match(data) ?? match(fresh);
  if (data && typeof data === "object" && "id" in data) return data;
  return match(fresh);
};

/** Without a draft only the name and description change; stored permissions stay as they are. */
export const updateRole = (role: AccessRight, name: string, description: string, draft?: RoleDraft) =>
  api.put.updateAccessRight(
    { id: role.id, name, description, ...(draft && { permissions: permissionsPayload(draft) }) },
    { id: role.id }
  );

/** The user's role id in a branch, or null. */
export const roleIn = (user: AssignableUser, branchId: number) =>
  (user.branch_access || []).find((a) => a.branch_id === branchId)?.access_level_id ?? null;
