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
import { AudiencePicker, emptyAudience, isAudienceComplete, type AudienceCountState } from "./AudiencePicker";
import { ChannelPicker } from "./ChannelPicker";
import { DispatchHistory } from "./DispatchHistory";
import { MessageComposer } from "./MessageComposer";
import { MessagePreviewPanel } from "./MessagePreviewPanel";

const NO_CHANNELS: MessageChannels = { sms: false, email: false, inApp: true };

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const MAX_SCHEDULE_MS = 90 * DAY_MS;

/** A timestamp as a local datetime-local value (minute precision). */
const toLocalInputValue = (ms: number) => {
  const d = new Date(ms);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * MINUTE_MS).toISOString().slice(0, 16);
};

/** Earliest selectable schedule time: now + 5 minutes. */
const minScheduleValue = () => toLocalInputValue(Date.now() + 5 * MINUTE_MS);

/** Latest selectable schedule time: now + 90 days - 1 minute. */
const maxScheduleValue = () => toLocalInputValue(Date.now() + MAX_SCHEDULE_MS - MINUTE_MS);

/** Whether a datetime-local value is far enough ahead and within the 90-day window. */
const isScheduleValid = (value: string) => {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  return t > now + MINUTE_MS && t <= now + MAX_SCHEDULE_MS;
};

export const GeneralTab = ({ canManage }: { canManage: boolean }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [channels, setChannels] = useState<MessageChannels>(NO_CHANNELS);
  const [audience, setAudience] = useState<MessageAudience>(emptyAudience());
  const [count, setCount] = useState<AudienceCount | null>(null);
  const [countState, setCountState] = useState<AudienceCountState>("idle");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const onCount = useCallback((c: AudienceCount | null, state: AudienceCountState) => {
    setCount(c);
    setCountState(state);
  }, []);
  const preview = useMessagePreview({ body, subject: channels.email ? subject : null, kind: "GENERAL" });

  const hasChannel = channels.sms || channels.email || channels.inApp;
  const scheduleOk = when === "now" || isScheduleValid(scheduledFor);
  const reachOk = countState === "ok" && !!count && count.people > 0;
  const ready =
    title.trim() &&
    body.trim() &&
    hasChannel &&
    (!channels.email || subject.trim()) &&
    isAudienceComplete(audience) &&
    reachOk &&
    scheduleOk &&
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
    // The confirm dialog can sit open past the schedule window.
    if (when === "later" && !isScheduleValid(scheduledFor)) {
      showNotification("Pick a time between 5 minutes and 90 days from now", "error");
      return;
    }
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

  const reach = reachOk && count
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
              <AudiencePicker value={audience} onChange={setAudience} onCount={onCount} count={count} countState={countState} />
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
                  <>
                    <input type="datetime-local" aria-label="Send date and time" className={input} min={minScheduleValue()} max={maxScheduleValue()} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
                    {scheduledFor && !scheduleOk && (
                      <p className="text-xs text-red-600">Pick a time between 5 minutes and 90 days from now</p>
                    )}
                  </>
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

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm message" className="max-w-md">
        <div className="space-y-4 p-6">
          <p className="text-lg font-semibold text-primary">{when === "later" ? "Schedule this message?" : "Send this message now?"}</p>
          <p className="text-sm">
            {countState === "loading"
              ? "Counting recipients…"
              : countState === "error"
                ? "Couldn't count recipients — try again"
                : countState === "ok" && count?.people === 0
                  ? "No one matches this audience"
                  : reach}
          </p>
          {when === "later" && scheduledFor && (
            <p className="text-sm text-gray-600">Goes out {new Date(scheduledFor).toLocaleString()}.</p>
          )}
          {channels.sms && <p className="text-xs text-gray-500">SMS messages are charged per message.</p>}
          <div className="flex justify-end gap-2">
            <Button value="Back" variant="secondary" disabled={sending} onClick={() => setConfirmOpen(false)} />
            <Button value={when === "later" ? "Schedule" : "Send"} variant="primary" loading={sending} disabled={sending || !reachOk || !scheduleOk} onClick={send} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
