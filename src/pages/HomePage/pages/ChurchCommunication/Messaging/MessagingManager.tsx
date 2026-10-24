import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type {
  DispatchFilter,
  MessageDispatch,
  MessageRecipient,
  MessagingSettings,
} from "@/utils/api/messaging/interfaces";

import PageOutline from "../../../Components/PageOutline";
import {
  Field,
  KpiCard,
  PageHeading,
  Pill,
  PillTabs,
  TextInput,
  UiButton,
} from "../../MembershipManagement/components/membershipUi";
import {
  CommDialog,
  FieldHint,
  ListEmpty,
} from "../ui/commUi";
import {
  WIDE_TABLE_MIN,
  errorText,
  formatDayTime,
  plural,
  timeAgo,
  useViewportWidth,
} from "../ui/commUtils";
import { AutomaticMessages } from "./AutomaticMessages";
import { MessageCompose, type ComposeSeed } from "./MessageCompose";
import { CHANNELS, channelCounts, channelList, dispatchPill, peopleOf, totalsOf } from "./messagingHelpers";

type Tab = "history" | "auto";
const PAGE_SIZE = 20;
const HTTPS = /^https:\/\//i;

const FILTERS: { key: DispatchFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Has failures" },
];

const nf = (value: number) => value.toLocaleString("en-US");

const MessagingManager = () => {
  const { hasPermission } = useAccessControl();
  const canManage = hasPermission("manage_messaging");
  const wide = useViewportWidth() >= WIDE_TABLE_MIN;

  const [tab, setTab] = useState<Tab>("history");
  const [filter, setFilter] = useState<DispatchFilter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [compose, setCompose] = useState<ComposeSeed | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<{ appStore: string; playStore: string; bday: string } | null>(null);
  const [settingsTried, setSettingsTried] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const dispatchQuery = useMemo(() => ({ kind: "GENERAL", filter, page: 1, limit }), [filter, limit]);
  const overview = useFetch(api.fetch.fetchMessagingOverview, OVERVIEW_QUERY, false, { silent: true });
  const dispatches = useFetch(api.fetch.fetchMessageDispatches, dispatchQuery, false, { silent: true });
  const settings = useFetch(api.fetch.fetchMessagingSettings, undefined, false, { silent: true });

  useEffect(() => setLimit(PAGE_SIZE), [filter]);

  const rows: MessageDispatch[] = dispatches.data?.data ?? [];
  const total = dispatches.data?.meta?.total ?? rows.length;
  const facets = (dispatches.data?.meta?.status_counts ?? {}) as Partial<Record<DispatchFilter, number>>;
  const o = overview.data?.data;
  const s: MessagingSettings | undefined = settings.data?.data;
  const storeMissing = !!s && (!s.app_store_url || !s.play_store_url);

  // Keep "Sending" rows moving without a manual refresh.
  const anySending = rows.some((row) => row.status === "QUEUED");
  useEffect(() => {
    if (!anySending) return;
    const timer = setInterval(() => dispatches.refetch(), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anySending]);

  const refreshHistory = async () => {
    await Promise.all([dispatches.refetch(), overview.refetch()]);
  };

  /* ------------------------------ settings ------------------------------ */

  const openSettings = () => {
    setSettingsDraft({ appStore: s?.app_store_url ?? "", playStore: s?.play_store_url ?? "", bday: s?.birthday_send_time ?? "07:00" });
    setSettingsTried(false);
    setSettingsErrors([]);
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;
    setSettingsTried(true);
    const list: string[] = [];
    if (settingsDraft.appStore.trim() && !HTTPS.test(settingsDraft.appStore.trim())) list.push("App Store link must start with https://");
    if (settingsDraft.playStore.trim() && !HTTPS.test(settingsDraft.playStore.trim())) list.push("Play Store link must start with https://");
    setSettingsErrors(list);
    if (list.length) return;
    setSavingSettings(true);
    try {
      await api.put.updateMessagingSettings({
        appStoreUrl: settingsDraft.appStore.trim(),
        playStoreUrl: settingsDraft.playStore.trim(),
        birthdaySendTime: settingsDraft.bday,
      });
      setSettingsDraft(null);
      await settings.refetch();
      notify.success({ title: "Messaging settings saved" });
    } catch (error) {
      setSettingsErrors([errorText(error, "Settings weren't saved. Try again.")]);
    } finally {
      setSavingSettings(false);
    }
  };

  /* ------------------------------ compose ------------------------------ */

  if (compose) {
    return (
      <MessageCompose
        seed={compose}
        timezone={s?.timezone ?? "Africa/Accra"}
        onClose={() => setCompose(null)}
        onSent={async () => {
          setCompose(null);
          setTab("history");
          setFilter("all");
          await refreshHistory();
        }}
      />
    );
  }

  const opened = openId ? rows.find((row) => row.id === openId) ?? null : null;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Messaging"
        subtitle="Send SMS, email and in-app messages, and manage automatic welcome and birthday messages."
        actions={
          canManage ? (
            <>
              <UiButton onClick={openSettings} disabled={!s}>
                Settings
              </UiButton>
              <UiButton tone="primary" onClick={() => setCompose({})}>
                New message
              </UiButton>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <KpiCard label="Messages sent" value={o ? nf(o.messagesSent) : "—"} sub={`Last ${o?.days ?? 30} days`} />
        <KpiCard
          label="Delivered"
          value={o ? nf(o.delivered) : "—"}
          sub={o ? `${o.deliveryRate === null ? "0" : o.deliveryRate.toFixed(1)}% delivery rate` : undefined}
        />
        <KpiCard
          label="Failed"
          value={o ? nf(o.failed) : "—"}
          sub={
            o ? (
              <span className={o.failed ? "text-amber-700" : "text-green-700"}>
                {o.failed ? "Mostly invalid numbers and bounced emails" : "None"}
              </span>
            ) : undefined
          }
        />
        <KpiCard label="SMS used" value={o ? nf(o.smsSegmentsUsed) : "—"} sub={`Segments, last ${o?.days ?? 30} days`} />
      </div>

      <PillTabs
        ariaLabel="Messaging sections"
        className="self-start"
        tabs={[
          { key: "history", label: "Messages" },
          {
            key: "auto",
            label: (
              <>
                Automatic messages
                {storeMissing && (
                  <span aria-label="needs attention" className="rounded-full bg-warning/10 px-2 text-xs font-semibold text-warning">
                    !
                  </span>
                )}
              </>
            ),
          },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "history" && (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const on = item.key === filter;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(item.key)}
                  className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium ${on ? "border-primary bg-primary text-white" : "border-lightGray bg-white text-primary hover:bg-inputBackground"}`}
                >
                  {item.label} · {facets[item.key] ?? (on ? total : 0)}
                </button>
              );
            })}
          </div>

          {dispatches.loading && rows.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <ListEmpty>{filter === "all" ? "No messages yet. Send the first one with New message." : "No messages in this view."}</ListEmpty>
          ) : wide ? (
            <div className="overflow-x-auto rounded-lg border border-lightGray bg-white shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]">
              <div className="min-w-[920px]">
                <div className="grid grid-cols-[minmax(240px,2.2fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(120px,0.9fr)_minmax(150px,1fr)_minmax(130px,0.9fr)] gap-3 bg-lightGray px-6 py-4 text-sm font-semibold text-primary">
                  <span>Message</span>
                  <span>Audience</span>
                  <span>Channels</span>
                  <span>Status</span>
                  <span>Delivered</span>
                  <span>When</span>
                </div>
                {rows.map((row) => {
                  const pill = dispatchPill(row);
                  const totals = totalsOf(row);
                  const attempted = totals ? totals.sent + totals.failed : 0;
                  return (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenId(row.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setOpenId(row.id);
                      }}
                      className="grid min-h-16 cursor-pointer grid-cols-[minmax(240px,2.2fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(120px,0.9fr)_minmax(150px,1fr)_minmax(130px,0.9fr)] items-center gap-3 border-b border-lightGray px-6 py-3 text-sm text-primary hover:bg-lightGray/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{row.title}</p>
                        <p className="truncate text-xs text-gray-500">{row.body}</p>
                      </div>
                      <p className="text-gray-600">{row.audienceLabel ?? "—"}</p>
                      <div className="flex flex-wrap gap-1">
                        {channelList(row.channels).map((label) => (
                          <span key={label} className="rounded-full bg-gray-100 px-2 text-xs text-gray-700">
                            {label}
                          </span>
                        ))}
                      </div>
                      <div>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </div>
                      <DeliveryBar row={row} attempted={attempted} />
                      <div>
                        <p>{row.status === "SCHEDULED" ? formatDayTime(row.scheduledFor) : timeAgo(row.createdAt)}</p>
                        <p className="text-xs text-gray-500">{row.createdByName ?? ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((row) => {
                const pill = dispatchPill(row);
                const totals = totalsOf(row);
                const attempted = totals ? totals.sent + totals.failed : 0;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setOpenId(row.id)}
                    className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-left text-primary"
                  >
                    <div className="flex w-full items-start gap-2">
                      <p className="flex-1 text-sm font-semibold">{row.title}</p>
                      <Pill tone={pill.tone}>{pill.label}</Pill>
                    </div>
                    <p className="text-xs text-gray-500">
                      {[row.audienceLabel, channelList(row.channels).join(", "), row.status === "SCHEDULED" ? formatDayTime(row.scheduledFor) : timeAgo(row.createdAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <DeliveryBar row={row} attempted={attempted} inline />
                  </button>
                );
              })}
            </div>
          )}
          {rows.length < total && (
            <UiButton className="self-center" onClick={() => setLimit((prev) => Math.min(prev + PAGE_SIZE, 100))} disabled={dispatches.loading || limit >= 100}>
              {dispatches.loading ? "Loading…" : "Show more messages"}
            </UiButton>
          )}
        </>
      )}

      {tab === "auto" && (
        <AutomaticMessages
          canManage={canManage}
          settings={s}
          storeMissing={storeMissing}
          onOpenSettings={openSettings}
        />
      )}

      {opened && (
        <DispatchDialog
          dispatch={opened}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onChanged={refreshHistory}
          onDuplicate={() => {
            setOpenId(null);
            setCompose({ title: `${opened.title} (copy)`, body: opened.body, emailSubject: opened.emailSubject ?? "", channels: opened.channels });
          }}
        />
      )}

      {settingsDraft && (
        <CommDialog
          open
          onClose={() => setSettingsDraft(null)}
          busy={savingSettings}
          title="Messaging settings"
          subtitle="App download links and when birthday messages go out."
          errors={settingsErrors}
          buttons={[
            { label: "Cancel", onClick: () => setSettingsDraft(null) },
            { label: "Save settings", onClick: saveSettings, tone: "primary" },
          ]}
        >
          <Field label="App Store link (iPhone)">
            <TextInput
              type="url"
              value={settingsDraft.appStore}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, appStore: event.target.value })}
              placeholder="https://apps.apple.com/…"
              maxLength={191}
              hasError={settingsTried && !!settingsDraft.appStore.trim() && !HTTPS.test(settingsDraft.appStore.trim())}
            />
          </Field>
          <Field label="Play Store link (Android)">
            <TextInput
              type="url"
              value={settingsDraft.playStore}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, playStore: event.target.value })}
              placeholder="https://play.google.com/store/apps/…"
              maxLength={191}
              hasError={settingsTried && !!settingsDraft.playStore.trim() && !HTTPS.test(settingsDraft.playStore.trim())}
            />
            {!settingsDraft.playStore.trim() && (
              <FieldHint tone="warning">Missing. Android visitors get a broken app link.</FieldHint>
            )}
          </Field>
          <Field label="Birthday messages send at" className="max-w-[240px]">
            <TextInput type="time" value={settingsDraft.bday} onChange={(event) => setSettingsDraft({ ...settingsDraft, bday: event.target.value })} />
            <FieldHint>Church time ({s?.timezone ?? "Africa/Accra"})</FieldHint>
          </Field>
        </CommDialog>
      )}
    </PageOutline>
  );
};

const OVERVIEW_QUERY = { days: 30 };

const DeliveryBar = ({ row, attempted, inline }: { row: MessageDispatch; attempted: number; inline?: boolean }) => {
  const totals = totalsOf(row);
  const people = peopleOf(row);
  const label = totals ? `${nf(totals.sent)} of ${nf(attempted)}` : row.status === "SCHEDULED" ? "Not sent yet" : "—";
  const width = attempted && totals ? `${(totals.sent * 100) / attempted}%` : "0%";
  const color = totals && totals.failed ? "bg-warning" : "bg-success";
  const bar = (
    <div className={`h-1.5 overflow-hidden rounded-full bg-gray-200 ${inline ? "flex-1" : ""}`}>
      <div className={`h-full ${color}`} style={{ width }} />
    </div>
  );
  if (inline) {
    return (
      <div className="flex w-full items-center gap-2">
        {bar}
        <span className="text-xs">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span>{label}</span>
      {bar}
      {people !== null && !totals && <span className="text-xs text-gray-500">{plural(people, "person", "people")}</span>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Dispatch detail                              */
/* -------------------------------------------------------------------------- */

const DispatchDialog = ({
  dispatch,
  canManage,
  onClose,
  onChanged,
  onDuplicate,
}: {
  dispatch: MessageDispatch;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onDuplicate: () => void;
}) => {
  const [failures, setFailures] = useState<MessageRecipient[]>([]);
  const [busy, setBusy] = useState(false);
  const totals = totalsOf(dispatch);
  const pill = dispatchPill(dispatch);
  const people = peopleOf(dispatch);

  useEffect(() => {
    if (!totals?.failed) return;
    let cancelled = false;
    api.fetch
      .fetchMessageRecipients(dispatch.id, { status: "FAILED", limit: 200 })
      .then((response) => {
        if (!cancelled) setFailures(response.data ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [dispatch.id, totals?.failed]);

  const reasons = useMemo(() => {
    const counts = new Map<string, number>();
    failures.forEach((recipient) => {
      const channel = recipient.channel === "IN_APP" ? "In-app" : recipient.channel === "EMAIL" ? "Email" : "SMS";
      const key = `${channel}: ${recipient.error?.trim() || "no reason given"}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([reason, count]) => `${nf(count)} · ${reason}`);
  }, [failures]);

  const retry = async () => {
    setBusy(true);
    try {
      const response = await api.post.retryFailedMessages(dispatch.id);
      await onChanged();
      onClose();
      notify.success({
        title: `Retrying ${nf(response.data?.retried ?? totals?.failed ?? 0)} failed`,
        message: "Numbers that are invalid will fail again. Fix them in member profiles.",
      });
    } finally {
      setBusy(false);
    }
  };

  const cancel = () =>
    confirmAction({
      title: "Cancel this scheduled message?",
      points: [`“${dispatch.title}” won’t be sent on ${formatDayTime(dispatch.scheduledFor)}.`, "It stays in history as Cancelled."],
      confirmLabel: "Cancel message",
      cancelLabel: "Keep scheduled",
      tone: "danger",
      onConfirm: async () => {
        await api.post.cancelMessageDispatch(dispatch.id);
        await onChanged();
        onClose();
        notify.success({ title: "Scheduled message cancelled", message: dispatch.title });
      },
    });

  const when =
    dispatch.status === "SCHEDULED"
      ? `Goes out ${formatDayTime(dispatch.scheduledFor)}`
      : dispatch.status === "CANCELLED"
        ? `Was due ${formatDayTime(dispatch.scheduledFor ?? dispatch.createdAt)}`
        : `Sent ${formatDayTime(dispatch.scheduledFor ?? dispatch.createdAt)}`;

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      width={720}
      title={dispatch.title}
      subtitle={[dispatch.audienceLabel, people !== null ? plural(people, "person", "people") : null, channelList(dispatch.channels).join(", ")]
        .filter(Boolean)
        .join(" · ")}
      buttons={[
        { label: "Close", onClick: onClose },
        ...(canManage ? [{ label: "Duplicate", onClick: onDuplicate }] : []),
        ...(canManage && dispatch.status === "SCHEDULED" ? [{ label: "Cancel message", onClick: cancel, tone: "danger" as const }] : []),
        ...(canManage && dispatch.status !== "SCHEDULED" && dispatch.status !== "CANCELLED" && totals?.failed
          ? [{ label: `Retry ${nf(totals.failed)} failed`, onClick: retry, tone: "primary" as const }]
          : []),
      ]}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Pill tone={pill.tone}>{pill.label}</Pill>
        <span className="text-gray-600">
          {when}
          {dispatch.createdByName ? ` by ${dispatch.createdByName}` : ""}
        </span>
      </div>
      {dispatch.emailSubject && dispatch.channels.email && (
        <p className="text-sm text-gray-600">
          Email subject: <span className="font-semibold text-primary">{dispatch.emailSubject}</span>
        </p>
      )}
      <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-inputBackground px-4 py-3 text-sm text-primary">{dispatch.body}</p>
      {dispatch.counts && (
        <div className="overflow-x-auto rounded-lg border border-lightGray">
          <div className="min-w-[420px] text-sm text-primary">
            <div className="grid grid-cols-[1.2fr_repeat(3,0.8fr)_1.4fr] gap-3 bg-lightGray px-4 py-3 font-semibold">
              <span>Channel</span>
              <span>Sent</span>
              <span>Failed</span>
              <span>Skipped</span>
              <span />
            </div>
            {CHANNELS.filter((channel) => dispatch.channels[channel.key]).map((channel) => {
              const counts = channelCounts(dispatch, channel.key);
              const all = Math.max(1, counts.sent + counts.failed + counts.skipped + (counts.pending ?? 0));
              return (
                <div key={channel.key} className="grid grid-cols-[1.2fr_repeat(3,0.8fr)_1.4fr] items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0">
                  <span className="font-semibold">{channel.label}</span>
                  <span>{nf(counts.sent)}</span>
                  <span className={counts.failed ? "text-red-700" : "text-gray-500"}>{nf(counts.failed)}</span>
                  <span className="text-gray-500">{nf(counts.skipped)}</span>
                  <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="bg-success" style={{ width: `${(counts.sent * 100) / all}%` }} />
                    <div className="bg-error" style={{ width: `${(counts.failed * 100) / all}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!!totals?.failed && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-semibold text-primary">Why some failed</p>
          {reasons.map((reason) => (
            <p key={reason} className="text-gray-600">
              · {reason}
            </p>
          ))}
          <p className="text-gray-600">· Skipped means the person has no phone, email or app for that channel.</p>
        </div>
      )}
      {dispatch.error && <p className="text-sm text-red-700">{dispatch.error}</p>}
    </CommDialog>
  );
};

export default MessagingManager;
