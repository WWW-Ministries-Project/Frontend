import { useEffect, useMemo, useState } from "react";

import {
  DialogShell,
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { JoinRequestRow } from "@/utils";

import { apiErrorMessage, todayIso } from "./departmentShared";

export const ApproveJoinRequestDialog = ({
  request,
  positions,
  onClose,
  onDone,
}: {
  request: JoinRequestRow | null;
  positions: { id: number; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const [positionId, setPositionId] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setPositionId(positions[0] ? String(positions[0].id) : "");
    setStartDate(todayIso());
    setInstructions("");
  }, [request, positions]);

  const options = useMemo(
    () => [
      { value: "", label: "No specific position" },
      ...positions.map((position) => ({ value: String(position.id), label: position.name })),
    ],
    [positions]
  );

  const confirm = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.put.approveJoinRequest({
        id: request.id,
        position_id: positionId ? Number(positionId) : undefined,
        start_date: startDate || undefined,
        instructions: instructions.trim() || undefined,
      });
      showNotification("Request approved", "success");
      onDone();
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to approve request."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={Boolean(request)}
      onClose={onClose}
      title={`Approve ${request?.member_name ?? "request"}`}
      subtitle={`Add them to ${request?.department_name ?? "the department"}. They will be notified with the details below.`}
      ctaLabel="Approve"
      onConfirm={() => void confirm()}
      loading={saving}
    >
      <div className="flex flex-col gap-4">
        <Field label="Position">
          <SelectInput
            value={positionId}
            onChange={(event) => setPositionId(event.target.value)}
            options={options}
          />
        </Field>
        <Field label="Start date">
          <TextInput
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Field>
        <Field label="Instructions for the member">
          <TextArea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="e.g. Rehearsals are on Thursdays at 6pm."
          />
        </Field>
      </div>
    </DialogShell>
  );
};

export const DeclineJoinRequestDialog = ({
  request,
  onClose,
  onDone,
}: {
  request: JoinRequestRow | null;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setReason("");
    setError("");
  }, [request]);

  const confirm = async () => {
    if (!request) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Add a short reason");
      return;
    }
    setSaving(true);
    try {
      await api.put.declineJoinRequest({ id: request.id, decline_reason: trimmed });
      showNotification("Request declined", "success");
      onDone();
    } catch (err) {
      showNotification(apiErrorMessage(err, "Unable to decline request."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={Boolean(request)}
      onClose={onClose}
      title="Decline request"
      subtitle="The reason is shared with the member."
      ctaLabel="Decline"
      ctaTone="danger"
      onConfirm={() => void confirm()}
      loading={saving}
    >
      <Field label="Reason *" error={error}>
        <TextArea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError("");
          }}
          placeholder="e.g. The department is full this season."
          hasError={Boolean(error)}
        />
      </Field>
    </DialogShell>
  );
};
