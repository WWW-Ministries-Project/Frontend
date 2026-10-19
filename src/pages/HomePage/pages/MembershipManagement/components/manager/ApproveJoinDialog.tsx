import { useEffect, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
  SelectOption,
  TextArea,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

import { todayInputValue } from "./managerHelpers";

export interface ApproveJoinValues {
  positionId: string;
  startDate: string;
  instructions: string;
}

export const ApproveJoinDialog = ({
  open,
  title,
  subtitle,
  positionOptions,
  positionNote,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  /** Positions of the requested department; null hides the field. */
  positionOptions: SelectOption[] | null;
  /** Shown instead of the position field when it is hidden. */
  positionNote?: string;
  onClose: () => void;
  onSubmit: (values: ApproveJoinValues) => Promise<boolean>;
}) => {
  const [values, setValues] = useState<ApproveJoinValues>({
    positionId: "",
    startDate: todayInputValue(),
    instructions: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ positionId: "", startDate: todayInputValue(), instructions: "" });
  }, [open]);

  const set = (key: keyof ApproveJoinValues) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const submit = async () => {
    setSaving(true);
    try {
      const done = await onSubmit({ ...values, instructions: values.instructions.trim() });
      if (done) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      ctaLabel="Approve"
      onConfirm={submit}
      loading={saving}
    >
      <div className="flex flex-col gap-4">
        {positionOptions ? (
          <Field label="Position">
            <SelectInput
              value={values.positionId}
              options={
                positionOptions.length > 0
                  ? [{ value: "", label: "No position yet" }, ...positionOptions]
                  : [{ value: "", label: "No positions set up for this department" }]
              }
              disabled={positionOptions.length === 0}
              onChange={(event) => set("positionId")(event.target.value)}
            />
          </Field>
        ) : positionNote ? (
          <p className="text-sm text-[#4B5563]">{positionNote}</p>
        ) : null}
        <Field label="Start date">
          <TextInput
            type="date"
            value={values.startDate}
            onChange={(event) => set("startDate")(event.target.value)}
          />
        </Field>
        <Field label="Instructions for the member">
          <TextArea
            value={values.instructions}
            placeholder="e.g. Rehearsals are on Thursdays at 6pm."
            onChange={(event) => set("instructions")(event.target.value)}
          />
        </Field>
      </div>
    </DialogShell>
  );
};
