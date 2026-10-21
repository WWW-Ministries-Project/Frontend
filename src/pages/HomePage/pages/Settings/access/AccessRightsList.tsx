import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";

import PageOutline from "../../../Components/PageOutline";
import {
  PageHeading,
  Pill,
  SearchInput,
  UiButton,
} from "../../MembershipManagement/components/membershipUi";
import { Avatar, LevelDot } from "../Components/settingsUi";
import type { AccessRight } from "../utils/settingsInterfaces";
import {
  draftFromAccessRight,
  formatDay,
  LEVEL_DOT,
  LEVELS,
  levelMix,
  MODULES,
  plural,
} from "../utils/settingsModel";
import { NewRoleDialog } from "./RoleDialogs";
import { grantsInScope, rolePath, uniquePeople, useAccessData, useBranchScope } from "./useAccessRights";

const BAR = ["#F3F4F6", LEVEL_DOT[1], LEVEL_DOT[2], LEVEL_DOT[3]];

const RoleCard = ({ role, scope, onOpen }: { role: AccessRight; scope: ReturnType<typeof useBranchScope>; onOpen: () => void }) => {
  const draft = draftFromAccessRight(role);
  const mix = levelMix(draft);
  const people = uniquePeople(grantsInScope(role, scope.activeBranchId));
  const n = people.length;
  const tags: string[] = [];
  if (Object.keys(draft.scopes).some((k) => draft.scopes[k] && draft.perms[k] !== "No_Access")) tags.push("Own departments only");
  const hidden = Object.entries(draft.excl).reduce(
    (sum, [key, ids]) => sum + (draft.perms[key] !== "No_Access" ? ids.length : 0),
    0
  );
  if (hidden) tags.push(plural(hidden, "person hidden", "people hidden"));
  const edited = formatDay(role.updated_at || role.created_at);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5 text-primary shadow-[0_8px_24px_rgba(8,13,45,0.08)] transition-shadow hover:shadow-[0_10px_28px_rgba(8,13,45,0.2)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-xl font-semibold leading-7">{role.name}</h2>
        <Pill tone="neutral" className="flex-shrink-0">
          {plural(n, "person", "people")}
        </Pill>
      </div>
      <p className="min-h-10 text-sm text-[#4B5563]">{role.description}</p>
      <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-[#F3F4F6]">
        {[3, 2, 1]
          .filter((i) => mix[i])
          .map((i) => (
            <span key={i} style={{ width: `${(mix[i] / MODULES.length) * 100}%`, background: BAR[i] }} />
          ))}
      </div>
      <p className="text-xs text-[#4B5563]">
        {mix[3]} full · {mix[2]} manage · {mix[1]} view · {mix[0]} none
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Pill key={t} tone="info">
              {t}
            </Pill>
          ))}
        </div>
      )}
      <div className="mt-auto flex min-h-[41px] items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
        <div className="flex">
          {people.slice(0, 4).map((p, i) => (
            <Avatar
              key={p.user_id}
              name={p.name}
              size={28}
              className={i ? "-ml-1.5 border-2 border-white" : "border-2 border-white"}
            />
          ))}
          {n > 4 && (
            <span className="-ml-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#E5E7EB] text-xs font-semibold text-[#374151]">
              +{n - 4}
            </span>
          )}
          {!n && <span className="text-xs text-[#6B7280]">No one yet</span>}
        </div>
        {edited && <span className="text-xs text-[#6B7280]">Edited {edited}</span>}
      </div>
    </div>
  );
};

const CardSkeleton = () => (
  <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5">
    <div className="h-7 w-1/2 rounded bg-[#F3F4F6]" />
    <div className="h-10 w-full rounded bg-[#F3F4F6]" />
    <div className="h-2 w-full rounded-full bg-[#F3F4F6]" />
    <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
    <div className="h-7 w-24 rounded bg-[#F3F4F6]" />
  </div>
);

const AccessRightsList = () => {
  const navigate = useNavigate();
  const { canManage } = useAccessControl();
  const canEdit = canManage("Access_rights");
  const scope = useBranchScope();
  const { roles, users, loading, reloadRoles } = useAccessData();
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const noRole = useMemo(
    () =>
      users.filter((u) => {
        const access = u.branch_access || [];
        const inScope =
          scope.isAll || u.home_branch_id === scope.activeBranchId || access.some((a) => a.branch_id === scope.activeBranchId);
        return inScope && !access.length;
      }).length,
    [users, scope]
  );

  const cards = useMemo(() => {
    const query = q.trim().toLowerCase();
    return roles.filter((r) => !query || `${r.name} ${r.description ?? ""}`.toLowerCase().includes(query));
  }, [roles, q]);

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Access rights"
        subtitle="A role decides which modules someone can see and change. Roles are given per branch, so a person can be an admin in one branch and read-only in another."
        actions={
          canEdit ? (
            <UiButton tone="primary" onClick={() => setNewOpen(true)}>
              New role
            </UiButton>
          ) : undefined
        }
      />
      {!canEdit && (
        <InlineAlert tone="info">You can view roles but not change them. Ask someone with Manage access to Access rights.</InlineAlert>
      )}
      {noRole > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <p className="text-sm font-medium text-[#B45309]">
            {plural(noRole, "user has", "users have")} no branch access and can’t open any admin module.
          </p>
          <UiButton onClick={() => navigate("/home/settings/users?tab=noaccess")}>Assign roles</UiButton>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search roles" ariaLabel="Search roles" className="w-full max-w-[360px] flex-none" />
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#4B5563]">
          {LEVELS.map((lv, i) => (
            <span key={lv.value} className="inline-flex items-center gap-1.5">
              <LevelDot rank={i} size={10} />
              {lv.label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
          : cards.map((role) => (
              <RoleCard key={role.id} role={role} scope={scope} onOpen={() => navigate(rolePath(role.id))} />
            ))}
      </div>
      {!loading && !cards.length && (
        <p className="text-sm text-[#6B7280]">{roles.length ? "No roles match your search." : "No roles yet."}</p>
      )}

      <NewRoleDialog
        open={newOpen}
        roles={roles}
        reloadRoles={reloadRoles}
        onClose={() => setNewOpen(false)}
        onCreated={(role) => {
          setNewOpen(false);
          navigate(rolePath(role.id));
          notify.success({
            title: "Role created",
            message: "Check its permissions, then add people.",
            action: { label: "Add people", onClick: () => navigate(rolePath(role.id, "people", true)) },
          });
        }}
      />
    </PageOutline>
  );
};

export default AccessRightsList;
