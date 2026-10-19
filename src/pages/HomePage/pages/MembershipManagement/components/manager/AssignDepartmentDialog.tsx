import { useEffect, useMemo, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { showNotification } from "@/pages/HomePage/utils";
import {
  assignMembersToDepartment,
  describeOutcome,
} from "@/utils/api/members/membershipActions";
import type { PositionType } from "@/utils/api/settings/positionInterfaces";

import { errorText } from "./managerHelpers";

export const AssignDepartmentDialog = ({
  memberIds,
  who,
  onClose,
  onDone,
}: {
  /** Members to assign; the dialog is open while this is non-empty. */
  memberIds: number[];
  /** "Ama Mensah" or "3 members", used in the copy. */
  who: string;
  onClose: () => void;
  onDone: () => void;
}) => {
  const departments = useSettingsStore((state) => state.departments);
  const positions = useSettingsStore((state) => state.positions) as PositionType[];
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [errors, setErrors] = useState<{ department?: string }>({});
  const [saving, setSaving] = useState(false);
  const open = memberIds.length > 0;

  useEffect(() => {
    if (!open) return;
    setDepartmentId("");
    setPositionId("");
    setErrors({});
  }, [open]);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "Select department" },
      ...departments
        .map((department) => ({ value: String(department.id), label: department.name }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    ],
    [departments]
  );

  const positionOptions = useMemo(() => {
    if (!departmentId) return [{ value: "", label: "Select a department first" }];
    const id = Number(departmentId);
    const fromDepartment = departments.find((department) => department.id === id)?.position;
    const list =
      fromDepartment && fromDepartment.length > 0
        ? fromDepartment
        : positions.filter((position) => position.department?.id === id);
    return [
      { value: "", label: "No specific position" },
      ...list.map((position) => ({ value: String(position.id), label: position.name })),
    ];
  }, [departmentId, departments, positions]);

  const departmentName =
    departments.find((department) => String(department.id) === departmentId)?.name ?? "";

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!departmentId) nextErrors.department = "Choose a department";
    setErrors(nextErrors);
    if (nextErrors.department) return;

    setSaving(true);
    try {
      const outcome = await assignMembersToDepartment(
        memberIds,
        Number(departmentId),
        positionId ? Number(positionId) : null
      );
      const result = describeOutcome(outcome, (count) =>
        count === 1 && memberIds.length === 1
          ? `${who} assigned to ${departmentName}`
          : `${count} ${count === 1 ? "member" : "members"} assigned to ${departmentName}`
      );
      showNotification(result.message, result.type);
      if (outcome.succeeded > 0) onDone();
      onClose();
    } catch (error) {
      showNotification(errorText(error, "Unable to assign the department."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Assign department"
      subtitle={`Add ${who} to a department. They will be marked as a ministry worker.`}
      ctaLabel="Assign"
      onConfirm={submit}
      loading={saving}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Department" error={errors.department}>
          <SelectInput
            value={departmentId}
            hasError={Boolean(errors.department)}
            options={departmentOptions}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setPositionId("");
              setErrors({});
            }}
          />
        </Field>
        <Field label="Position">
          <SelectInput
            value={positionId}
            options={positionOptions}
            disabled={!departmentId}
            onChange={(event) => setPositionId(event.target.value)}
          />
        </Field>
      </div>
    </DialogShell>
  );
};
