import { useState } from "react";
import { Modal } from "@/components/Modal";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { usePost } from "@/CustomHooks/usePost";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import type { PledgeDetail } from "@/utils/api/pledges/interface";
import { emptyPledger, type PledgerFormValue } from "../utils/pledgeHelpers";

interface AddPledgersModalProps {
  open: boolean;
  onClose: () => void;
  groups: PledgeDetail["groups"];
  onSuccess: () => void;
}

const AddPledgersModal = ({ open, onClose, groups, onSuccess }: AddPledgersModalProps) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const { postData, loading } = usePost(api.post.addPledgers);
  const [groupId, setGroupId] = useState<number | "">("");
  const [pledgers, setPledgers] = useState<PledgerFormValue[]>([emptyPledger()]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  const update = (i: number, patch: Partial<PledgerFormValue>) =>
    setPledgers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const handleSubmit = async () => {
    if (groupId === "") {
      showNotification("Select a group", "error");
      return;
    }
    const payload = pledgers
      .filter((p) => (p.isGuest ? p.guest_name : p.user_id !== ""))
      .map((p) => ({
        user_id: p.isGuest ? null : p.user_id === "" ? null : Number(p.user_id),
        guest_name: p.isGuest ? p.guest_name : null,
        guest_phone: p.isGuest ? p.guest_phone : null,
        pledged_amount:
          p.pledged_amount === "" ? Number(selectedGroup?.called_amount ?? 0) : Number(p.pledged_amount),
      }));
    if (payload.length === 0) {
      showNotification("Add at least one pledger", "error");
      return;
    }
    try {
      await postData({ group_id: Number(groupId), pledgers: payload });
      showNotification("Pledgers added", "success");
      setPledgers([emptyPledger()]);
      setGroupId("");
      onSuccess();
      onClose();
    } catch {
      showNotification("Could not add pledgers", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[95%] max-w-lg p-6 bg-white rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Add members to a group</h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-sm">Group</label>
          <SelectField
            id="group_id"
            placeholder="Select group"
            options={groups.map((g) => ({
              value: g.id ?? 0,
              label: `${g.label || "Amount"} — ${g.called_amount}`,
            }))}
            value={groupId}
            onChange={(_n, value) => {
              const gid = value === "" || value == null ? "" : Number(value);
              setGroupId(gid);
              const called = groups.find((g) => g.id === gid)?.called_amount ?? "";
              setPledgers((prev) => prev.map((p) => ({ ...p, pledged_amount: p.pledged_amount || called })));
            }}
          />
        </div>

        {pledgers.map((p, i) => (
          <div key={i} className="border rounded-md p-3 flex flex-col gap-2">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={!p.isGuest} onChange={() => update(i, { isGuest: false })} />
                Member
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={p.isGuest} onChange={() => update(i, { isGuest: true })} />
                Guest
              </label>
            </div>
            {p.isGuest ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border rounded-md p-2 text-sm"
                  placeholder="Guest name"
                  value={p.guest_name}
                  onChange={(e) => update(i, { guest_name: e.target.value })}
                />
                <input
                  className="border rounded-md p-2 text-sm"
                  placeholder="Guest phone"
                  value={p.guest_phone}
                  onChange={(e) => update(i, { guest_phone: e.target.value })}
                />
              </div>
            ) : (
              <SelectField
                id={`add_pledger_${i}`}
                placeholder="Select member"
                searchable
                options={membersOptions}
                value={p.user_id}
                onChange={(_n, value) =>
                  update(i, { user_id: value === "" || value == null ? "" : Number(value) })
                }
              />
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="border rounded-md p-2 text-sm w-40"
                placeholder="Pledged amount"
                value={p.pledged_amount}
                onChange={(e) =>
                  update(i, { pledged_amount: e.target.value === "" ? "" : Number(e.target.value) })
                }
              />
              {pledgers.length > 1 && (
                <button
                  type="button"
                  className="text-sm text-red-500"
                  onClick={() => setPledgers((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="text-sm text-primary self-start"
          onClick={() =>
            setPledgers((prev) => [...prev, emptyPledger(selectedGroup?.called_amount ?? "")])
          }
        >
          + Add another
        </button>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button type="button" className="px-4 py-2 border rounded-md text-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
          onClick={handleSubmit}
        >
          {loading ? "Saving…" : "Add pledgers"}
        </button>
      </div>
    </Modal>
  );
};

export default AddPledgersModal;
