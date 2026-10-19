import { useEffect, useState } from "react";

import {
  DialogShell,
  Field,
  TextArea,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/** Shared decline dialog for guest membership and department join requests. */
export const DeclineReasonDialog = ({
  open,
  count,
  audience,
  onClose,
  onSubmit,
}: {
  open: boolean;
  count: number;
  audience: "guest" | "member";
  onClose: () => void;
  /** Resolves once the request(s) are declined; the dialog then closes. */
  onSubmit: (reason: string) => Promise<boolean>;
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError("");
  }, [open]);

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Add a short reason");
      return;
    }
    setSaving(true);
    try {
      const done = await onSubmit(trimmed);
      if (done) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={count === 1 ? "Decline request" : `Decline ${count} requests`}
      subtitle={`The reason is shared with the ${audience}.`}
      ctaLabel="Decline"
      ctaTone="danger"
      onConfirm={submit}
      loading={saving}
    >
      <Field label="Reason *" error={error}>
        <TextArea
          value={reason}
          hasError={Boolean(error)}
          placeholder={
            audience === "guest"
              ? "e.g. Please attend the membership class first."
              : "e.g. The department is full this season."
          }
          onChange={(event) => {
            setReason(event.target.value);
            if (error) setError("");
          }}
        />
      </Field>
    </DialogShell>
  );
};
