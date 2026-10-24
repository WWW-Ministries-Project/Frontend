import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { AssignableUser } from "@/utils/api/settings/accessLevelAssignmentInterfaces";
import type { Branch } from "@/utils/api/settings/branchInterfaces";
import { cn } from "@/utils/cn";

import { CommDialog, FieldHint } from "../../ChurchCommunication/ui/commUi";
import {
  Field,
  Pill,
  SearchInput,
  SelectInput,
  TextInput,
} from "../../MembershipManagement/components/membershipUi";
import { Avatar } from "../Components/settingsUi";
import type { AccessRight } from "../utils/settingsInterfaces";
import {
  draftFromAccessRight,
  plural,
  presetDraft,
  STARTS,
  type StartKey,
} from "../utils/settingsModel";
import { createRole, isNameTaken, roleIn, updateRole } from "./useAccessRights";
import { toggleWorkspace, WORKSPACES, WORKSPACES_FROM_START, workspacesOf, type WorkspaceKey } from "./workspacesModel";

const ErrorLine = ({ text }: { text: string }) =>
  text ? (
    <p role="alert" className="text-sm text-red-700">
      {text}
    </p>
  ) : null;

/* -------------------------------------------------------------------------- */
/*                                  New role                                  */
/* -------------------------------------------------------------------------- */

export const NewRoleDialog = ({
  open,
  roles,
  onClose,
  reloadRoles,
  onCreated,
}: {
  open: boolean;
  roles: AccessRight[];
  onClose: () => void;
  reloadRoles: () => Promise<AccessRight[]>;
  onCreated: (role: AccessRight) => void;
}) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [from, setFrom] = useState<StartKey>("view");
  const [copy, setCopy] = useState("");
  /** Picked workspaces; null follows the chosen starting point. */
  const [ws, setWs] = useState<WorkspaceKey[] | null>(null);
  const [err, setErr] = useState<{ field?: "name"; text: string }>({ text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDesc("");
    setFrom("view");
    setCopy(roles[0] ? String(roles[0].id) : "");
    setWs(null);
    setErr({ text: "" });
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copySource = roles.find((r) => String(r.id) === copy);
  const workspaces: WorkspaceKey[] =
    ws ?? (from === "copy" ? (copySource ? workspacesOf(copySource) : []) : WORKSPACES_FROM_START[from]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setErr({ field: "name", text: "Give the role a name." });
    if (isNameTaken(roles, trimmed)) return setErr({ field: "name", text: "A role with this name already exists." });
    const source = roles.find((r) => String(r.id) === copy);
    if (from === "copy" && !source) return setErr({ text: "Choose the role to copy." });
    const draft = from === "copy" ? draftFromAccessRight(source) : presetDraft(from);
    const description = desc.trim() || (from === "copy" ? source?.description || "" : "");
    setBusy(true);
    try {
      const created = await createRole(trimmed, description, draft, reloadRoles, workspaces);
      if (created) onCreated(created);
      else onClose();
    } catch {
      // The API layer already raised a toast.
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="New role"
      subtitle="Pick a starting point. You can change every permission next."
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Create role", tone: "primary", onClick: submit },
      ]}
    >
      <Field label="Role name" error={err.field === "name" ? err.text : undefined}>
        <TextInput
          value={name}
          hasError={err.field === "name"}
          placeholder="e.g. Youth Ministry Lead"
          onChange={(e) => {
            setName(e.target.value);
            setErr({ text: "" });
          }}
        />
      </Field>
      <Field
        label={
          <>
            What it’s for <span className="text-gray-500">(optional)</span>
          </>
        }
      >
        <TextInput
          value={desc}
          placeholder="One line people will see on the role card"
          onChange={(e) => setDesc(e.target.value)}
        />
      </Field>
      <div role="radiogroup" aria-label="Start from" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Start from</p>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr))]">
          {STARTS.map((start) => {
            const on = from === start.key;
            return (
              <button
                key={start.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setFrom(start.key);
                  setWs(null);
                  setErr({ text: "" });
                }}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg border p-3 text-left text-primary transition-colors",
                  on ? "border-primary bg-inputBackground shadow-[0_0_0_1px_#080D2D]" : "border-lightGray bg-white hover:bg-inputBackground"
                )}
              >
                <span className="text-sm font-semibold">{start.label}</span>
                <span className="text-xs text-gray-600">{start.description}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">
          Home workspaces <span className="font-normal text-gray-500">(tabs next to Home)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {WORKSPACES.map((w) => {
            const on = workspaces.includes(w.key);
            return (
              <button
                key={w.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setWs(toggleWorkspace(workspaces, w.key))}
                className={cn(
                  "min-h-10 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-white" : "border-primary/30 bg-white text-primary hover:bg-inputBackground"
                )}
              >
                {on ? "✓ " : ""}
                {w.label}
              </button>
            );
          })}
        </div>
        <FieldHint>You can change this later on the role’s Home workspaces tab.</FieldHint>
      </div>
      {from === "copy" && (
        <Field label="Role to copy">
          <SelectInput
            value={copy}
            onChange={(e) => {
              setCopy(e.target.value);
              setWs(null);
            }}
            options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
          />
        </Field>
      )}
      {err.field !== "name" && <ErrorLine text={err.text} />}
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Edit details                                */
/* -------------------------------------------------------------------------- */

export const EditRoleDialog = ({
  open,
  role,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  role: AccessRight;
  roles: AccessRight[];
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role.name);
    setDesc(role.description || "");
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setErr("Give the role a name.");
    if (isNameTaken(roles, trimmed, role.id)) return setErr("A role with this name already exists.");
    setBusy(true);
    try {
      // Keeps the saved permissions; unsaved permission edits stay in the page draft.
      await updateRole(role, trimmed, desc.trim());
      await onSaved();
      notify.success({
        title: "Role updated",
        message: trimmed !== role.name ? `${role.name} is now called ${trimmed}.` : `${trimmed} details are saved.`,
      });
      onClose();
    } catch {
      // The API layer already raised a toast.
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="Edit role details"
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Save", tone: "primary", onClick: submit },
      ]}
    >
      <Field label="Role name" error={err || undefined}>
        <TextInput
          value={name}
          hasError={!!err}
          onChange={(e) => {
            setName(e.target.value);
            setErr("");
          }}
        />
      </Field>
      <Field label="What it’s for">
        <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Delete                                   */
/* -------------------------------------------------------------------------- */

export const DeleteRoleDialog = ({
  open,
  role,
  roles,
  peopleCount,
  onClose,
  onDeleted,
}: {
  open: boolean;
  role: AccessRight;
  roles: AccessRight[];
  /** Everyone who holds the role, in any branch. */
  peopleCount: number;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo("");
    setErr("");
  }, [open]);

  const others = roles.filter((r) => r.id !== role.id);

  const submit = async () => {
    if (peopleCount && !to) return setErr("Choose where their people should go.");
    setBusy(true);
    try {
      await api.delete.deleteAccess(peopleCount ? { id: role.id, reassign_to: Number(to) } : { id: role.id });
      const target = others.find((r) => String(r.id) === to);
      notify.success({
        title: "Role deleted",
        message: peopleCount
          ? `${plural(peopleCount, "person", "people")} moved to ${target?.name ?? "another role"}.`
          : `${role.name} has been removed.`,
      });
      onDeleted();
    } catch {
      // The API layer already raised a toast.
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Delete ${role.name}?`}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Delete role", tone: "danger", onClick: submit },
      ]}
    >
      <p className="text-sm text-gray-600">
        {peopleCount
          ? `${plural(peopleCount, "person has", "people have")} this role. Choose where they go so no one is left without access.`
          : "No one has this role. It will be removed for good."}
      </p>
      {peopleCount > 0 && (
        <Field label="Move their people to" error={err || undefined}>
          <SelectInput
            value={to}
            hasError={!!err}
            onChange={(e) => {
              setTo(e.target.value);
              setErr("");
            }}
            options={[{ value: "", label: "Choose a role…" }].concat(
              others.map((r) => ({ value: String(r.id), label: r.name }))
            )}
          />
        </Field>
      )}
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Add people                                 */
/* -------------------------------------------------------------------------- */

export const AddPeopleDialog = ({
  open,
  role,
  roles,
  users,
  branches,
  defaultBranchId,
  onClose,
  onChanged,
}: {
  open: boolean;
  role: AccessRight;
  roles: AccessRight[];
  users: AssignableUser[];
  branches: Branch[];
  /** Preselected branch; null leaves the picker empty. */
  defaultBranchId: number | null;
  onClose: () => void;
  /** Reloads roles and users after a change. */
  onChanged: () => Promise<unknown>;
}) => {
  const [branchId, setBranchId] = useState("");
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<Record<number, boolean>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBranchId(defaultBranchId ? String(defaultBranchId) : "");
    setQ("");
    setPicks({});
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const b = branchId ? Number(branchId) : null;
  const branchName = (id: number) => branches.find((x) => x.id === id)?.name ?? "this branch";
  const roleName = (id: number) => roles.find((r) => r.id === id)?.name ?? "Another role";

  const candidates = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!b || roleIn(u, b) !== role.id) &&
        (!query || `${u.name} ${u.email ?? ""}`.toLowerCase().includes(query))
    );
  }, [users, b, role.id, q]);

  const picked = Object.keys(picks)
    .filter((id) => picks[Number(id)])
    .map(Number);
  const moving = b ? picked.filter((id) => {
    const u = users.find((x) => x.id === id);
    return u && roleIn(u, b);
  }).length : 0;

  const submit = async () => {
    if (!picked.length) return setErr("Pick at least one person.");
    if (!b) return setErr("Choose the branch.");
    const previous = picked.map((id) => {
      const u = users.find((x) => x.id === id);
      return { id, roleId: u ? roleIn(u, b) : null };
    });
    setBusy(true);
    try {
      await api.put.bulkAssignAccessLevel({ access_level_id: role.id, assign_user_ids: picked, branch_id: b });
      await onChanged();
      onClose();
      notify.success({
        title: "People added",
        message: `${plural(picked.length, "person is", "people are")} now ${role.name} in ${branchName(b)}.`,
        undo: async () => {
          await Promise.all(
            previous.map((p) => api.put.setUserBranchAccess({ user_id: p.id, branch_id: b, access_level_id: p.roleId }))
          );
          await onChanged();
        },
      });
    } catch {
      // The API layer already raised a toast.
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Add people to ${role.name}`}
      subtitle="Each person has one role, so anyone you add moves from their current one."
      buttons={[
        { label: "Cancel", onClick: onClose },
        {
          label: picked.length ? `Add ${plural(picked.length, "person", "people")}` : "Add people",
          tone: "primary",
          onClick: submit,
        },
      ]}
    >
      <Field label="In branch">
        <SelectInput
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setErr("");
          }}
          options={[{ value: "", label: "Choose a branch…" }].concat(
            branches.map((x) => ({ value: String(x.id), label: x.name }))
          )}
        />
      </Field>
      <SearchInput value={q} onChange={setQ} placeholder="Search users" ariaLabel="Search users" className="flex-none" />
      <div className="overflow-hidden rounded-lg border border-lightGray">
        {candidates.map((u) => {
          const current = b ? roleIn(u, b) : null;
          const count = (u.branch_access || []).length;
          return (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-lightGray/20"
            >
              <input
                type="checkbox"
                checked={!!picks[u.id]}
                onChange={() => {
                  setPicks((prev) => ({ ...prev, [u.id]: !prev[u.id] }));
                  setErr("");
                }}
                className="h-4 w-4 flex-shrink-0 accent-primary"
              />
              <Avatar name={u.name} size={32} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{u.name}</span>
                <span className="truncate text-xs text-gray-500">{u.email}</span>
              </span>
              {!b ? (
                <Pill tone="neutral">{plural(count, "branch", "branches")}</Pill>
              ) : current ? (
                <Pill tone="neutral">{roleName(current)}</Pill>
              ) : (
                <Pill tone="warning">No access here</Pill>
              )}
            </label>
          );
        })}
        {!candidates.length && <p className="p-4 text-sm text-gray-500">No users match.</p>}
      </div>
      <ErrorLine text={err} />
      {moving > 0 && b && (
        <p className="text-xs text-amber-700">
          {moving} of them will move from their current role in {branchName(b)}.
        </p>
      )}
    </CommDialog>
  );
};
