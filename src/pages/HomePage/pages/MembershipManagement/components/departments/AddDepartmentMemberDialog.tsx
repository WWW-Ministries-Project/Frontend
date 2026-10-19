import { useEffect, useMemo, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";
import {
  assignMembersToDepartment,
  describeOutcome,
} from "@/utils/api/members/membershipActions";

import { useActiveMemberOptions } from "./useActiveMemberOptions";

export const AddDepartmentMemberDialog = ({
  open,
  departmentId,
  departmentName,
  positions,
  memberIdsInDepartment,
  onClose,
  onAdded,
}: {
  open: boolean;
  departmentId: number;
  departmentName: string;
  positions: { id: number; name: string }[];
  /** Members already in the department, hidden from the picker. */
  memberIdsInDepartment: Set<number>;
  onClose: () => void;
  onAdded: () => void;
}) => {
  const membersOptions = useActiveMemberOptions(open);
  const [memberId, setMemberId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [errors, setErrors] = useState<{ member?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMemberId("");
    setPositionId("");
    setErrors({});
  }, [open]);

  const memberOptions = useMemo(
    () => [
      { value: "", label: "Select member" },
      ...membersOptions
        .filter((option) => !memberIdsInDepartment.has(Number(option.value)))
        .map((option) => ({ value: option.value, label: option.label })),
    ],
    [memberIdsInDepartment, membersOptions]
  );

  const positionOptions = useMemo(
    () => [
      { value: "", label: "No specific position" },
      ...positions.map((position) => ({ value: String(position.id), label: position.name })),
    ],
    [positions]
  );

  const confirm = async () => {
    const nextErrors: typeof errors = {};
    if (!memberId) nextErrors.member = "Choose a member";
    if (nextErrors.member) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      const name =
        memberOptions.find((option) => option.value === memberId)?.label ?? "Member";
      const outcome = await assignMembersToDepartment(
        [memberId],
        departmentId,
        positionId ? Number(positionId) : null
      );
      const { message, type } = describeOutcome(
        outcome,
        () => `${name} added to ${departmentName}`
      );
      showNotification(message, type);
      if (outcome.succeeded > 0) onAdded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={`Add member to ${departmentName}`}
      subtitle="They will be marked as a ministry worker."
      ctaLabel="Add member"
      onConfirm={() => void confirm()}
      loading={saving}
    >
      <div className="flex flex-col gap-4">
        <Field label="Member *" error={errors.member}>
          <SelectInput
            value={memberId}
            onChange={(event) => {
              setMemberId(event.target.value);
              setErrors((prev) => ({ ...prev, member: undefined }));
            }}
            options={memberOptions}
            hasError={Boolean(errors.member)}
          />
        </Field>
        <Field label="Position">
          <SelectInput
            value={positionId}
            onChange={(event) => setPositionId(event.target.value)}
            options={positionOptions}
          />
        </Field>
      </div>
    </DialogShell>
  );
};
