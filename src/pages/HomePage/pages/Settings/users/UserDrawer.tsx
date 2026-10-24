import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import { cn } from "@/utils/cn";

import { FieldHint, ToggleSwitch } from "../../ChurchCommunication/ui/commUi";
import { UiButton } from "../../MembershipManagement/components/membershipUi";
import { Avatar, LevelDot, SettingsDrawer, SubHeading } from "../Components/settingsUi";
import { draftFromAccessRight, formatLastActive, LEVEL_RANK, MODULES } from "../utils/settingsModel";
import { describeExpiry, grantsOf, isActive, type UsersData } from "./useUsersData";
import { usePickableBranches } from "../utils/usePickableBranches";

const selectClass =
  "h-10 min-w-0 rounded-lg border border-gray-500/35 bg-white px-2 text-sm text-primary disabled:cursor-not-allowed disabled:bg-inputBackground disabled:opacity-60";

const LEVEL_WORD = ["", "View", "Manage", "Full"];

export const UserDrawer = ({
  user,
  onClose,
  data,
  meId,
  canRoles,
  canStatus,
  preferBranch,
  onDeactivate,
}: {
  user: AssignableUser | null;
  onClose: () => void;
  data: UsersData;
  meId: string;
  canRoles: boolean;
  canStatus: boolean;
  /** Branch to describe first (the active branch when one is picked). */
  preferBranch: number | null;
  onDeactivate: (ids: number[]) => void;
}) => {
  const navigate = useNavigate();
  const branches = usePickableBranches();
  const { roles, assign, setActive, branchName, roleName, memberNames, loadMembers } = data;
  const [viewBranch, setViewBranch] = useState<number | null>(null);
  const [add, setAdd] = useState({ b: "", r: "" });
  const [addError, setAddError] = useState("");
  const [sending, setSending] = useState(false);

  const userId = user?.id;
  useEffect(() => {
    setViewBranch(null);
    setAdd({ b: "", r: "" });
    setAddError("");
  }, [userId]);

  const grants = user ? grantsOf(user) : [];
  const shownBranch =
    grants.find((g) => g.branch_id === viewBranch)?.branch_id ??
    grants.find((g) => g.branch_id === preferBranch)?.branch_id ??
    grants[0]?.branch_id ??
    null;
  const shownGrant = grants.find((g) => g.branch_id === shownBranch);
  const role = shownGrant ? roles.find((r) => r.id === shownGrant.access_level_id) : undefined;

  const hiddenIds = useMemo(() => (role ? Object.values(draftFromAccessRight(role).excl).flat() : []), [role]);
  useEffect(() => {
    if (hiddenIds.some((id) => !memberNames.has(id))) void loadMembers();
  }, [hiddenIds, memberNames, loadMembers]);

  const { caps, notes } = useMemo(() => {
    const caps: { rank: number; text: string }[] = [];
    const notes: string[] = [];
    if (!role) return { caps, notes };
    const draft = draftFromAccessRight(role);
    [3, 2, 1].forEach((rank) => {
      const labels = MODULES.filter((m) => LEVEL_RANK[draft.perms[m.key] || "No_Access"] === rank).map(
        (m) => m.label
      );
      if (labels.length) caps.push({ rank, text: labels.join(", ") });
    });
    const none = MODULES.filter((m) => (draft.perms[m.key] || "No_Access") === "No_Access").length;
    if (none) notes.push(`No access to ${none} other ${none === 1 ? "module" : "modules"}.`);
    if (Object.keys(draft.scopes).length) notes.push("Departments and attendance limited to their own departments.");
    Object.entries(draft.excl).forEach(([key, ids]) => {
      const fromRole = role.exclusion_users?.[key] ?? [];
      const names = ids.map((id) => {
        const hit = fromRole.find((u) => u.id === id);
        return hit?.name || hit?.full_name || memberNames.get(id) || `user #${id}`;
      });
      notes.push(
        `${key === "Members" ? "Can’t see the profiles of " : "Can’t see appointments of "}${names.join(", ")}.`
      );
    });
    return { caps, notes };
  }, [role, memberNames]);

  if (!user) return null;

  const isMe = String(user.id) === meId;
  const active = isActive(user);
  const addBranchOpts = branches.filter((b) => !grants.some((g) => g.branch_id === b.id));

  const setRole = (branchId: number, roleId: number | null) =>
    assign(
      [user.id],
      branchId,
      roleId,
      roleId
        ? `${user.name} is now ${roleName(roleId)} in ${branchName(branchId)}.`
        : `${user.name} no longer has access to ${branchName(branchId)}.`
    );

  const remove = (branchId: number) =>
    confirmAction({
      title: `Remove ${user.name}’s access to ${branchName(branchId)}?`,
      message: "Their access in other branches stays.",
      confirmLabel: "Remove access",
      tone: "danger",
      onConfirm: () => setRole(branchId, null),
    });

  const addGrant = () => {
    if (!add.b || !add.r) {
      setAddError("Pick a branch and a role. Both are needed to give access.");
      return;
    }
    const branchId = Number(add.b);
    setRole(branchId, Number(add.r))
      .then(() => {
        setAdd({ b: "", r: "" });
        setViewBranch(branchId);
      })
      .catch(() => undefined);
  };

  const toggleActive = (next: boolean) => {
    if (next) void setActive([user.id], true).catch(() => undefined);
    else onDeactivate([user.id]);
  };

  const sendReset = async () => {
    setSending(true);
    try {
      const res = await api.post.sendResetLink({ user_id: user.id });
      const email = res.data?.email || user.email || "them";
      const expiry = describeExpiry(res.data?.expires_in);
      notify.success({
        title: "Password reset sent",
        message: `We emailed a reset link to ${email}.${expiry ? ` It expires in ${expiry}.` : ""}`,
      });
    } catch {
      // The API layer already raised a toast.
    } finally {
      setSending(false);
    }
  };

  const facts = [
    ["Member ID", user.member_id || "—"],
    ["Branch", user.home_branch_name || (user.home_branch_id ? branchName(user.home_branch_id) : "—")],
    ["Last active", formatLastActive(user.last_active_at)],
  ];

  return (
    <SettingsDrawer
      open
      onClose={onClose}
      width={480}
      title={user.name}
      header={
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={48} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-xl font-semibold leading-7 text-primary">
              {user.name}
              {isMe ? " (you)" : ""}
            </p>
            <p className="truncate text-sm text-gray-600">{user.email || "No email"}</p>
          </div>
        </div>
      }
    >
      <section className="flex flex-col gap-2">
        <SubHeading title="Branch access" />
        {!grants.length && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No branch access yet. They can sign in but won’t see any admin module.
          </p>
        )}
        {grants.map((grant) => {
          const on = grant.branch_id === shownBranch;
          const name = branchName(grant.branch_id);
          return (
            <div
              key={grant.branch_id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-lg border py-2 pl-3 pr-2",
                on ? "border-primary bg-inputBackground" : "border-lightGray bg-white"
              )}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setViewBranch(grant.branch_id)}
                className="min-w-0 flex-[1_1_140px] text-left text-sm font-semibold text-primary"
              >
                {name}
              </button>
              <select
                value={String(grant.access_level_id)}
                disabled={!canRoles}
                aria-label={`Role in ${name}`}
                onChange={(event) => {
                  const v = Number(event.target.value);
                  if (v) void setRole(grant.branch_id, v).catch(() => undefined);
                }}
                className={cn(selectClass, "flex-[1_1_160px]")}
              >
                <option value="">Role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>
              {canRoles && (
                <button
                  type="button"
                  onClick={() => remove(grant.branch_id)}
                  aria-label={`Remove access to ${name}`}
                  className="h-9 w-9 flex-shrink-0 rounded-lg border border-red-200 bg-white text-lg text-red-700 hover:bg-red-50"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {canRoles && addBranchOpts.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={add.b}
                aria-label="Branch to add"
                onChange={(event) => {
                  setAdd({ ...add, b: event.target.value });
                  setAddError("");
                }}
                className={cn(selectClass, "flex-[1_1_140px]")}
              >
                <option value="">Branch…</option>
                {addBranchOpts.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                value={add.r}
                aria-label="Role to give"
                onChange={(event) => {
                  setAdd({ ...add, r: event.target.value });
                  setAddError("");
                }}
                className={cn(selectClass, "flex-[1_1_140px]")}
              >
                <option value="">Role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>
              <UiButton tone="secondary" onClick={addGrant}>
                + Add branch
              </UiButton>
            </div>
            {addError && <FieldHint tone="error">{addError}</FieldHint>}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SubHeading title="What they can do">
          {role && shownBranch !== null && (
            <button
              type="button"
              onClick={() => navigate(`/home/settings/access-rights/${role.id}`)}
              className="text-xs text-gray-600 underline hover:text-primary"
            >
              In {branchName(shownBranch)} as {role.name}
            </button>
          )}
        </SubHeading>
        {!role && <p className="text-sm text-gray-500">Give them access to a branch to see this.</p>}
        {caps.map((cap) => (
          <div key={cap.rank} className="flex items-start gap-3 text-sm">
            <span className="inline-flex w-[72px] flex-shrink-0 items-center gap-1.5 font-semibold text-primary">
              <LevelDot rank={cap.rank} />
              {LEVEL_WORD[cap.rank]}
            </span>
            <p className="text-gray-700">{cap.text}</p>
          </div>
        ))}
        {notes.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg bg-inputBackground px-4 py-3">
            {notes.map((note) => (
              <p key={note} className="text-xs text-gray-600">
                {note}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SubHeading title="Account" />
        <div className="flex items-center justify-between gap-3 rounded-lg border border-lightGray px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary">Can sign in</span>
            <span className="text-xs text-gray-500">
              {isMe
                ? "You can’t deactivate your own account."
                : active
                  ? "They can sign in."
                  : "They can’t sign in until reactivated."}
            </span>
          </div>
          <ToggleSwitch on={active} onChange={toggleActive} label="Can sign in" disabled={!canStatus || isMe} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-lightGray px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary">Password</span>
            <span className="text-xs text-gray-500">Email them a link to set a new one.</span>
          </div>
          <UiButton
            tone="secondary"
            onClick={() => void sendReset()}
            disabled={sending || !user.email || !(canStatus || canRoles)}
            className="whitespace-nowrap"
          >
            {sending ? "Sending…" : "Send reset link"}
          </UiButton>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-medium text-primary">{value}</span>
          </div>
        ))}
      </div>
    </SettingsDrawer>
  );
};
