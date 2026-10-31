import { useEffect, useMemo, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";
import { LockedBranchField } from "@/components/BranchSelectField";
import { useBranchFieldState } from "@/CustomHooks/useBranchFieldState";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils";

import { useDepartmentAccess } from "./useDepartmentAccess";
import type {
  DepartmentMutationPayload,
  DepartmentStatus,
  UpdateDepartmentPayload,
} from "@/utils";

import { apiErrorMessage, type DepartmentRecord } from "./departmentShared";
import { useActiveMemberOptions } from "./useActiveMemberOptions";

interface FormState {
  name: string;
  head: string;
  description: string;
  branchId: string;
  status: DepartmentStatus;
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open: members can request to join" },
  { value: "CLOSED", label: "Closed: marked inactive but still visible" },
];

const toFormState = (department?: DepartmentRecord | null): FormState => ({
  name: department?.name ?? "",
  head: String(department?.department_head_info?.id ?? department?.department_head ?? ""),
  description: department?.description ?? "",
  branchId: department?.branch_id ? String(department.branch_id) : "",
  status: department?.status ?? "OPEN",
});

export const DepartmentFormDialog = ({
  open,
  department,
  existingNames,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** The department being edited; `null` creates a new one. */
  department: DepartmentRecord | null;
  /** Names already in use, for the client-side uniqueness check. */
  existingNames: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = Boolean(department);
  const { canAssignHead } = useDepartmentAccess();
  const membersOptions = useActiveMemberOptions(open);
  const userId = useUserStore((state) => state.id);
  const { options: branches, lockedBranch, lockedReason } = useBranchFieldState();
  const showBranch = !lockedBranch;

  const [form, setForm] = useState<FormState>(() => toFormState(department));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toFormState(department));
      setErrors({});
    }
  }, [open, department]);

  const headOptions = useMemo(() => {
    const options = [
      { value: "", label: "Not assigned yet" },
      ...membersOptions,
    ];
    // Keep the current head selectable even when they are outside the
    // options list (e.g. a different branch).
    const head = department?.department_head_info;
    if (head && !options.some((option) => option.value === String(head.id))) {
      options.push({ value: String(head.id), label: head.name });
    }
    return options;
  }, [department, membersOptions]);

  const branchOptions = useMemo(
    () => [
      { value: "", label: "Select branch" },
      ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
    ],
    [branches]
  );

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async () => {
    const name = form.name.trim();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!name) nextErrors.name = "Name is required";
    else if (
      existingNames.some(
        (item) =>
          item.name.trim().toLowerCase() === name.toLowerCase() &&
          item.id !== department?.id
      )
    ) {
      nextErrors.name = "A department with this name already exists";
    }
    if (showBranch && !form.branchId) nextErrors.branchId = "Branch is required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const branchId: number | "" = lockedBranch
      ? lockedBranch.id
      : form.branchId
        ? Number(form.branchId)
        : "";

    const payload: DepartmentMutationPayload = {
      name,
      description: form.description.trim(),
      department_head: form.head ? Number(form.head) : undefined,
      branch_id: branchId,
      status: form.status,
      // The store keeps the user id as a string, but the API column is an Int.
      created_by: Number(userId),
    };

    setSaving(true);
    try {
      if (department) {
        const update = {
          ...payload,
          id: department.id,
          // `null` clears the head on the server; `undefined` would keep it.
          department_head: form.head ? Number(form.head) : null,
        } as unknown as UpdateDepartmentPayload;
        await api.put.updateDepartment(update);
        showNotification(`${name} updated`, "success");
      } else {
        await api.post.createDepartment(payload);
        showNotification(`${name} created`, "success");
      }
      onSaved();
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to save department."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit department / ministry" : "Create department / ministry"}
      subtitle="Set the name, assign a head and add a short description for members."
      ctaLabel={isEdit ? "Save changes" : "Create department"}
      onConfirm={() => void submit()}
      loading={saving}
    >
      <div className="flex flex-col gap-4">
        <Field label="Department / ministry name *" error={errors.name}>
          <TextInput
            value={form.name}
            onChange={(event) => set("name")(event.target.value)}
            placeholder="e.g. Ushering Ministry"
            hasError={Boolean(errors.name)}
          />
        </Field>
        <Field label="Department head">
          <SelectInput
            value={form.head}
            onChange={(event) => set("head")(event.target.value)}
            options={headOptions}
            disabled={!canAssignHead}
            title={canAssignHead ? undefined : "Assigning a head needs Full access to Departments"}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(event) => set("description")(event.target.value)}
            placeholder="Describe the department’s purpose or responsibilities."
          />
        </Field>
        {lockedBranch && lockedReason ? (
          <LockedBranchField
            id="department-branch"
            branch={lockedBranch}
            reason={lockedReason}
          />
        ) : (
          <Field label="Branch *" error={errors.branchId}>
            <SelectInput
              value={form.branchId}
              onChange={(event) => set("branchId")(event.target.value)}
              options={branchOptions}
              hasError={Boolean(errors.branchId)}
            />
          </Field>
        )}
        <Field label="Status">
          <SelectInput
            value={form.status}
            onChange={(event) => set("status")(event.target.value as DepartmentStatus)}
            options={STATUS_OPTIONS}
          />
        </Field>
      </div>
    </DialogShell>
  );
};
