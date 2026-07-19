import { useState } from "react";
import { Modal } from "@/components/Modal";
import { usePost } from "@/CustomHooks/usePost";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";

interface RedemptionModalProps {
  open: boolean;
  onClose: () => void;
  pledgerId: number | null;
  onSuccess: () => void;
}

const METHODS = ["cash", "transfer", "cheque", "mobile-money", "other"];

const today = () => new Date().toISOString().slice(0, 10);

const RedemptionModal = ({ open, onClose, pledgerId, onSuccess }: RedemptionModalProps) => {
  const { postData, loading } = usePost(api.post.createRedemption);
  const { handleUpload, loading: uploading } = usePictureUpload();
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setAmount("");
    setDate(today());
    setMethod(METHODS[0]);
    setNote("");
    setFile(null);
  };

  const handleSubmit = async () => {
    if (pledgerId == null) return;
    if (amount === "" || Number(amount) <= 0) {
      showNotification("Enter a valid amount", "error");
      return;
    }
    let image_url: string | null = null;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      image_url = await handleUpload(formData);
      if (!image_url) return; // upload hook already notified
    }
    try {
      await postData({
        pledger_id: pledgerId,
        amount: Number(amount),
        date,
        method,
        note: note || undefined,
        image_url,
      });
      showNotification("Redemption recorded", "success");
      reset();
      onSuccess();
      onClose();
    } catch {
      showNotification("Could not record redemption", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[95%] max-w-md p-6 bg-white rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Record redemption</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <label className="text-sm">Amount</label>
          <input
            type="number"
            className="border rounded-md p-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Date</label>
          <input
            type="date"
            className="border rounded-md p-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Method</label>
          <select
            className="border rounded-md p-2 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Note / reference (optional)</label>
          <input
            className="border rounded-md p-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Evidence image (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" className="px-4 py-2 border rounded-md text-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          disabled={loading || uploading}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
          onClick={handleSubmit}
        >
          {uploading ? "Uploading…" : loading ? "Saving…" : "Record"}
        </button>
      </div>
    </Modal>
  );
};

export default RedemptionModal;
