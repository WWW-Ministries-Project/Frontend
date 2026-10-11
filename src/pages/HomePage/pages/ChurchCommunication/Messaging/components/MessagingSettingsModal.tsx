import { useEffect, useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type { MessagingSettings } from "@/utils/api/messaging/interfaces";

interface MessagingSettingsModalProps {
  open: boolean;
  settings: MessagingSettings | null;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const MessagingSettingsModal = ({ open, settings, canManage, onClose, onSaved }: MessagingSettingsModalProps) => {
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [birthdaySendTime, setBirthdaySendTime] = useState("07:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAppStoreUrl(settings?.app_store_url ?? "");
    setPlayStoreUrl(settings?.play_store_url ?? "");
    setBirthdaySendTime(settings?.birthday_send_time ?? "07:00");
  }, [open, settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put.updateMessagingSettings({ appStoreUrl, playStoreUrl, birthdaySendTime });
      showNotification("Messaging settings saved", "success");
      onSaved();
      onClose();
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-lg border border-lightGray p-2 text-sm disabled:bg-lightGray/40";

  return (
    <Modal open={open} onClose={onClose} title="Messaging settings" className="max-w-lg">
      <div>
        <FormHeader>
          <p className="text-lg font-semibold">Messaging settings</p>
          <p className="text-sm text-white">App download links and when birthday messages go out.</p>
        </FormHeader>
        <div className="space-y-4 px-6 py-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-primary">App Store link (iPhone)</span>
            <input className={input} type="url" placeholder="https://apps.apple.com/…" value={appStoreUrl} disabled={!canManage} onChange={(e) => setAppStoreUrl(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-primary">Play Store link (Android)</span>
            <input className={input} type="url" placeholder="https://play.google.com/store/apps/…" value={playStoreUrl} disabled={!canManage} onChange={(e) => setPlayStoreUrl(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-primary">Birthday messages send at</span>
            <input className={input} type="time" value={birthdaySendTime} disabled={!canManage} onChange={(e) => setBirthdaySendTime(e.target.value)} />
            <span className="block text-xs text-gray-500">Church time ({settings?.timezone ?? "Africa/Accra"})</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-lightGray px-6 py-3">
          <Button value="Close" variant="secondary" onClick={onClose} />
          {canManage && <Button value="Save" variant="primary" loading={saving} disabled={saving} onClick={save} />}
        </div>
      </div>
    </Modal>
  );
};
