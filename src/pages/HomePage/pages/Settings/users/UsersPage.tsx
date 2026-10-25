import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { useUserStore } from "@/store/userStore";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import { cn } from "@/utils/cn";

import { PageHeading, Pill, SearchInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { Avatar, Segmented } from "../Components/settingsUi";
import { formatLastActive, shortBranch } from "../utils/settingsModel";
import { BulkBranchDialog, GiveAccessDialog } from "./UserDialogs";
import { UserDrawer } from "./UserDrawer";
import { grantsOf, isActive, roleIn, useUsersData } from "./useUsersData";

type Tab = "all" | "active" | "inactive" | "noaccess";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "noaccess", label: "No access" },
];

const matchesTab = (user: AssignableUser, tab: Tab) =>
  tab === "all" ||
  (tab === "active" && isActive(user)) ||
  (tab === "inactive" && !isActive(user)) ||
  (tab === "noaccess" && !grantsOf(user).length);

const GRID = "grid grid-cols-[56px_minmax(220px,2fr)_120px_minmax(200px,1.3fr)_110px_110px_96px] items-center";

const UsersPage = () => {
  const [params, setParams] = useSearchParams();
  const data = useUsersData();
  const { users, roles, loading, failed, refetch, assign, setActive, branchName, roleName, userName } = data;
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const meId = String(useUserStore((s) => s.id) ?? "");
  const { hasAction } = useAccessControl();
  const canRoles = hasAction("Access_rights.assign_roles");
  const canInvite = hasAction("Access_rights.invite_users");
  // Members actions still count, so roles that managed users from Members keep it.
  const canStatus = hasAction("Access_rights.deactivate_users") || hasAction("Members.change_status");
  const canReset = hasAction("Access_rights.reset_password") || hasAction("Members.send_password_link");
  const canSelect = canRoles || canStatus;

  const initialTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.key === initialTab) ? (initialTab as Tab) : "all"
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [giving, setGiving] = useState(false);
  const [bulkRole, setBulkRole] = useState<number | null>(null);

  const scopeOne = activeBranchId !== ALL_BRANCHES;
  const sb = scopeOne ? (activeBranchId as number) : null;
  const sbName = sb !== null ? branchName(sb) : "all branches";

  const scoped = useMemo(
    () =>
      users.filter(
        (user) => sb === null || user.home_branch_id === sb || grantsOf(user).some((g) => g.branch_id === sb)
      ),
    [users, sb]
  );

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      scoped
        .filter((user) => matchesTab(user, tab))
        .filter(
          (user) =>
            !q || `${user.name} ${user.email ?? ""} ${user.member_id ?? ""}`.toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [scoped, tab, q]
  );

  // Selection only covers rows that are on screen.
  const selIds = list.filter((user) => selected.has(user.id)).map((user) => user.id);
  useEffect(() => setSelected(new Set()), [tab, activeBranchId]);

  const pickTab = (next: Tab) => {
    setTab(next);
    const nextParams = new URLSearchParams(params);
    if (next === "all") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSel = list.length > 0 && selIds.length === list.length;
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(list.map((user) => user.id)));
  const clear = () => setSelected(new Set());

  /* --------------------------------- actions -------------------------------- */

  const setRowRole = (user: AssignableUser, roleId: number | null) => {
    if (sb === null) return;
    void assign(
      [user.id],
      sb,
      roleId,
      roleId
        ? `${user.name} is now ${roleName(roleId)} in ${branchName(sb)}.`
        : `${user.name} no longer has access to ${branchName(sb)}.`
    ).catch(() => undefined);
  };

  const onBulkRole = (value: string) => {
    const roleId = Number(value);
    if (!roleId || !selIds.length) return;
    if (sb === null) {
      setBulkRole(roleId);
      return;
    }
    const ids = selIds;
    clear();
    void assign(
      ids,
      sb,
      roleId,
      `${ids.length} ${ids.length === 1 ? "user is" : "users are"} now ${roleName(roleId)} in ${sbName}.`,
      true
    ).catch(() => undefined);
  };

  const deactivate = (input: number[]) => {
    const ids = input.filter((id) => String(id) !== meId);
    if (!ids.length) {
      notify.info({ title: "Nothing to deactivate", message: "You can’t deactivate your own account." });
      return;
    }
    confirmAction({
      title: `Deactivate ${ids.length === 1 ? userName(ids[0]) : `${ids.length} users`}?`,
      message: "They lose sign-in access until reactivated. Their role and records stay.",
      confirmLabel: "Deactivate",
      tone: "danger",
      onConfirm: () => setActive(ids, false).then(clear),
    });
  };

  const activate = () => {
    const ids = selIds;
    void setActive(ids, true)
      .then(clear)
      .catch(() => undefined);
  };

  /* ---------------------------------- view ---------------------------------- */

  const subtitle =
    sb === null
      ? "Everyone who can sign in to the admin app, across all branches."
      : `Everyone with access to ${sbName}. Change their role here straight from the list.`;
  const roleCol = sb === null ? "Branch access" : `Role in ${sbName}`;
  const emptyText = tab === "noaccess" && !q ? "Everyone has a role." : "No users match.";
  const openUser = users.find((user) => user.id === openId) ?? null;

  const renderRole = (user: AssignableUser) => {
    const grants = grantsOf(user);
    if (sb === null) {
      return (
        <span className="flex flex-wrap gap-1">
          {grants.map((g) => (
            <Pill key={g.branch_id} tone="neutral" className="bg-inputBackground font-medium">
              {shortBranch(branchName(g.branch_id))} · {g.access_level_name || roleName(g.access_level_id)}
            </Pill>
          ))}
          {!grants.length && <Pill tone="warning">No access</Pill>}
        </span>
      );
    }
    const current = roleIn(user, sb);
    const others = grants.filter((g) => g.branch_id !== sb).length;
    return (
      <span className="flex w-full flex-col gap-1">
        <select
          value={current ? String(current) : ""}
          disabled={!canRoles}
          aria-label={`Role for ${user.name} in ${sbName}`}
          onChange={(event) => setRowRole(user, Number(event.target.value) || null)}
          className={cn(
            "h-10 w-full rounded-lg border px-2 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-80",
            current ? "border-gray-500/35 bg-white" : "border-amber-200 bg-amber-50"
          )}
        >
          <option value="">No access</option>
          {roles.map((role) => (
            <option key={role.id} value={String(role.id)}>
              {role.name}
            </option>
          ))}
        </select>
        {others > 0 && (
          <button
            type="button"
            onClick={() => setOpenId(user.id)}
            className="self-start text-xs text-gray-600 underline hover:text-primary"
          >
            + {others} other {others === 1 ? "branch" : "branches"}
          </button>
        )}
      </span>
    );
  };

  const statusPill = (user: AssignableUser) =>
    isActive(user) ? <Pill tone="success">Active</Pill> : <Pill tone="neutral">Inactive</Pill>;
  const displayName = (user: AssignableUser) => `${user.name}${String(user.id) === meId ? " (you)" : ""}`;

  return (
    <PageOutline className="flex flex-col gap-4">
      <div className="mb-2">
        <PageHeading
          title="Users"
          subtitle={subtitle}
          actions={
            canInvite ? (
              <UiButton tone="primary" onClick={() => setGiving(true)} className="whitespace-nowrap">
                Give access
              </UiButton>
            ) : undefined
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented
          role="tablist"
          ariaLabel="Filter users"
          value={tab}
          onChange={pickTab}
          options={TABS.map((t) => ({
            value: t.key,
            label: `${t.label} (${scoped.filter((user) => matchesTab(user, t.key)).length})`,
          }))}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, email or ID"
          ariaLabel="Search users"
          className="w-full max-w-[320px] flex-none"
        />
      </div>

      {failed && !loading && (
        <InlineAlert
          tone="error"
          title="Couldn't load users"
          action={{ label: "Try again", onClick: () => void refetch(false) }}
        >
          Check your connection and try again.
        </InlineAlert>
      )}

      {canSelect && selIds.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-primary py-2 pl-4 pr-2 text-white"
        >
          <span className="mr-auto text-sm font-semibold">{selIds.length} selected</span>
          {canRoles && (
            <select
              value=""
              onChange={(event) => onBulkRole(event.target.value)}
              aria-label="Change role for selected users"
              className="h-10 max-w-full cursor-pointer rounded-lg border-none bg-white px-3 text-sm text-primary"
            >
              <option value="">{sb === null ? "Give a role in a branch…" : `Set role in ${sbName}…`}</option>
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name}
                </option>
              ))}
            </select>
          )}
          {canStatus && (
            <>
              <button
                type="button"
                onClick={activate}
                className="min-h-[40px] rounded-lg border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() => deactivate(selIds)}
                className="min-h-[40px] rounded-lg border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                Deactivate
              </button>
            </>
          )}
          <button
            type="button"
            onClick={clear}
            aria-label="Clear selection"
            className="h-10 w-10 rounded-lg text-xl hover:bg-white/10"
          >
            ×
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg bg-white shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)] tablet:block">
        <div className="min-w-[880px] text-sm text-primary">
          <div className={cn(GRID, "bg-lightGray font-semibold")}>
            <span className="py-4 pl-6 pr-2">
              {canSelect && (
                <input
                  type="checkbox"
                  checked={allSel}
                  onChange={toggleAll}
                  aria-label="Select all users"
                  className="h-4 w-4 accent-primary"
                />
              )}
            </span>
            <span className="p-4">Name</span>
            <span className="p-4">Member ID</span>
            <span className="p-4">{roleCol}</span>
            <span className="p-4">Status</span>
            <span className="p-4">Last active</span>
            <span />
          </div>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-16 animate-pulse border-b border-lightGray bg-lightGray/10" />
              ))
            : list.map((user) => (
                <div
                  key={user.id}
                  className={cn(GRID, "min-h-[64px] border-b border-lightGray hover:bg-lightGray/20")}
                >
                  <span className="py-3 pl-6 pr-2">
                    {canSelect && (
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggle(user.id)}
                        aria-label={`Select ${user.name}`}
                        className="h-4 w-4 accent-primary"
                      />
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenId(user.id)}
                    className="flex min-w-0 items-center gap-3 px-4 py-3 text-left"
                  >
                    <Avatar name={user.name} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{displayName(user)}</span>
                      <span className="truncate text-xs text-gray-500">{user.email}</span>
                    </span>
                  </button>
                  <span className="px-4 py-3 text-gray-600">{user.member_id || "—"}</span>
                  <span className="px-4 py-3">{renderRole(user)}</span>
                  <span className="px-4 py-3">{statusPill(user)}</span>
                  <span className="px-4 py-3 text-gray-600">{formatLastActive(user.last_active_at)}</span>
                  <span className="py-3 pr-6 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenId(user.id)}
                      className="min-h-[40px] rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/5"
                    >
                      Details
                    </button>
                  </span>
                </div>
              ))}
        </div>
      </div>

      {/* Phone cards */}
      <div className="flex flex-col gap-3 tablet:hidden">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-lightGray bg-white" />
            ))
          : list.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 text-sm text-primary"
              >
                <div className="flex items-center gap-3">
                  {canSelect && (
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => toggle(user.id)}
                      aria-label={`Select ${user.name}`}
                      className="h-5 w-5 accent-primary"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenId(user.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Avatar name={user.name} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{displayName(user)}</span>
                      <span className="text-xs text-gray-500">
                        {user.member_id || "—"} · {formatLastActive(user.last_active_at)}
                      </span>
                    </span>
                  </button>
                  {statusPill(user)}
                </div>
                {renderRole(user)}
              </div>
            ))}
      </div>

      {!loading && !failed && !list.length && <p className="py-6 text-center text-gray-500">{emptyText}</p>}

      <UserDrawer
        user={openUser}
        onClose={() => setOpenId(null)}
        data={data}
        meId={meId}
        canRoles={canRoles}
        canStatus={canStatus}
        canReset={canReset}
        preferBranch={sb}
        onDeactivate={deactivate}
      />
      <GiveAccessDialog open={giving} onClose={() => setGiving(false)} data={data} />
      <BulkBranchDialog
        open={bulkRole !== null}
        onClose={() => setBulkRole(null)}
        ids={selIds}
        roleId={bulkRole}
        data={data}
        onDone={() => {
          setBulkRole(null);
          clear();
        }}
      />
    </PageOutline>
  );
};

export default UsersPage;
