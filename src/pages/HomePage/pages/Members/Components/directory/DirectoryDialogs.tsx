import { useEffect, useMemo, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  MEMBER_STAGES,
  MemberStage,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { notify } from "@/components/feedback";
import { showNotification } from "@/pages/HomePage/utils";
import {
  assignMembersToDepartment,
  BulkOutcome,
  deleteMembers,
  describeOutcome,
  setMembersStage,
} from "@/utils/api/members/membershipActions";
import type { PositionType } from "@/utils/api/settings/positionInterfaces";
import { cn } from "@/utils/cn";

import type { DirectoryMember } from "./directoryHelpers";

export type DirectoryDialog =
  | { kind: "status"; members: DirectoryMember[] }
  | { kind: "assign"; members: DirectoryMember[] }
  | { kind: "delete"; members: DirectoryMember[] }
  | null;

interface DirectoryDialogsProps {
  dialog: DirectoryDialog;
  onClose: () => void;
  /** Called after an action ran (fully or partly) so lists can refresh. */
  onDone: () => void;
}

const subjectOf = (members: DirectoryMember[]) =>
  members.length === 1 ? members[0].name : `${members.length} members`;

const countText = (count: number) => `${count} ${count === 1 ? "member" : "members"}`;

const useRunner = (onClose: () => void, onDone: () => void) => {
  const [busy, setBusy] = useState(false);
  const run = async (
    task: () => Promise<BulkOutcome>,
    successText: (count: number) => string,
    failureTitle: string
  ) => {
    setBusy(true);
    try {
      const outcome = await task();
      const { message, type } = describeOutcome(outcome, successText);
      showNotification(message, type);
      if (outcome.succeeded > 0) onDone();
      onClose();
    } catch (error) {
      // The dialog stays open so the choice is kept for another try.
      notify.fromError(error, { title: failureTitle });
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
};

const StatusDialog = ({
  members,
  onClose,
  onDone,
}: {
  members: DirectoryMember[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const initial: MemberStage =
    members.length === 1 && members[0].status ? members[0].status : "CONFIRMED";
  const [stage, setStage] = useState<MemberStage>(initial);
  const { busy, run } = useRunner(onClose, onDone);

  return (
    <DialogShell
      open
      onClose={onClose}
      title="Change status"
      subtitle={`Move ${subjectOf(members)} to a different membership stage.`}
      ctaLabel="Save status"
      loading={busy}
      onConfirm={() =>
        run(
          () => setMembersStage(members.map((member) => member.id), stage),
          (count) => `Status updated for ${countText(count)}`,
          `Couldn't change the status for ${subjectOf(members)}`
        )
      }
    >
      <div role="radiogroup" aria-label="Membership stage" className="flex flex-col gap-2">
        {MEMBER_STAGES.map((option) => {
          const on = option.value === stage;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                on ? "border-primary bg-primary/[0.04]" : "border-lightGray hover:bg-[#F8F9FC]"
              )}
            >
              <input
                type="radio"
                name="member-stage"
                value={option.value}
                checked={on}
                onChange={() => setStage(option.value)}
                className="mt-0.5 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-primary">{option.label}</span>
                <span className="text-xs text-[#4B5563]">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </DialogShell>
  );
};

const AssignDialog = ({
  members,
  onClose,
  onDone,
}: {
  members: DirectoryMember[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const departments = useSettingsStore((state) => state.departments);
  const positions = useSettingsStore((state) => state.positions) as PositionType[];
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [touched, setTouched] = useState(false);
  const { busy, run } = useRunner(onClose, onDone);

  const positionOptions = useMemo(() => {
    if (!departmentId) return [];
    const id = Number(departmentId);
    const fromStore = positions.filter((position) => position.department?.id === id);
    const source = fromStore.length
      ? fromStore
      : departments.find((department) => department.id === id)?.position ?? [];
    return source.map((position) => ({
      value: String(position.id),
      label: position.name,
    }));
  }, [departmentId, departments, positions]);

  useEffect(() => {
    setPositionId("");
  }, [departmentId]);

  const departmentError = touched && !departmentId ? "Choose a department" : undefined;

  return (
    <DialogShell
      open
      onClose={onClose}
      title="Assign department"
      subtitle={`Add ${subjectOf(members)} to a department. They will be marked as a ministry worker.`}
      ctaLabel="Assign"
      loading={busy}
      onConfirm={() => {
        setTouched(true);
        if (!departmentId) return;
        run(
          () =>
            assignMembersToDepartment(
              members.map((member) => member.id),
              Number(departmentId),
              positionId ? Number(positionId) : null
            ),
          (count) => `${countText(count)} assigned`,
          `Couldn't assign ${subjectOf(members)} to the department`
        );
      }}
    >
      <div className="flex flex-col gap-4">
        <Field label="Department" error={departmentError}>
          <SelectInput
            value={departmentId}
            hasError={Boolean(departmentError)}
            onChange={(event) => setDepartmentId(event.target.value)}
            options={[
              { value: "", label: "Select a department" },
              ...departments.map((department) => ({
                value: String(department.id),
                label: department.name,
              })),
            ]}
          />
        </Field>
        <Field label="Position">
          <SelectInput
            value={positionId}
            disabled={!departmentId}
            onChange={(event) => setPositionId(event.target.value)}
            options={[{ value: "", label: "No specific position" }, ...positionOptions]}
          />
        </Field>
      </div>
    </DialogShell>
  );
};

const DeleteDialog = ({
  members,
  onClose,
  onDone,
}: {
  members: DirectoryMember[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const { busy, run } = useRunner(onClose, onDone);
  return (
    <DialogShell
      open
      onClose={onClose}
      title={`Delete ${subjectOf(members)}?`}
      subtitle="This removes the member record and family links. This can’t be undone."
      ctaLabel="Delete"
      ctaTone="danger"
      loading={busy}
      onConfirm={() =>
        run(
          () => deleteMembers(members.map((member) => member.id)),
          (count) => `${countText(count)} deleted`,
          `Couldn't delete ${subjectOf(members)}`
        )
      }
    />
  );
};

export const DirectoryDialogs = ({ dialog, onClose, onDone }: DirectoryDialogsProps) => {
  if (!dialog || dialog.members.length === 0) return null;
  const props = { members: dialog.members, onClose, onDone };
  if (dialog.kind === "status") return <StatusDialog {...props} />;
  if (dialog.kind === "assign") return <AssignDialog {...props} />;
  return <DeleteDialog {...props} />;
};
