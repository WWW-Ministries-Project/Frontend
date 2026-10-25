import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { useBranchStore } from "@/store/useBranchStore";
import { useUserStore } from "@/store/userStore";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import {
  actionAllowed,
  actionDefault,
  defaultScope,
  normalizeActionOverrides,
  PERMISSION_CATALOG,
  scopeDescription,
  scopeLabel,
  type CatalogAction,
  type LevelRank,
} from "@/utils/permissionCatalog";

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
  actionOn,
  changedModules,
  clampToCeiling,
  cloneDraft,
  draftFromAccessRight,
  formatDay,
  hasAction,
  LEVEL_RANK,
  LEVELS,
  MODULE_GROUPS,
  MODULES,
  plural,
  requirementLabel,
  scopeOf,
  type Level,
  type RoleDraft,
  type SettingsModule,
} from "../utils/settingsModel";
import { AddPeopleDialog, DeleteRoleDialog, EditRoleDialog } from "./RoleDialogs";
import {
  isDefaultWorkspaces,
  toggleWorkspace,
  workspaceNames,
  WORKSPACES,
  workspacesOf,
  type WorkspaceKey,
} from "./workspacesModel";
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

type Tab = "perm" | "ws" | "people";
type Modal = "edit" | "del" | "add" | null;

const BAND_BUTTON = "border-white/40 bg-transparent text-white hover:bg-white/10";

/* -------------------------------------------------------------------------- */
/*                                 Module row                                 */
/* -------------------------------------------------------------------------- */

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={cn("h-4 w-4 text-gray-600 transition-transform", open && "rotate-180")}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ModuleRow = ({
  module,
  draft,
  changed,
  editable,
  ceilingRank,
  canGiveAction,
  expanded,
  onToggleExpanded,
  memberOptions,
  nameOf,
  update,
}: {
  module: SettingsModule;
  draft: RoleDraft;
  changed: boolean;
  /** Can edit, and the role isn't one they hold. */
  editable: boolean;
  /** Highest level the editor may give in this module. */
  ceilingRank: LevelRank;
  /** Whether the editor may switch this action on. */
  canGiveAction: (action: CatalogAction) => boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  memberOptions: { id: number; name: string }[];
  nameOf: (key: string, id: number) => string;
  update: (fn: (d: RoleDraft) => void) => void;
}) => {
  const level = draft.perms[module.key] || "No_Access";
  const rank = LEVEL_RANK[level];
  const has = rank > 0;
  const hidden = draft.excl[module.key] || [];
  const exclTitle = module.key === "Members" ? "Hide these people’s profiles" : "Hide these people’s appointments";
  const entry = PERMISSION_CATALOG[module.key];
  const overrides = draft.actions[module.key] || {};

  const actions = entry && has
    ? entry.actions.map((a) => {
        const byLevel = actionDefault(rank, a);
        const on = actionOn(draft, module.key, a);
        const custom = overrides[a.key] !== undefined && overrides[a.key] !== byLevel;
        const allowed = canGiveAction(a);
        const missing = !!a.requires && on && !hasAction(draft, a.requires);
        const hint = [
          custom ? (on ? "Added for this role" : "Switched off for this role") : a.explicit ? "Off unless you switch it on" : `Comes with ${LEVELS[a.defaultLevel].label}`,
          a.note,
          editable && !allowed && !on ? "Above your own access" : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return { a, on, custom, hint, disabled: !editable || (!on && !allowed), missing, byLevel };
      })
    : [];
  const scopes = entry?.scopes ?? ["branch"];
  const byLevelScope = defaultScope(rank, module.key);
  const scope = scopeOf(draft, module.key);
  const custom = has && (actions.some((x) => x.custom) || scope !== byLevelScope);

  const toggleAction = (a: CatalogAction, on: boolean, byLevel: boolean) =>
    update((d) => {
      const next = { ...(d.actions[module.key] || {}) };
      if (!on === byLevel) delete next[a.key];
      else next[a.key] = !on;
      if (Object.keys(next).length) d.actions[module.key] = next;
      else delete d.actions[module.key];
    });

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
            {custom && (
              <Pill tone="neutral" className="px-2 py-0">
                Custom
              </Pill>
            )}
            {module.extra === "new" && (
              <Pill tone="success" className="px-2 py-0">
                New
              </Pill>
            )}
          </div>
          <p className="text-xs text-gray-500">{module.description}</p>
        </div>
        <Segmented<Level>
          ariaLabel={`${module.label} access`}
          value={level}
          disabled={!editable}
          onChange={(value) =>
            update((d) => {
              d.perms[module.key] = value;
            })
          }
          options={LEVELS.map((lv, i) => {
            const over = editable && i > ceilingRank;
            return {
              value: lv.value,
              disabled: over,
              title: over ? "Above your own access" : lv.label,
              label: (
                <>
                  <LevelDot rank={i} />
                  {lv.label}
                </>
              ),
            };
          })}
        />
      </div>

      {entry && has && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="inline-flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-lg border border-lightGray bg-white px-3 py-1.5 text-left text-sm text-primary hover:bg-gray-100"
        >
          <span className="font-medium">
            {actions.filter((x) => x.on).length} of {actions.length} actions
          </span>
          <span className="text-gray-600">· {scopeLabel(module.key, scope)}</span>
          <ChevronIcon open={expanded} />
        </button>
      )}

      {entry && has && expanded && (
        <div className="grid gap-x-6 gap-y-4 rounded-lg bg-inputBackground p-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">What they can do</p>
              {custom && editable && (
                <UiButton
                  tone="ghost"
                  size="sm"
                  onClick={() =>
                    update((d) => {
                      delete d.actions[module.key];
                      delete d.scopes[module.key];
                    })
                  }
                >
                  Reset to {LEVELS[rank].label} defaults
                </UiButton>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {actions.map(({ a, on, custom: actionCustom, hint, disabled, missing, byLevel }) => (
                <label
                  key={a.key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-2 text-sm text-primary",
                    disabled ? "cursor-default" : "cursor-pointer hover:bg-white",
                    disabled && !on && editable && "opacity-60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => toggleAction(a, on, byLevel)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{a.label}</span>
                      {actionCustom && (
                        <Pill tone="neutral" className="px-2 py-0">
                          Custom
                        </Pill>
                      )}
                      {a.explicit && (
                        <Pill tone="warning" className="px-2 py-0">
                          On purpose
                        </Pill>
                      )}
                      {a.isNew && (
                        <Pill tone="success" className="px-2 py-0">
                          New feature
                        </Pill>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{hint}</span>
                    {missing && a.requires && (
                      <span className="text-xs text-amber-700">
                        Also needs {requirementLabel(a.requires)}, which this role doesn’t have.
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-h-8 items-center">
              <p className="text-sm font-semibold text-primary">Whose records they see</p>
            </div>
            {scopes.length === 1 ? (
              <p className="text-sm text-gray-600">Whole branch. This module has no narrower option.</p>
            ) : (
              <div role="radiogroup" aria-label="Whose records they see" className="flex flex-col gap-2">
                {scopes.map((value) => {
                  const on = scope === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm text-primary",
                        on ? "border-primary bg-white" : "border-lightGray bg-transparent",
                        editable ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      <input
                        type="radio"
                        name={`scope-${module.key}`}
                        checked={on}
                        disabled={!editable}
                        onChange={() =>
                          update((d) => {
                            if (value === byLevelScope) delete d.scopes[module.key];
                            else d.scopes[module.key] = value;
                          })
                        }
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium">{scopeLabel(module.key, value)}</span>
                          {value === byLevelScope && (
                            <Pill tone="neutral" className="px-2 py-0">
                              Default
                            </Pill>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">{scopeDescription(module.key, value)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Narrows what they see and act on. It never reaches past the branch the role is given in.
            </p>
          </div>
        </div>
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
            disabled={!editable}
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
      {module.extra === "retire" && (
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="neutral" className="px-2 py-0">
            Being retired
          </Pill>
          <span className="text-xs text-gray-600">{module.why}</span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Home workspaces                              */
/* -------------------------------------------------------------------------- */

const WorkspaceCards = ({
  value,
  isDefault,
  canEdit,
  saving,
  onToggle,
}: {
  value: WorkspaceKey[];
  isDefault: boolean;
  canEdit: boolean;
  saving: boolean;
  onToggle: (key: WorkspaceKey) => void;
}) => (
  <>
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-semibold text-primary">Home workspaces</h2>
      <p className="text-sm text-gray-600">
        Everyone with this role gets these as tabs next to Home. Widgets inside still follow this role’s permissions, so
        nobody sees data they can’t open.
      </p>
    </div>
    {isDefault && (
      <InlineAlert tone="info">
        Picked automatically from this role’s permissions. Change any of them to set them on purpose.
      </InlineAlert>
    )}
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
      {WORKSPACES.map((w) => {
        const on = value.includes(w.key);
        return (
          <button
            key={w.key}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={!canEdit || saving}
            onClick={() => onToggle(w.key)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left text-sm text-primary transition-colors",
              on ? "border-primary bg-inputBackground" : "border-lightGray bg-white",
              canEdit ? "cursor-pointer hover:bg-inputBackground disabled:cursor-wait" : "cursor-default"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 text-xs font-bold text-white",
                on ? "border-primary bg-primary" : "border-gray-500 bg-white"
              )}
            >
              {on ? "✓" : ""}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold">{w.title}</span>
              <span className="text-gray-600">{w.question}</span>
              <span className="text-xs text-gray-500">{w.description}</span>
            </span>
          </button>
        );
      })}
    </div>
    <p className="text-xs text-gray-500">
      {value.length
        ? `People with this role see Home, then ${workspaceNames(value)}. If someone has different roles in different branches, their tabs follow the branch they have selected.`
        : "No workspaces selected. People with this role see Home only."}
    </p>
  </>
);

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
  const back = useBackNavigation(ACCESS_BASE);
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "people" || tabParam === "ws" ? tabParam : "perm";
  const { canManage, canAdmin, getAccessLevel, accessPermissions } = useAccessControl();
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  /** Optimistic workspaces while a toggle saves. */
  const [wsPending, setWsPending] = useState<WorkspaceKey[] | null>(null);

  // A new role starts with a clean draft and filters.
  useEffect(() => {
    setDraft(null);
    setPq("");
    setOnlyWithAccess("all");
    setExpanded({});
    setWsPending(null);
  }, [roleId]);

  // "?add=1" (from the "Role created" toast) opens Add people once the role is loaded.
  useEffect(() => {
    if (!role || params.get("add") !== "1") return;
    if (canEdit) setModal("add");
    const next = new URLSearchParams(params);
    next.delete("add");
    setParams(next, { replace: true });
  }, [role, params, setParams, canEdit]);

  // You can only give what you have yourself: levels and actions above the
  // editor's own access are locked (the API refuses them too).
  const myRank = useCallback(
    (key: string): LevelRank => LEVEL_RANK[(getAccessLevel(key) as Level | undefined) ?? "No_Access"] ?? 0,
    [getAccessLevel]
  );
  const myActions = useMemo(() => {
    const stored = normalizePermissionPayload(accessPermissions as PermissionMap).Actions;
    return stored === undefined ? undefined : normalizeActionOverrides(stored);
  }, [accessPermissions]);
  const canGive = useCallback(
    (key: string) => (a: CatalogAction) => myRank(key) === 3 || actionAllowed(myRank(key), myActions, key, a),
    [myRank, myActions]
  );
  // Nobody changes their own access: a role you hold is read-only to you.
  const heldIn = useMemo(
    () => (role?.grants || []).filter((g) => String(g.user_id) === String(myId)).map((g) => g.branch_name),
    [role, myId]
  );
  // Roles are shared across branches; one used where you have no role is
  // someone else's to change.
  const allowedBranchIds = useBranchStore((s) => s.allowedBranchIds);
  const elsewhere = useMemo(
    () =>
      allowedBranchIds
        ? [...new Set((role?.grants || []).filter((g) => !allowedBranchIds.includes(g.branch_id)).map((g) => g.branch_name))]
        : [],
    [role, allowedBranchIds]
  );
  const locked = heldIn.length > 0 || elsewhere.length > 0;
  const editable = canEdit && !locked;

  const current = draft ?? base;
  const changed = useMemo(() => changedModules(base, current), [base, current]);
  const dirty = editable && changed.size > 0;

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
    if (!editable) return;
    setDraft((prev) => {
      const next = cloneDraft(prev ?? base);
      fn(next);
      return next;
    });
  };

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next !== "perm") p.set("tab", next);
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
          action={<UiButton onClick={back.goBack}>Back to {back.label}</UiButton>}
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
        const copy = await createRole(
          copyName(roles, role.name),
          role.description || "",
          clampToCeiling(base, myRank),
          reloadRoles,
          isDefaultWorkspaces(role) ? undefined : workspacesOf(role)
        );
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

  /* ------------------------------- workspaces ----------------------------- */
  const workspaces = wsPending ?? workspacesOf(role);

  const toggleWs = async (key: WorkspaceKey) => {
    if (!canEdit || wsPending) return;
    const added = !workspaces.includes(key);
    const next = toggleWorkspace(workspaces, key);
    setWsPending(next);
    try {
      await api.put.updateAccessLevelWorkspaces({ id: role.id, workspaces: next });
    } catch {
      // The API layer already raised a toast.
      setWsPending(null);
      return;
    }
    notify.success({
      title: added ? "Workspace added" : "Workspace removed",
      message: next.length
        ? `${role.name} now gets: ${workspaceNames(next)}.`
        : `${role.name} now sees Home only.`,
    });
    try {
      await reloadRoles();
    } finally {
      setWsPending(null);
    }
  };

  /* ------------------------------ permissions ----------------------------- */
  const hasCeiling = MODULES.some((m) => m.extra !== "retire" && myRank(m.key) < 3);
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
        create and edit · <strong className="font-semibold">Full</strong> also delete and change module settings. Each
        level comes with a set of actions; open a module to add or remove actions and choose whose records they see.
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
            {editable && (
              <select
                value=""
                aria-label={`Set every module in ${group}`}
                onChange={(e) => {
                  const value = e.target.value as Level | "";
                  if (!value) return;
                  update((d) => {
                    all
                      .filter((m) => m.extra !== "explicit" && m.extra !== "retire")
                      .forEach((m) => {
                        d.perms[m.key] = LEVELS[Math.min(LEVEL_RANK[value], myRank(m.key))].value;
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
              editable={editable}
              ceilingRank={myRank(m.key)}
              canGiveAction={canGive(m.key)}
              expanded={!!expanded[m.key]}
              onToggleExpanded={() => setExpanded((prev) => ({ ...prev, [m.key]: !prev[m.key] }))}
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
          onClick={() => guard(back.goBack)}
          className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
        >
          ← {back.label}
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
              { key: "ws", label: "Home workspaces" },
              { key: "people", label: `People (${nP})` },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-white px-[var(--app-page-padding-inline)] py-6">
        {!canEdit && (
          <InlineAlert tone="info">View only. You can see this role’s permissions but not change them.</InlineAlert>
        )}
        {canEdit && heldIn.length > 0 && tab !== "people" && (
          <InlineAlert tone="warning">
            You have this role in {[...new Set(heldIn)].join(" and ")}. Nobody can change their own access, so another
            admin has to edit it.
          </InlineAlert>
        )}
        {canEdit && !heldIn.length && elsewhere.length > 0 && tab !== "people" && (
          <InlineAlert tone="warning">
            This role is also used in {elsewhere.join(" and ")}, where you don’t have a role. An admin there has to
            change it.
          </InlineAlert>
        )}
        {editable && tab === "perm" && hasCeiling && (
          <InlineAlert tone="info">
            You can only give what you have yourself. Levels and actions above your own access are locked.
          </InlineAlert>
        )}
        {tab === "perm" ? (
          permissions
        ) : tab === "ws" ? (
          <WorkspaceCards
            value={workspaces}
            isDefault={!wsPending && isDefaultWorkspaces(role)}
            canEdit={canEdit}
            saving={!!wsPending}
            onToggle={(key) => void toggleWs(key)}
          />
        ) : (
          people
        )}
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
