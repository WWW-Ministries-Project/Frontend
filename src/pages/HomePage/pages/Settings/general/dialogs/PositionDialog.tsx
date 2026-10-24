import { useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { CommDialog } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import {
  Field,
  SelectInput,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import type { Branch } from "@/utils/api/settings/branchInterfaces";
import type { PositionType } from "@/utils/api/settings/positionInterfaces";

/** New position (no `position`) or edit one. */
export const PositionDialog = ({
  open,
  position,
  branches,
  defaultBranchId,
  onClose,
  onSaved,
}: {
  open: boolean;
  position: PositionType | null;
  branches: Branch[];
  /** Pre-selected branch for a new position. */
  defaultBranchId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const userId = useUserStore((state) => state.id);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; branch?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(position?.name ?? "");
    const branch = position ? position.branch_id : defaultBranchId;
    setBranchId(branch ? String(branch) : "");
    setDescription(position?.description ?? "");
    setErrors({});
  }, [open, position, defaultBranchId]);

  const submit = async () => {
    const trimmed = name.trim();
    const next = {
      name: trimmed ? undefined : "Enter a position name.",
      branch: branchId ? undefined : "Choose the branch this position belongs to.",
    };
    if (next.name || next.branch) {
      setErrors(next);
      return;
    }
    const createdBy = Number(userId);
    const payload = {
      ...(position ? { id: position.id } : {}),
      name: trimmed,
      description: description.trim(),
      branch_id: Number(branchId),
      department_id: position?.department?.id ?? null,
      created_by: Number.isFinite(createdBy) && createdBy > 0 ? createdBy : userId,
    };
    setBusy(true);
    try {
      if (position) await api.put.updatePosition(payload);
      else await api.post.createPosition(payload);
      notify.success({ title: position ? "Position updated" : "Position created", message: trimmed });
      onSaved();
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
      title={position ? "Edit position" : "New position"}
      busy={busy}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: position ? "Save position" : "Create position", tone: "primary", onClick: () => void submit() },
      ]}
    >
      <Field label="Position name" error={errors.name}>
        <TextInput
          value={name}
          hasError={!!errors.name}
          placeholder="e.g. Choir Director"
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
        />
      </Field>
      <Field label="Branch" error={errors.branch}>
        <SelectInput
          value={branchId}
          hasError={!!errors.branch}
          options={[
            ...(branchId ? [] : [{ value: "", label: "Choose a branch…" }]),
            ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
          ]}
          onChange={(event) => {
            setBranchId(event.target.value);
            setErrors((current) => ({ ...current, branch: undefined }));
          }}
        />
      </Field>
      <Field
        label={
          <>
            Description <span className="text-gray-500">(optional)</span>
          </>
        }
      >
        <TextInput value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>
    </CommDialog>
  );
};
