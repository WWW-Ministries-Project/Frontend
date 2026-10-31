import { useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { CommDialog } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import {
  Field,
  SelectInput,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils/api/apiCalls";
import type { Branch, BranchPayload } from "@/utils/api/settings/branchInterfaces";

export interface PersonOption {
  id: number;
  name: string;
}

/** New branch (no `branch`) or edit an existing one. */
export const BranchDialog = ({
  open,
  branch,
  people,
  onClose,
  onSaved,
}: {
  open: boolean;
  branch: Branch | null;
  people: PersonOption[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pastor, setPastor] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(branch?.name ?? "");
    setLocation(branch?.location ?? "");
    setPastor(branch?.pastor_in_charge_id ? String(branch.pastor_in_charge_id) : "");
    setDescription(branch?.description ?? "");
    setError("");
  }, [open, branch]);

  // Keep the current pastor selectable even if they're outside the member list.
  const pastorOptions = [
    { value: "", label: "Choose later" },
    ...(branch?.pastor_in_charge && !people.some((p) => p.id === branch.pastor_in_charge?.id)
      ? [{ value: String(branch.pastor_in_charge.id), label: branch.pastor_in_charge.name }]
      : []),
    ...people.map((person) => ({ value: String(person.id), label: person.name })),
  ];

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a branch name.");
      return;
    }
    const payload: BranchPayload = {
      ...(branch ? { id: branch.id } : {}),
      name: trimmed,
      location: location.trim() || null,
      description: description.trim() || null,
      pastor_in_charge_id: pastor ? Number(pastor) : null,
    };
    setBusy(true);
    try {
      if (branch) await api.put.updateBranch(payload);
      else await api.post.createBranch(payload);
      notify.success(
        branch
          ? { title: "Branch updated", message: `${trimmed} has been saved.` }
          : { title: "Branch created", message: `${trimmed} is ready for members.` }
      );
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
      title={branch ? "Edit branch" : "New branch"}
      busy={busy}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: branch ? "Save branch" : "Create branch", tone: "primary", onClick: () => void submit() },
      ]}
    >
      <Field label="Branch name" error={error || undefined}>
        <TextInput
          value={name}
          hasError={!!error}
          placeholder="e.g. Tema"
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
      </Field>
      <Field label="Location">
        <TextInput value={location} placeholder="Area, city" onChange={(event) => setLocation(event.target.value)} />
      </Field>
      <Field label="Pastor in charge">
        <SelectInput value={pastor} options={pastorOptions} onChange={(event) => setPastor(event.target.value)} />
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
