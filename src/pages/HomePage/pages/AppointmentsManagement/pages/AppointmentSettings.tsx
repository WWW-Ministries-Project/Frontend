import { useEffect, useMemo, useState } from "react";

import { InlineAlert, describeError, notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type {
  AppointmentChannel,
  AppointmentNotificationAudience,
  AppointmentNotificationEvent,
  AppointmentReason,
  AppointmentSettings as Settings,
} from "@/utils/api/appointment/interfaces";

import PageOutline from "../../../Components/PageOutline";
import { ChipToggle, CommDialog, FieldHint, ToggleSwitch } from "../../ChurchCommunication/ui/commUi";
import { Field, PageHeading, PillTabs, SelectInput, TextArea, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { CHANNELS, NOTIFICATION_AUDIENCES, NOTIFICATION_EVENTS, plural } from "../utils/appointmentModel";
import { useAppointmentsData } from "../utils/useAppointmentsData";

type Tab = "reasons" | "rules" | "notif";
type RuleKey = Exclude<keyof Settings, "notifications">;

const H = (value: number, label: string) => ({ value: String(value), label });

const RULES: { key: RuleKey; label: string; help: string; options: { value: string; label: string }[] }[] = [
  {
    key: "replyDeadlineHours",
    label: "Reply deadline",
    help: "How long the person has to accept, suggest a time or decline. After that, admins are alerted.",
    options: [H(4, "4 hours"), H(12, "12 hours"), H(24, "24 hours"), H(48, "48 hours")],
  },
  {
    key: "unansweredAfterHours",
    label: "If nobody replies",
    help: "What happens to a request nobody answers, counted from when it was made.",
    options: [H(48, "Offer other people after 48 h"), H(72, "Offer other people after 72 h"), H(0, "Keep waiting")],
  },
  {
    key: "minNoticeHours",
    label: "Minimum notice",
    help: "How soon a member can book ahead of a session.",
    options: [H(2, "2 hours"), H(12, "12 hours"), H(24, "1 day"), H(48, "2 days")],
  },
  {
    key: "bookAheadDays",
    label: "Book up to",
    help: "How far into the future members can book.",
    options: [H(14, "2 weeks"), H(30, "30 days"), H(60, "60 days"), H(90, "90 days")],
  },
  {
    key: "reminderHours",
    label: "Reminder before the appointment",
    help: "Sent to both sides.",
    options: [H(2, "2 hours before"), H(24, "1 day before"), H(48, "2 days before")],
  },
  {
    key: "cancelCutoffHours",
    label: "Members can cancel until",
    help: "After this, they’re asked to call the office instead.",
    options: [H(2, "2 hours before"), H(12, "12 hours before"), H(24, "1 day before")],
  },
];

/** Sample push/SMS copy for the preview panel. */
const preview = (event: AppointmentNotificationEvent, sla: number) =>
  ({
    new: {
      who: "the person booked",
      title: "New appointment request",
      body: `Yaw Boateng · Counselling · Wed 21 Oct, 4:30 PM. Reply within ${sla} h.`,
      acts: ["Accept", "Other options"],
      sms: "WWM: Yaw Boateng asked to meet you Wed 21 Oct, 4:30 PM (Counselling). Reply in the app.",
    },
    nudge: {
      who: "the person booked",
      title: "Yaw is still waiting",
      body: "Reply to Yaw Boateng’s request for Wed 21 Oct before the deadline.",
      acts: ["Accept", "Other options"],
      sms: "WWM reminder: Yaw Boateng is waiting for your reply.",
    },
    overdue: {
      who: "admins",
      title: "Reply overdue",
      body: `Yaw Boateng has waited ${sla} h for Pastor Samuel Addo. Remind, reassign or reply for them.`,
      acts: ["Open"],
      sms: "WWM: Yaw Boateng’s request to Pastor Samuel Addo is overdue.",
    },
    accepted: {
      who: "the member",
      title: "Appointment confirmed",
      body: "Pastor Samuel Addo will see you Wed 21 Oct, 4:30 PM at the church office.",
      acts: ["Add to calendar"],
      sms: "WWM: Confirmed. Pastor Samuel Addo, Wed 21 Oct 4:30 PM, church office.",
    },
    suggested: {
      who: "the member",
      title: "New time suggested",
      body: "Pastor Samuel Addo can do Thu 22 Oct, 5:00 PM instead.",
      acts: ["Accept", "Pick another"],
      sms: "WWM: Pastor Samuel Addo suggested Thu 22 Oct 5:00 PM. Accept or pick another in the app.",
    },
    declined: {
      who: "the member",
      title: "Request not accepted",
      body: "Pastor Samuel Addo can’t take this one. Rev. Mrs Comfort Osei has times this week.",
      acts: ["See who’s free"],
      sms: "WWM: Pastor Samuel Addo can’t meet on Wed 21 Oct. Book someone else in the app.",
    },
    cancelled: {
      who: "the person booked",
      title: "Appointment cancelled",
      body: "Yaw Boateng cancelled Wed 21 Oct, 4:30 PM. The slot is free again.",
      acts: [],
      sms: "WWM: Yaw Boateng cancelled Wed 21 Oct 4:30 PM.",
    },
    reminder: {
      who: "both sides",
      title: "Tomorrow at 4:30 PM",
      body: "Counselling with Yaw Boateng at the church office.",
      acts: ["Directions"],
      sms: "WWM reminder: Counselling tomorrow 4:30 PM at the church office.",
    },
    outcome: {
      who: "the person booked",
      title: "How did it go with Yaw?",
      body: "Record the outcome for Wed 21 Oct.",
      acts: ["Completed", "No-show"],
      sms: "WWM: Did Yaw Boateng attend on Wed 21 Oct? Reply in the app.",
    },
  })[event];

const AppointmentSettings = () => {
  const data = useAppointmentsData();
  const { settings, isAdmin, bookings } = data;
  const [tab, setTab] = useState<Tab>("reasons");

  /* -------------------------------- reasons ------------------------------- */

  const reasonsQuery = useFetch(api.fetch.fetchManageAppointmentReasons);
  const [reasons, setReasons] = useState<AppointmentReason[]>([]);
  useEffect(() => {
    const raw = reasonsQuery.data?.data;
    if (Array.isArray(raw)) setReasons(raw.slice().sort((a, b) => a.sort_order - b.sort_order));
  }, [reasonsQuery.data]);
  const [reasonDialog, setReasonDialog] = useState<{ id: number | null; label: string; description: string } | null>(null);
  const [reasonErrors, setReasonErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const usesOf = (reason: AppointmentReason) => bookings.filter((b) => b.reason === reason.label).length;
  const fail = (title: string, error: unknown) =>
    notify.error({ title, message: describeError(error, { preferServerMessage: true }).message });

  const move = async (index: number, dir: -1 | 1) => {
    const next = reasons.slice();
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    const previous = reasons;
    setReasons(next);
    try {
      await api.put.reorderAppointmentReasons({ ids: next.map((r) => r.id) });
    } catch (error) {
      setReasons(previous);
      fail("Couldn’t reorder the reasons", error);
    }
  };

  const setActive = async (reason: AppointmentReason, active: boolean) => {
    try {
      await api.put.updateAppointmentReason({ is_active: active }, { id: reason.id });
      await reasonsQuery.refetch();
      notify.success(
        active
          ? { title: `${reason.label} shown`, message: "Members can pick it when booking." }
          : {
              title: `${reason.label} hidden`,
              message: "Members can’t pick it. Past bookings keep it.",
              undo: async () => {
                await api.put.updateAppointmentReason({ is_active: true }, { id: reason.id });
                await reasonsQuery.refetch();
              },
              undoneTitle: `${reason.label} shown`,
            }
      );
    } catch (error) {
      fail("Couldn’t update the reason", error);
    }
  };

  const remove = (reason: AppointmentReason) => {
    const uses = usesOf(reason);
    if (uses) {
      notify.info({
        title: `${reason.label} is used by ${plural(uses, "booking")}`,
        message: "Hide it instead so past bookings keep their reason.",
        action: { label: "Hide it", onClick: () => setActive(reason, false) },
      });
      return;
    }
    confirmAction({
      title: `Delete “${reason.label}”?`,
      points: ["It’s removed from the booking form.", "This can’t be undone."],
      confirmLabel: "Delete reason",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteAppointmentReason({ id: reason.id });
        await reasonsQuery.refetch();
        notify.success({ title: "Reason deleted", message: reason.label });
      },
    });
  };

  const saveReason = async () => {
    if (!reasonDialog) return;
    const label = reasonDialog.label.trim();
    const list: string[] = [];
    if (label.length < 2) list.push("Give the reason a label of at least 2 characters.");
    if (reasons.some((r) => r.label.toLowerCase() === label.toLowerCase() && r.id !== reasonDialog.id))
      list.push(`There’s already a reason called “${label}”.`);
    setReasonErrors(list);
    if (list.length) return;
    setBusy(true);
    try {
      const payload = { label, description: reasonDialog.description.trim() || null };
      if (reasonDialog.id) await api.put.updateAppointmentReason(payload, { id: reasonDialog.id });
      else await api.post.createAppointmentReason({ ...payload, is_active: true });
      await reasonsQuery.refetch();
      notify.success({ title: reasonDialog.id ? "Reason updated" : "Reason added", message: label });
      setReasonDialog(null);
    } catch (error) {
      setReasonErrors([describeError(error, { preferServerMessage: true }).message]);
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------- rules -------------------------------- */

  const [draft, setDraft] = useState<Partial<Record<RuleKey, number>>>({});
  const dirty = RULES.some((r) => draft[r.key] !== undefined && draft[r.key] !== settings[r.key]);
  const saveRules = async () => {
    setBusy(true);
    try {
      await api.put.updateAppointmentSettings(draft);
      await data.refetchSettings();
      notify.success({
        title: "Booking rules saved",
        message: `Reply deadline is now ${draft.replyDeadlineHours ?? settings.replyDeadlineHours} hours.`,
      });
      setDraft({});
    } catch (error) {
      fail("Couldn’t save the booking rules", error);
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------- notifications ---------------------------- */

  const [selected, setSelected] = useState<AppointmentNotificationEvent>("new");
  const [matrix, setMatrix] = useState(settings.notifications);
  useEffect(() => setMatrix(settings.notifications), [settings.notifications]);

  const toggleChannel = async (
    event: AppointmentNotificationEvent,
    who: AppointmentNotificationAudience,
    channel: AppointmentChannel
  ) => {
    const current = matrix[event][who];
    const nextList = current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel];
    const next = { ...matrix, [event]: { ...matrix[event], [who]: nextList } };
    const previous = matrix;
    setMatrix(next);
    try {
      await api.put.updateAppointmentSettings({ notifications: next });
    } catch (error) {
      setMatrix(previous);
      fail("Couldn’t save the notification choice", error);
    }
  };

  const pv = preview(selected, settings.replyDeadlineHours);
  const nowChannels = useMemo(
    () =>
      NOTIFICATION_AUDIENCES.filter((a) => matrix[selected][a.key].length)
        .map((a) => `${a.short}: ${matrix[selected][a.key].map((c) => CHANNELS.find((x) => x.key === c)?.label).join(", ")}`)
        .join(" · "),
    [matrix, selected]
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading title="Appointment settings" subtitle="Booking reasons, rules and who gets notified." />

      {data.settingsMissing && tab !== "reasons" && (
        <InlineAlert tone="warning" title="Showing the default rules">
          The saved settings couldn’t be loaded, so these are the defaults. Changes may not save until the server is updated.
        </InlineAlert>
      )}

      <PillTabs
        ariaLabel="Settings sections"
        value={tab}
        onChange={setTab}
        className="self-start"
        tabs={[
          { key: "reasons", label: "Booking reasons" },
          { key: "rules", label: "Booking rules" },
          { key: "notif", label: "Notifications" },
        ]}
      />

      {tab === "reasons" && (
        <section className="overflow-hidden rounded-xl border border-lightGray bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-primary">Booking reasons</h2>
              <p className="text-sm text-[#4B5563]">Members pick one on step 1 of booking. Order here is the order they see.</p>
            </div>
            {isAdmin && (
              <UiButton
                tone="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setReasonErrors([]);
                  setReasonDialog({ id: null, label: "", description: "" });
                }}
              >
                Add reason
              </UiButton>
            )}
          </div>
          {reasons.map((reason, index) => (
            <div
              key={reason.id}
              className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-3 last:border-b-0"
              style={{ opacity: reason.is_active ? 1 : 0.6 }}
            >
              {isAdmin && (
                <div className="flex flex-col gap-0.5">
                  {[
                    { dir: -1 as const, label: "Move up", glyph: "↑", disabled: index === 0 },
                    { dir: 1 as const, label: "Move down", glyph: "↓", disabled: index === reasons.length - 1 },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      aria-label={`${b.label}: ${reason.label}`}
                      disabled={b.disabled}
                      onClick={() => move(index, b.dir)}
                      className="h-6 w-8 rounded-md border border-lightGray bg-white text-primary disabled:opacity-40"
                    >
                      {b.glyph}
                    </button>
                  ))}
                </div>
              )}
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="text-sm font-semibold text-primary">{reason.label}</p>
                {reason.description && <p className="text-sm text-[#6B7280]">{reason.description}</p>}
              </div>
              <span className="text-xs text-[#6B7280]">{plural(usesOf(reason), "booking")}</span>
              {isAdmin && (
                <>
                  <ToggleSwitch
                    on={reason.is_active}
                    onChange={(next) => setActive(reason, next)}
                    label={`Show ${reason.label} to members`}
                  />
                  <div className="flex gap-1">
                    <UiButton
                      size="sm"
                      onClick={() => {
                        setReasonErrors([]);
                        setReasonDialog({ id: reason.id, label: reason.label, description: reason.description ?? "" });
                      }}
                    >
                      Edit
                    </UiButton>
                    <UiButton size="sm" tone="ghost" className="text-[#B91C1C] hover:text-[#B91C1C]" onClick={() => remove(reason)}>
                      Delete
                    </UiButton>
                  </div>
                </>
              )}
            </div>
          ))}
          {!reasons.length && (
            <p className="px-5 py-6 text-sm text-[#6B7280]">
              {reasonsQuery.data ? "No reasons yet. Members will only see “Something else”." : "Loading reasons…"}
            </p>
          )}
        </section>
      )}

      {tab === "rules" && (
        <section className="flex max-w-[880px] flex-col gap-5 rounded-xl border border-lightGray bg-white p-5">
          {RULES.map((rule) => (
            <div
              key={rule.key}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#E5E7EB] pb-4"
            >
              <div className="min-w-0 flex-[1_1_300px]">
                <p className="text-sm font-semibold text-primary">{rule.label}</p>
                <p className="text-sm text-[#6B7280]">{rule.help}</p>
              </div>
              <SelectInput
                aria-label={rule.label}
                disabled={!isAdmin}
                value={String(draft[rule.key] ?? settings[rule.key])}
                onChange={(e) => setDraft({ ...draft, [rule.key]: Number(e.target.value) })}
                options={
                  rule.options.some((o) => o.value === String(settings[rule.key]))
                    ? rule.options
                    : [...rule.options, H(settings[rule.key], String(settings[rule.key]))]
                }
                className="w-full sm:w-[220px]"
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="flex-1 text-xs text-[#6B7280]">Changes apply to new requests.</span>
            {dirty && (
              <>
                <UiButton tone="ghost" className="text-primary" onClick={() => setDraft({})} disabled={busy}>
                  Discard
                </UiButton>
                <UiButton tone="primary" onClick={saveRules} disabled={busy}>
                  {busy ? "Saving…" : "Save rules"}
                </UiButton>
              </>
            )}
          </div>
        </section>
      )}

      {tab === "notif" && (
        <div className="flex flex-wrap items-start gap-6">
          <section className="min-w-0 flex-[1_1_560px] overflow-hidden rounded-xl border border-lightGray bg-white">
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <h2 className="text-base font-semibold text-primary">Who hears about what</h2>
              <p className="text-sm text-[#4B5563]">Pick channels for each event. Select a row to preview it.</p>
            </div>
            {NOTIFICATION_EVENTS.map((event) => (
              <div
                key={event.key}
                onClick={() => setSelected(event.key)}
                className={`flex cursor-pointer flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 last:border-b-0 ${
                  selected === event.key ? "bg-[#F8F9FC]" : "bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-primary">{event.label}</p>
                  <p className="text-xs text-[#6B7280]">{event.when}</p>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3">
                  {NOTIFICATION_AUDIENCES.map((who) => (
                    <div key={who.key} className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-[#6B7280]">{who.label}</span>
                      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                        {CHANNELS.map((channel) => {
                          const on = matrix[event.key][who.key].includes(channel.key);
                          return isAdmin ? (
                            <ChipToggle key={channel.key} on={on} onClick={() => toggleChannel(event.key, who.key, channel.key)}>
                              <span className="sr-only">{on ? "Turn off " : "Turn on "}</span>
                              {channel.label}
                              <span className="sr-only">{` for ${who.label}, ${event.label}`}</span>
                            </ChipToggle>
                          ) : on ? (
                            <span key={channel.key} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                              {channel.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="flex w-full min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-xl border border-lightGray bg-white p-5 xl:sticky xl:top-4 xl:max-w-[400px]">
            <h2 className="text-base font-semibold text-primary">What {pv.who} sees</h2>
            <p className="text-xs text-[#6B7280]">
              {NOTIFICATION_EVENTS.find((e) => e.key === selected)?.label}
              {nowChannels ? ` · ${nowChannels}` : " · nobody is notified"}
            </p>
            <div className="flex flex-col gap-3 rounded-2xl bg-[#F3F5FA] p-4">
              <p className="text-xs font-semibold text-[#6B7280]">PUSH · LOCK SCREEN</p>
              <div className="flex gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white">
                  W
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{pv.title}</p>
                  <p className="text-sm text-[#4B5563]">{pv.body}</p>
                  {pv.acts.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {pv.acts.map((a) => (
                        <span key={a} className="flex-1 rounded-lg bg-[#F3F4F6] px-2 py-1.5 text-center text-xs font-semibold text-primary">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold text-[#6B7280]">SMS</p>
              <p className="max-w-[95%] self-start rounded-2xl rounded-bl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-primary">
                {pv.sms}
              </p>
            </div>
            <p className="text-xs text-[#6B7280]">
              Push buttons work from the lock screen. Every SMS links to the request so they can reply without opening the app first.
            </p>
          </aside>
        </div>
      )}

      {reasonDialog && (
        <CommDialog
          open
          onClose={() => setReasonDialog(null)}
          busy={busy}
          width={560}
          title={reasonDialog.id ? "Edit reason" : "Add reason"}
          subtitle="Shown on step 1 of the booking form."
          errors={reasonErrors}
          buttons={[
            { label: "Cancel", onClick: () => setReasonDialog(null) },
            { label: reasonDialog.id ? "Save changes" : "Add reason", onClick: saveReason, tone: "primary" },
          ]}
        >
          <Field label="Label *">
            <TextInput
              value={reasonDialog.label}
              onChange={(e) => setReasonDialog({ ...reasonDialog, label: e.target.value })}
              placeholder="Marriage and family"
              maxLength={120}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <Field label="Description">
              <TextArea
                value={reasonDialog.description}
                onChange={(e) => setReasonDialog({ ...reasonDialog, description: e.target.value })}
                placeholder="Shown under the label to help members choose"
                maxLength={255}
              />
            </Field>
            <FieldHint>{reasonDialog.description.length} / 255</FieldHint>
          </div>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default AppointmentSettings;
