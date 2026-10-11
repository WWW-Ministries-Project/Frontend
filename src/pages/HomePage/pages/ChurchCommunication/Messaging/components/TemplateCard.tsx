import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  MessageChannels,
  MessageTemplate,
  PlaceholderKind,
} from "@/utils/api/messaging/interfaces";
import { useMessagePreview } from "../useMessagePreview";
import { ChannelPicker } from "./ChannelPicker";
import { MessageComposer } from "./MessageComposer";
import { MessagePreviewPanel } from "./MessagePreviewPanel";

interface TemplateCardProps {
  template: MessageTemplate;
  title: string;
  description: string;
  canManage: boolean;
  stats?: { sent: number; failed: number; skipped: number };
  /** Note shown under the channels (e.g. the always-sent set-password email). */
  channelNote?: string;
  /** Visitor welcome only. */
  allowAppLink?: boolean;
  storeLinksMissing?: boolean;
  onOpenSettings?: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
  onSaved: () => void;
}

const sameChannels = (a: MessageChannels, b: MessageChannels) =>
  a.sms === b.sms && a.email === b.email && a.inApp === b.inApp;

export const TemplateCard = ({
  template,
  title,
  description,
  canManage,
  stats,
  channelNote,
  allowAppLink,
  storeLinksMissing,
  onOpenSettings,
  onDirtyChange,
  onSaved,
}: TemplateCardProps) => {
  const [enabled, setEnabled] = useState(template.enabled);
  const [channels, setChannels] = useState(template.channels);
  const [subject, setSubject] = useState(template.emailSubject ?? "");
  const [body, setBody] = useState(template.body);
  const [includeAppLink, setIncludeAppLink] = useState(template.includeAppLink);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () =>
      enabled !== template.enabled ||
      !sameChannels(channels, template.channels) ||
      subject !== (template.emailSubject ?? "") ||
      body !== template.body ||
      includeAppLink !== template.includeAppLink,
    [enabled, channels, subject, body, includeAppLink, template]
  );

  useEffect(() => {
    onDirtyChange(template.key, dirty);
    return () => onDirtyChange(template.key, false);
  }, [dirty, onDirtyChange, template.key]);

  const kind: PlaceholderKind = template.key === "BIRTHDAY" ? "BIRTHDAY" : "WELCOME";
  const preview = useMessagePreview({
    body,
    subject: channels.email ? subject : null,
    kind,
    includeAppLink: allowAppLink && includeAppLink,
  });

  const save = async () => {
    setSaving(true);
    try {
      await api.put.updateMessageTemplate(template.key, {
        enabled,
        channels,
        // A hidden subject (email off) is not sent, so it can never fail
        // validation on a field the admin cannot see.
        emailSubject: channels.email ? subject.trim() || null : template.emailSubject,
        body,
        includeAppLink: Boolean(allowAppLink && includeAppLink),
      });
      showNotification(`${title} saved`, "success");
      onSaved();
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-lightGray bg-white p-5" aria-labelledby={`${template.key}-title`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`${template.key}-title`} className="text-base font-semibold text-primary">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" aria-label={`Send ${title}`} checked={enabled} disabled={!canManage} onChange={(e) => setEnabled(e.target.checked)} />
          {enabled ? "On" : "Off"}
        </label>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ChannelPicker
            value={channels}
            onChange={setChannels}
            disabled={!canManage}
            unavailable={allowAppLink ? { inApp: "Visitors have no app account, so in-app is skipped." } : undefined}
          />
          {channelNote && <p className="text-xs text-gray-500">{channelNote}</p>}
          {channels.email && (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-primary">Email subject</span>
              <input
                className="w-full rounded-lg border border-lightGray p-2 text-sm disabled:bg-lightGray/40"
                value={subject}
                maxLength={150}
                disabled={!canManage}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
          )}
          <MessageComposer
            id={`${template.key}-body`}
            label="Message"
            value={body}
            onChange={setBody}
            kind={kind}
            preview={preview}
            showSmsCounter={channels.sms}
            disabled={!canManage}
          />
          {allowAppLink && (
            <div className="space-y-1 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeAppLink} disabled={!canManage} onChange={(e) => setIncludeAppLink(e.target.checked)} />
                Include app download link
              </label>
              {includeAppLink && storeLinksMissing && (
                <p className="text-xs text-red-600">
                  No store links yet.{" "}
                  <button type="button" className="underline" onClick={onOpenSettings}>Add them in Messaging settings</button>
                </p>
              )}
            </div>
          )}
        </div>
        <MessagePreviewPanel preview={preview} channels={channels} />
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-lightGray pt-3">
        <span className="text-xs text-gray-500">
          {stats ? `Last 30 days: ${stats.sent} sent · ${stats.failed} failed · ${stats.skipped} skipped` : ""}
        </span>
        {canManage && <Button value="Save" variant="primary" disabled={!dirty || saving} loading={saving} onClick={save} />}
      </footer>
    </section>
  );
};
