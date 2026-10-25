import { useEffect, useMemo, useState } from "react";

import { InlineAlert, notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type {
  MessageChannels,
  MessageTemplate,
  MessagingSettings,
  TemplateStats,
} from "@/utils/api/messaging/interfaces";

import { Field, TextArea, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import {
  CheckCard,
  FieldHint,
  OptionToggle,
  PlaceholderChips,
  ToggleSwitch,
} from "../ui/commUi";
import {
  appendToken,
  errorText,
  formatDay,
  plural,
} from "../ui/commUtils";
import { useMessagePreview } from "./useMessagePreview";
import { BIRTHDAY_CHIPS, CHANNELS, GENERAL_CHIPS, TEMPLATE_META, TEMPLATE_ORDER } from "./messagingHelpers";

const STATS_QUERY = { days: 30 };
const BIRTHDAYS_QUERY = { days: 7 };

export const AutomaticMessages = ({
  canEdit,
  canToggle,
  settings,
  storeMissing,
  onOpenSettings,
}: {
  /** Messaging.edit_templates: change text, channels and settings. */
  canEdit: boolean;
  /** Messaging.toggle_automatic: switch a message on or off. */
  canToggle: boolean;
  settings?: MessagingSettings;
  storeMissing: boolean;
  onOpenSettings: () => void;
}) => {
  const templates = useFetch(api.fetch.fetchMessageTemplates, undefined, false, { silent: true });
  const stats = useFetch(api.fetch.fetchMessagingStats, STATS_QUERY, false, { silent: true });
  const birthdays = useFetch(api.fetch.fetchUpcomingBirthdays, BIRTHDAYS_QUERY, false, { silent: true });

  const byKey = useMemo(() => new Map((templates.data?.data ?? []).map((template) => [template.key, template])), [templates.data]);
  const birthdaysThisWeek = birthdays.data?.data?.length ?? null;

  return (
    <div className="flex flex-col gap-4">
      {storeMissing && settings && (
        <InlineAlert
          tone="warning"
          title="App download link is incomplete"
          action={canEdit ? { label: "Open settings", onClick: onOpenSettings } : undefined}
        >
          {!settings.play_store_url ? "Android" : "iPhone"} visitors get a broken app link in the “Visitor added” message
          until the {!settings.play_store_url ? "Play Store" : "App Store"} link is added.
        </InlineAlert>
      )}
      {templates.loading && byKey.size === 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,440px),1fr))] gap-4">
          {TEMPLATE_ORDER.map((key) => (
            <div key={key} className="h-96 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,440px),1fr))] items-start gap-4">
          {TEMPLATE_ORDER.map((key) => {
            const template = byKey.get(key);
            if (!template) return null;
            return (
              <TemplateCard
                key={`${key}-${template.updatedAt}`}
                template={template}
                canEdit={canEdit}
                canToggle={canToggle}
                stats={stats.data?.data as TemplateStats | undefined}
                settings={settings}
                birthdaysThisWeek={birthdaysThisWeek}
                onSaved={() => templates.refetch()}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const sameChannels = (a: MessageChannels, b: MessageChannels) => a.sms === b.sms && a.email === b.email && a.inApp === b.inApp;

const TemplateCard = ({
  template,
  canEdit,
  canToggle,
  stats,
  settings,
  birthdaysThisWeek,
  onSaved,
}: {
  template: MessageTemplate;
  canEdit: boolean;
  canToggle: boolean;
  stats?: TemplateStats;
  settings?: MessagingSettings;
  birthdaysThisWeek: number | null;
  onSaved: () => void;
}) => {
  const meta = TEMPLATE_META[template.key];
  const isVisitor = template.key === "WELCOME_VISITOR";
  const isBirthday = template.key === "BIRTHDAY";

  const [enabled, setEnabled] = useState(template.enabled);
  const [channels, setChannels] = useState(template.channels);
  const [subject, setSubject] = useState(template.emailSubject ?? "");
  const [body, setBody] = useState(template.body);
  const [includeAppLink, setIncludeAppLink] = useState(template.includeAppLink);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEnabled(template.enabled);
    setChannels(template.channels);
    setSubject(template.emailSubject ?? "");
    setBody(template.body);
    setIncludeAppLink(template.includeAppLink);
  };
  useEffect(reset, [template]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty =
    enabled !== template.enabled ||
    !sameChannels(channels, template.channels) ||
    (channels.email && subject !== (template.emailSubject ?? "")) ||
    body !== template.body ||
    includeAppLink !== template.includeAppLink;

  const preview = useMessagePreview({
    body,
    subject: channels.email ? subject : null,
    kind: isBirthday ? "BIRTHDAY" : "WELCOME",
    includeAppLink: isVisitor && includeAppLink,
  });
  const unknown = preview?.unknownPlaceholders ?? [];
  const sent = stats?.[template.key]?.sent ?? 0;
  const anyChannel = channels.sms || channels.email || channels.inApp;

  const status = !enabled
    ? "Off. Nobody receives this message."
    : isBirthday
      ? `Sends daily at ${settings?.birthday_send_time ?? "07:00"} (${settings?.timezone ?? "Africa/Accra"})${
          birthdaysThisWeek !== null ? ` · ${plural(birthdaysThisWeek, "birthday")} this week` : ""
        } · ${sent.toLocaleString("en-US")} sent in 30 days`
      : `${sent.toLocaleString("en-US")} sent in the last 30 days`;

  const save = async () => {
    if (!body.trim()) {
      notify.error({ title: "Message can’t be empty", message: `${meta.title} wasn’t saved.` });
      return;
    }
    if (unknown.length) {
      notify.error({ title: "Fix the placeholders first", message: `${unknown.join(", ")} isn’t available in this message.` });
      return;
    }
    if (enabled && !anyChannel) {
      notify.error({ title: "Choose at least one channel", message: "Or turn the message off." });
      return;
    }
    if (enabled && channels.email && !subject.trim()) {
      notify.error({ title: "Add an email subject", message: `${meta.title} wasn’t saved.` });
      return;
    }
    setSaving(true);
    try {
      await api.put.updateMessageTemplate(template.key, {
        enabled,
        channels,
        emailSubject: channels.email ? subject.trim() || null : template.emailSubject,
        body,
        includeAppLink: isVisitor && includeAppLink,
      });
      notify.success({
        title: `${meta.title} saved`,
        message: enabled ? "Applies from the next one sent." : "It’s off, so nothing will send.",
      });
      onSaved();
    } catch (error) {
      notify.error({ title: `Couldn't save ${meta.title.toLowerCase()}`, message: errorText(error, "Try again.") });
    } finally {
      setSaving(false);
    }
  };

  const chips = isBirthday ? BIRTHDAY_CHIPS : GENERAL_CHIPS;
  const counter = unknown.length
    ? `Unknown: ${unknown.join(", ")}`
    : preview
      ? `${preview.body.length} characters${channels.sms ? ` · ${preview.sms.segments} SMS` : ""}`
      : `${body.length} characters`;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5" aria-labelledby={`tpl-${template.key}`}>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id={`tpl-${template.key}`} className="text-base font-semibold text-primary">
            {meta.title}
          </h3>
          <p className="text-sm text-gray-600">{meta.description}</p>
        </div>
        <ToggleSwitch on={enabled} onChange={setEnabled} label={`Send ${meta.title} messages`} disabled={!canToggle} />
      </div>
      <p className={`text-xs ${enabled ? "text-gray-500" : "text-amber-700"}`}>{status}</p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Channels">
        {CHANNELS.map((channel) => {
          const blocked = isVisitor && channel.key === "inApp";
          return (
            <OptionToggle
              key={channel.key}
              on={channels[channel.key] && !blocked}
              onClick={() => {
                if (!canEdit || blocked) return;
                setChannels({ ...channels, [channel.key]: !channels[channel.key] });
              }}
            >
              {channel.label}
            </OptionToggle>
          );
        })}
      </div>
      {isVisitor && <FieldHint>Visitors have no app account, so in-app is skipped.</FieldHint>}
      {(template.key === "WELCOME_MEMBER" || template.key === "WELCOME_GUEST") && (
        <FieldHint>New app sign-ups always also get the account email with their set-password link.</FieldHint>
      )}

      {channels.email && (
        <Field label="Email subject">
          <TextInput value={subject} maxLength={150} disabled={!canEdit} onChange={(event) => setSubject(event.target.value)} />
        </Field>
      )}

      <Field label="Message">
        <TextArea
          rows={4}
          value={body}
          disabled={!canEdit}
          hasError={unknown.length > 0}
          onChange={(event) => setBody(event.target.value)}
        />
      </Field>
      <PlaceholderChips chips={canEdit ? chips : []} onAdd={(token) => setBody(appendToken(body, token))} counter={counter} />
      {isVisitor && (
        <CheckCard
          checked={includeAppLink}
          onChange={(value) => canEdit && setIncludeAppLink(value)}
          label="Add the app download links"
          help="Appends the App Store and Play Store links from Messaging settings."
        />
      )}

      <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-inputBackground px-4 py-3">
        <p className="text-xs font-semibold uppercase text-gray-500">Preview for a sample member</p>
        <p className="whitespace-pre-wrap text-sm text-gray-700">{preview?.body ?? body}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-[1_1_160px] text-xs text-gray-500">
          {dirty ? "Unsaved changes" : `Last edited ${formatDay(template.updatedAt)}`}
        </span>
        {dirty && (canEdit || canToggle) && (
          <>
            <UiButton tone="ghost" className="text-primary hover:bg-primary/5" onClick={reset} disabled={saving}>
              Discard
            </UiButton>
            <UiButton tone="primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </UiButton>
          </>
        )}
      </div>
    </section>
  );
};
