import { useCallback, useState } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  AudienceCount,
  MessageAudience,
  MessageChannels,
} from "@/utils/api/messaging/interfaces";
import { useMessagePreview } from "../useMessagePreview";
import { AudiencePicker, emptyAudience, isAudienceComplete } from "./AudiencePicker";
import { ChannelPicker } from "./ChannelPicker";
import { DispatchHistory } from "./DispatchHistory";
import { MessageComposer } from "./MessageComposer";
import { MessagePreviewPanel } from "./MessagePreviewPanel";

const NO_CHANNELS: MessageChannels = { sms: false, email: false, inApp: true };

/** Earliest selectable schedule time: now + 5 minutes, as a local datetime-local value. */
const minScheduleValue = () => {
  const d = new Date(Date.now() + 5 * 60_000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export const GeneralTab = ({ canManage }: { canManage: boolean }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [channels, setChannels] = useState<MessageChannels>(NO_CHANNELS);
  const [audience, setAudience] = useState<MessageAudience>(emptyAudience());
  const [count, setCount] = useState<AudienceCount | null>(null);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const onCount = useCallback((c: AudienceCount | null) => setCount(c), []);
  const preview = useMessagePreview({ body, subject: channels.email ? subject : null, kind: "GENERAL" });

  const hasChannel = channels.sms || channels.email || channels.inApp;
  const ready =
    title.trim() &&
    body.trim() &&
    hasChannel &&
    (!channels.email || subject.trim()) &&
    isAudienceComplete(audience) &&
    (when === "now" || scheduledFor) &&
    !(preview?.unknownPlaceholders.length);

  const reset = () => {
    setTitle("");
    setBody("");
    setSubject("");
    setChannels(NO_CHANNELS);
    setAudience(emptyAudience());
    setWhen("now");
    setScheduledFor("");
  };

  const send = async () => {
    setSending(true);
    try {
      await api.post.createGeneralMessage({
        title: title.trim(),
        body,
        emailSubject: channels.email ? subject.trim() : null,
        channels,
        audience,
        ...(when === "later" ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      });
      showNotification(when === "later" ? "Message scheduled" : "Message is sending", "success");
      setConfirmOpen(false);
      reset();
      setHistoryKey((k) => k + 1);
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setSending(false);
    }
  };

  const reach = count
    ? [
        `${count.people} people`,
        channels.sms && `${count.sms} SMS`,
        channels.email && `${count.email} email`,
        channels.inApp && `${count.inApp} in-app`,
      ].filter(Boolean).join(" · ")
    : "";

  const input = "w-full rounded-lg border border-lightGray p-2 text-sm";

  return (
    <div className="space-y-8">
      {canManage && (
        <section className="rounded-xl border border-lightGray bg-white p-5">
          <h3 className="mb-4 text-base font-semibold text-primary">New message</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-primary">Title (only admins see this)</span>
                <input className={input} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunday service moved to 9am" />
              </label>
              <AudiencePicker value={audience} onChange={setAudience} onCount={onCount} count={count} />
              <ChannelPicker value={channels} onChange={setChannels} />
              {channels.email && (
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-primary">Email subject</span>
                  <input className={input} value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
                </label>
              )}
              <MessageComposer id="general-body" label="Message" value={body} onChange={setBody} kind="GENERAL" preview={preview} showSmsCounter={channels.sms} />
              <fieldset className="space-y-2 text-sm">
                <legend className="font-medium text-primary">When</legend>
                <label className="flex items-center gap-2">
                  <input type="radio" name="when" checked={when === "now"} onChange={() => setWhen("now")} /> Send now
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="when" checked={when === "later"} onChange={() => setWhen("later")} /> Schedule
                </label>
                {when === "later" && (
                  <input type="datetime-local" className={input} min={minScheduleValue()} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
                )}
              </fieldset>
              <div className="flex justify-end">
                <Button value={when === "later" ? "Schedule…" : "Send…"} variant="primary" disabled={!ready} onClick={() => setConfirmOpen(true)} />
              </div>
            </div>
            <MessagePreviewPanel preview={preview} channels={channels} />
          </div>
        </section>
      )}

      <DispatchHistory refreshKey={historyKey} canManage={canManage} />

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm message">
        <div className="w-[min(92vw,440px)] space-y-4 p-6">
          <p className="text-lg font-semibold text-primary">{when === "later" ? "Schedule this message?" : "Send this message now?"}</p>
          <p className="text-sm">{reach || "Counting recipients…"}</p>
          {when === "later" && scheduledFor && (
            <p className="text-sm text-gray-600">Goes out {new Date(scheduledFor).toLocaleString()}.</p>
          )}
          {channels.sms && <p className="text-xs text-gray-500">SMS messages are charged per message.</p>}
          <div className="flex justify-end gap-2">
            <Button value="Back" variant="secondary" onClick={() => setConfirmOpen(false)} />
            <Button value={when === "later" ? "Schedule" : "Send"} variant="primary" loading={sending} disabled={sending} onClick={send} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
