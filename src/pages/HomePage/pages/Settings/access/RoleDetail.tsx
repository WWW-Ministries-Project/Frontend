import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";

import {
  BandTabs,
  Pill,
  SearchInput,
  SectionEmpty,
  UiButton,
} from "../../MembershipManagement/components/membershipUi";
import { Avatar, LevelDot, PeopleChips, Segmented, UnsavedBar } from "../Components/settingsUi";
import type { AccessLevelGrant } from "../utils/settingsInterfaces";
import {
  changedModules,
  cloneDraft,
  draftFromAccessRight,
  formatDay,
  LEVELS,
  MODULE_GROUPS,
  MODULES,
  plural,
  type Level,
  type RoleDraft,
  type SettingsModule,
} from "../utils/settingsModel";
import { AddPeopleDialog, DeleteRoleDialog, EditRoleDialog } from "./RoleDialogs";
import {
  ACCESS_BASE,
  copyName,
  createRole,
  grantsInScope,
  rolePath,
  uniquePeople,
  updateRole,
  useAccessData,
  useBranchScope,
  useMemberOptions,
} from "./useAccessRights";

type Tab = "perm" | "people";
type Modal = "edit" | "del" | "add" | null;

const BAND_BUTTON = "border-white/40 bg-transparent text-white hover:bg-white/10";

/* -------------------------------------------------------------------------- */
/*                                 Module row                                 */
/* -------------------------------------------------------------------------- */

const ModuleRow = ({
  module,
  draft,
  changed,
  canEdit,
  memberOptions,
  nameOf,
  update,
}: {
  module: SettingsModule;
  draft: RoleDraft;
  changed: boolean;
  canEdit: boolean;
  memberOptions: { id: number; name: string }[];
  nameOf: (key: string, id: number) => string;
  update: (fn: (d: RoleDraft) => void) => void;
}) => {
  const level = draft.perms[module.key] || "No_Access";
  const has = level !== "No_Access";
  const hidden = draft.excl[module.key] || [];
  const exclTitle = module.key === "Members" ? "Hide these people’s profiles" : "Hide these people’s appointments";

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 tablet:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">{module.label}</p>
            {changed && (
              <Pill tone="info" className="px-2 py-0">
                Edited
              </Pill>
            )}
          </div>
          <p className="text-xs text-gray-500">{module.description}</p>
        </div>
        <Segmented<Level>
          ariaLabel={`${module.label} access`}
          value={level}
          disabled={!canEdit}
          onChange={(value) =>
            update((d) => {
              d.perms[module.key] = value;
            })
          }
          options={LEVELS.map((lv, i) => ({
            value: lv.value,
            label: (
              <>
                <LevelDot rank={i} />
                {lv.label}
              </>
            ),
          }))}
        />
      </div>
      {module.extra === "scope" && has && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-inputBackground px-4 py-3">
          <input
            type="checkbox"
            checked={!!draft.scopes[module.key]}
            disabled={!canEdit}
            onChange={() =>
              update((d) => {
                if (d.scopes[module.key]) delete d.scopes[module.key];
                else d.scopes[module.key] = true;
              })
            }
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-primary">Only their own departments</span>
            <span className="text-xs text-gray-500">
              They see and act on the departments they belong to, not the whole church.
            </span>
          </span>
        </label>
      )}
      {module.extra === "excl" && has && (
        <div className="flex flex-col gap-2 rounded-lg bg-inputBackground px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-primary">{exclTitle}</p>
            <p className="text-xs text-gray-500">
              For pastors and counsellors whose details should stay private from this role.
            </p>
          </div>
          <PeopleChips
            framed={false}
            tone="white"
            disabled={!canEdit}
            people={hidden.map((id) => ({ id, name: nameOf(module.key, id) }))}
            options={memberOptions.filter((m) => !hidden.includes(m.id))}
            addLabel={exclTitle}
            placeholder="Hide someone…"
            emptyText="No one hidden."
            onAdd={(id) =>
              update((d) => {
                d.excl[module.key] = [...(d.excl[module.key] || []), id];
              })
            }
            onRemove={(id) =>
              update((d) => {
                const next = (d.excl[module.key] || []).filter((x) => x !== id);
                if (next.length) d.excl[module.key] = next;
                else delete d.excl[module.key];
              })
            }
          />
        </div>
      )}
      {module.extra === "explicit" && (
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="warning" className="px-2 py-0">
            Grant on purpose
          </Pill>
          <span className="text-xs text-gray-600">{module.why} Templates and “Set all” never switch it on.</span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

const Skeleton = () => (
  <div aria-hidden="true" className="flex min-h-full animate-pulse flex-col">
    <div className="flex flex-col gap-4 bg-primary px-[var(--app-page-padding-inline)] pb-6 pt-5">
      <div className="h-4 w-28 rounded bg-white/20" />
      <div className="h-8 w-64 rounded bg-white/20" />
      <div className="h-5 w-96 max-w-full rounded bg-white/15" />
    </div>
    <div className="flex flex-col gap-4 bg-white px-[var(--app-page-padding-inline)] py-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-40 rounded-xl border border-lightGray bg-inputBackground" />
      ))}
    </div>
  </div>
);

const RoleDetail = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "people" ? "people" : "perm";
  const { canManage, canAdmin } = useAccessControl();
  const canEdit = canManage("Access_rights");
  const canDelete = canAdmin("Access_rights");
  const myId = useUserStore((s) => s.id);
  const scope = useBranchScope();
  const { roles, users, loading, reload, reloadRoles } = useAccessData();
  const memberOptions = useMemberOptions(canEdit);

  const role = useMemo(() => roles.find((r) => String(r.id) === roleId), [roles, roleId]);
  const base = useMemo(() => draftFromAccessRight(role), [role]);
  const [draft, setDraft] = useState<RoleDraft | null>(null);
  const [pq, setPq] = useState("");
  const [onlyWithAccess, setOnlyWithAccess] = useState<"all" | "with">("all");
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);

  // A new role starts with a clean draft and filters.
  useEffect(() => {
    setDraft(null);
    setPq("");
    setOnlyWithAccess("all");
  }, [roleId]);

  // "?add=1" (from the "Role created" toast) opens Add people once the role is loaded.
  useEffect(() => {
    if (!role || params.get("add") !== "1") return;
    if (canEdit) setModal("add");
    const next = new URLSearchParams(params);
    next.delete("add");
    setParams(next, { replace: true });
  }, [role, params, setParams, canEdit]);

  const current = draft ?? base;
  const changed = useMemo(() => changedModules(base, current), [base, current]);
  const dirty = canEdit && changed.size > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const guard = useCallback(
    (go: () => void) => {
      if (!dirty) return go();
      confirmAction({
        title: "Discard unsaved changes?",
        message: "Your permission changes to this role haven’t been saved.",
        confirmLabel: "Discard changes",
        tone: "danger",
        onConfirm: () => {
          setDraft(null);
          go();
        },
      });
    },
    [dirty]
  );

  const update = (fn: (d: RoleDraft) => void) => {
    if (!canEdit) return;
    setDraft((prev) => {
      const next = cloneDraft(prev ?? base);
      fn(next);
      return next;
    });
  };

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === "people") p.set("tab", "people");
    else p.delete("tab");
    setParams(p, { replace: true });
  };

  if (loading) return <Skeleton />;

  if (!role) {
    return (
      <div className="flex flex-col gap-4 px-[var(--app-page-padding-inline)] py-6">
        <SectionEmpty
          title="Role not found"
          text="It may have been deleted, or the link is wrong."
          action={<UiButton onClick={() => navigate(ACCESS_BASE)}>Back to access rights</UiButton>}
        />
      </div>
    );
  }

  const allGrants = role.grants || [];
  const totalPeople = uniquePeople(allGrants).length;
  const scoped = grantsInScope(role, scope.activeBranchId);
  const nP = uniquePeople(scoped).length;
  const edited = formatDay(role.updated_at || role.created_at);

  const memberName = new Map(memberOptions.map((m) => [m.id, m.name]));
  const nameOf = (key: string, id: number) => {
    const fallback = (role.exclusion_users?.[key] || []).find((u) => u.id === id);
    return memberName.get(id) || fallback?.name || fallback?.full_name || `Member #${id}`;
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateRole(role, role.name, role.description || "", current);
      await reloadRoles();
      setDraft(null);
      notify.success({
        title: "Role saved",
        message: totalPeople
          ? `${role.name} · ${plural(totalPeople, "person has", "people have")} the new access now.`
          : `${role.name} is saved. Add people when you’re ready.`,
      });
    } catch {
      // The API layer already raised a toast.
    } finally {
      setSaving(false);
    }
  };

  const duplicate = () =>
    guard(async () => {
      try {
        const copy = await createRole(copyName(roles, role.name), role.description || "", base, reloadRoles);
        if (!copy) return;
        navigate(rolePath(copy.id));
        notify.success({ title: "Role duplicated", message: "Rename it and adjust what’s different." });
      } catch {
        // The API layer already raised a toast.
      }
    });

  const removePerson = (g: AccessLevelGrant) =>
    confirmAction({
      title: `Remove ${g.name} from ${role.name} in ${g.branch_name}?`,
      message: `They lose access to ${g.branch_name}. Their access in other branches stays.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        await api.put.setUserBranchAccess({ user_id: g.user_id, branch_id: g.branch_id, access_level_id: null });
        await reload();
        notify.success({
          title: "Removed from role",
          message: `${g.name} no longer has access to ${g.branch_name}.`,
          undo: async () => {
            await api.put.setUserBranchAccess({ user_id: g.user_id, branch_id: g.branch_id, access_level_id: role.id });
            await reload();
          },
        });
      },
    });

  /* ------------------------------ permissions ----------------------------- */
  const query = pq.trim().toLowerCase();
  const groups = MODULE_GROUPS.map((group) => {
    const all = MODULES.filter((m) => m.group === group);
    const on = all.filter((m) => (current.perms[m.key] || "No_Access") !== "No_Access").length;
    const rows = all.filter(
      (m) =>
        (!query || `${m.label} ${m.description}`.toLowerCase().includes(query)) &&
        (onlyWithAccess === "all" || (current.perms[m.key] || "No_Access") !== "No_Access" || changed.has(m.key))
    );
    return { group, all, on, rows };
  }).filter((g) => g.rows.length > 0);

  const permissions = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SearchInput
          value={pq}
          onChange={setPq}
          placeholder="Find a module"
          ariaLabel="Find a module"
          className="w-full max-w-[360px] flex-none"
        />
        <Segmented<"all" | "with">
          role="tablist"
          ariaLabel="Modules shown"
          value={onlyWithAccess}
          onChange={setOnlyWithAccess}
          options={[
            { value: "all", label: "All modules" },
            { value: "with", label: "With access" },
          ]}
        />
      </div>
      <p className="text-xs text-gray-600">
        <strong className="font-semibold">View</strong> see records · <strong className="font-semibold">Manage</strong>{" "}
        create and edit · <strong className="font-semibold">Full</strong> also delete and change module settings
      </p>
      {groups.map(({ group, all, on, rows }) => (
        <section key={group} className="overflow-hidden rounded-xl border border-lightGray">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-inputBackground px-4 py-3 tablet:px-6">
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-primary">{group}</h2>
              <p className="text-xs text-gray-500">
                {on} of {all.length} with access
              </p>
            </div>
            {canEdit && (
              <select
                value=""
                aria-label={`Set every module in ${group}`}
                onChange={(e) => {
                  const value = e.target.value as Level | "";
                  if (!value) return;
                  update((d) => {
                    all.filter((m) => m.extra !== "explicit").forEach((m) => {
                      d.perms[m.key] = value;
                    });
                  });
                }}
                className="h-10 cursor-pointer rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary"
              >
                <option value="">Set all to…</option>
                {LEVELS.map((lv) => (
                  <option key={lv.value} value={lv.value}>
                    {lv.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          {rows.map((m) => (
            <ModuleRow
              key={m.key}
              module={m}
              draft={current}
              changed={changed.has(m.key)}
              canEdit={canEdit}
              memberOptions={memberOptions}
              nameOf={nameOf}
              update={update}
            />
          ))}
        </section>
      ))}
      {!groups.length && <p className="text-sm text-gray-500">No modules match.</p>}
    </>
  );

  /* -------------------------------- people -------------------------------- */
  const people = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-primary">
            {plural(nP, "person has", "people have")} this role{scope.isAll ? " across branches" : ` in ${scope.scopeName}`}
          </h2>
          <p className="text-sm text-gray-600">
            Each person has one role per branch. Adding someone here sets their role in the branch you choose.
          </p>
        </div>
        {canEdit && (
          <UiButton tone="primary" onClick={() => setModal("add")}>
            Add people
          </UiButton>
        )}
      </div>
      {scoped.length ? (
        <div className="overflow-hidden rounded-xl border border-lightGray">
          {scoped.map((g) => {
            const me = String(g.user_id) === String(myId);
            return (
              <div
                key={`${g.user_id}-${g.branch_id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-lightGray/20"
              >
                <Avatar name={g.name} size={36} />
                <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <span className="text-sm font-medium text-primary">
                    {g.name}
                    {me ? " (you)" : ""}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {g.email ? `${g.email} · ` : ""}
                    {g.branch_name}
                  </span>
                </div>
                <Pill tone={g.is_active === false ? "neutral" : "success"}>
                  {g.is_active === false ? "Inactive" : "Active"}
                </Pill>
                {canEdit && !me && (
                  <UiButton
                    tone="ghost"
                    size="sm"
                    className="min-h-10 text-red-700 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removePerson(g)}
                  >
                    Remove
                  </UiButton>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray px-4 py-8 text-center">
          <p className="text-base font-semibold text-primary">No one has this role yet</p>
          <p className="text-sm text-gray-600">Add people and they get these permissions right away.</p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-4 bg-primary px-[var(--app-page-padding-inline)] pt-5 text-white">
        <button
          type="button"
          onClick={() => guard(() => navigate(ACCESS_BASE))}
          className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
        >
          ← Access rights
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
            <h1 className="break-words text-2xl font-semibold leading-8">{role.name}</h1>
            {role.description && <p className="text-base text-white/80">{role.description}</p>}
            <p className="text-xs text-white/80">
              {plural(nP, "person", "people")}
              {scope.isAll ? "" : ` in ${scope.scopeName}`}
              {edited ? ` · Last edited ${edited}` : ""}
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <UiButton className={BAND_BUTTON} onClick={() => setModal("edit")}>
                Edit details
              </UiButton>
              <UiButton className={BAND_BUTTON} onClick={duplicate}>
                Duplicate
              </UiButton>
              {canDelete && (
                <UiButton className={BAND_BUTTON} onClick={() => setModal("del")}>
                  Delete
                </UiButton>
              )}
            </div>
          )}
        </div>
        <div className="-mb-px overflow-x-auto">
          <BandTabs<Tab>
            ariaLabel="Role sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "perm", label: "Permissions" },
              { key: "people", label: `People (${nP})` },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-white px-[var(--app-page-padding-inline)] py-6">
        {!canEdit && (
          <InlineAlert tone="info">View only. You can see this role’s permissions but not change them.</InlineAlert>
        )}
        {tab === "perm" ? permissions : people}
      </div>

      {dirty && (
        <UnsavedBar
          title={plural(changed.size, "unsaved change", "unsaved changes")}
          subtitle={
            totalPeople
              ? "Applies to everyone with this role, in every branch, as soon as you save."
              : "No one has this role yet."
          }
          saving={saving}
          onDiscard={() => setDraft(null)}
          onSave={save}
        />
      )}

      {canEdit && (
        <>
          <EditRoleDialog
            open={modal === "edit"}
            role={role}
            roles={roles}
            onClose={() => setModal(null)}
            onSaved={reloadRoles}
          />
          <AddPeopleDialog
            open={modal === "add"}
            role={role}
            roles={roles}
            users={users}
            branches={scope.branches}
            defaultBranchId={scope.isAll ? null : (scope.activeBranchId as number)}
            onClose={() => setModal(null)}
            onChanged={reload}
          />
        </>
      )}
      {canDelete && (
        <DeleteRoleDialog
          open={modal === "del"}
          role={role}
          roles={roles}
          peopleCount={totalPeople}
          onClose={() => setModal(null)}
          onDeleted={() => {
            setModal(null);
            setDraft(null);
            navigate(ACCESS_BASE);
          }}
        />
      )}
    </div>
  );
};

export default RoleDetail;
