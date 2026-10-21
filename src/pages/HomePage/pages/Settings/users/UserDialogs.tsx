import { useEffect, useMemo, useState } from "react";

import { describeError, notify } from "@/components/feedback";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";

import { CommDialog, FieldHint } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput } from "../../MembershipManagement/components/membershipUi";
import type { UsersData } from "./useUsersData";
import { usePickableBranches } from "../utils/usePickableBranches";

/* -------------------------------------------------------------------------- */
/*                                 Give access                                */
/* -------------------------------------------------------------------------- */

interface GiveForm {
  pid: string;
  b: string;
  rid: string;
  invite: boolean;
}

export const GiveAccessDialog = ({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: UsersData;
}) => {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const branches = usePickableBranches();
  const { users, roles, members, loadMembers, refetch, branchName, roleName } = data;
  const [form, setForm] = useState<GiveForm>({ pid: "", b: "", rid: "", invite: true });
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ pid: "", b: activeBranchId === ALL_BRANCHES ? "" : String(activeBranchId), rid: "", invite: true });
    setErrors([]);
    void loadMembers(true);
  }, [open, activeBranchId, loadMembers]);

  const memberOpts = useMemo(() => {
    const taken = new Set(users.map((user) => user.id));
    return (members ?? [])
      .filter((member) => !taken.has(member.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((member) => ({
        value: String(member.id),
        label: member.member_id ? `${member.name} · ${member.member_id}` : member.name,
      }));
  }, [members, users]);

  const set = (patch: Partial<GiveForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors([]);
  };

  const submit = async () => {
    const missing: string[] = [];
    if (!form.pid) missing.push("Choose a member.");
    if (!form.b) missing.push("Choose a branch.");
    if (!form.rid) missing.push("Choose a role.");
    if (missing.length) {
      setErrors(missing);
      return;
    }
    const userId = Number(form.pid);
    const branchId = Number(form.b);
    const roleId = Number(form.rid);
    const name = members?.find((member) => member.id === userId)?.name ?? "They";
    setBusy(true);
    try {
      const res = await api.post.giveAccess({
        user_id: userId,
        branch_id: branchId,
        access_level_id: roleId,
        send_invite: form.invite,
      });
      const invited = res.data?.invited ?? form.invite;
      notify.success({
        title: "Access given",
        message: `${name} is now ${roleName(roleId)} in ${branchName(branchId)}.${
          invited ? " We emailed them a sign-in link." : ""
        }`,
      });
      void refetch();
      onClose();
    } catch (error) {
      setErrors([describeError(error, { preferServerMessage: true }).message]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      title="Give access"
      subtitle="Let a member sign in to the admin app with a role."
      busy={busy}
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Give access", onClick: () => void submit(), tone: "primary" },
      ]}
    >
      <Field label="Member">
        <SelectInput
          value={form.pid}
          onChange={(event) => set({ pid: event.target.value })}
          hasError={errors.includes("Choose a member.")}
          options={[
            { value: "", label: members ? "Choose a member…" : "Loading members…" },
            ...memberOpts,
          ]}
        />
        <FieldHint>Only members without an account are listed.</FieldHint>
      </Field>
      <Field label="Branch">
        <SelectInput
          value={form.b}
          onChange={(event) => set({ b: event.target.value })}
          hasError={errors.includes("Choose a branch.")}
          options={[
            { value: "", label: "Choose a branch…" },
            ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
          ]}
        />
        <FieldHint>You can add more branches from their user details later.</FieldHint>
      </Field>
      <Field label="Role">
        <SelectInput
          value={form.rid}
          onChange={(event) => set({ rid: event.target.value })}
          hasError={errors.includes("Choose a role.")}
          options={[
            { value: "", label: "Choose a role…" },
            ...roles.map((role) => ({ value: String(role.id), label: role.name })),
          ]}
        />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
        <input
          type="checkbox"
          checked={form.invite}
          onChange={() => set({ invite: !form.invite })}
          className="h-4 w-4 accent-primary"
        />
        Email them a link to set their password
      </label>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                       Bulk role: choose the branch                         */
/* -------------------------------------------------------------------------- */

export const BulkBranchDialog = ({
  open,
  onClose,
  ids,
  roleId,
  data,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  ids: number[];
  roleId: number | null;
  data: UsersData;
  onDone: () => void;
}) => {
  const branches = usePickableBranches();
  const { assign, roleName, branchName } = data;
  const [branch, setBranch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setBranch("");
      setError("");
    }
  }, [open]);

  const count = ids.length;
  const submit = async () => {
    if (!branch) {
      setError("Choose the branch.");
      return;
    }
    if (!roleId) return;
    const branchId = Number(branch);
    setBusy(true);
    try {
      await assign(
        ids,
        branchId,
        roleId,
        `${count} ${count === 1 ? "user is" : "users are"} now ${roleName(roleId)} in ${branchName(branchId)}.`,
        true
      );
      onDone();
    } catch (err) {
      setError(describeError(err, { preferServerMessage: true }).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      title="Choose the branch"
      subtitle="Roles are given per branch. Their access in other branches stays as it is."
      busy={busy}
      errors={error ? [error] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Give role", onClick: () => void submit(), tone: "primary" },
      ]}
    >
      <Field label={`Give ${count} ${count === 1 ? "user" : "users"} the ${roleName(roleId)} role in:`}>
        <SelectInput
          value={branch}
          onChange={(event) => {
            setBranch(event.target.value);
            setError("");
          }}
          hasError={!!error && !branch}
          options={[
            { value: "", label: "Choose a branch…" },
            ...branches.map((b) => ({ value: String(b.id), label: b.name })),
          ]}
        />
      </Field>
    </CommDialog>
  );
};
