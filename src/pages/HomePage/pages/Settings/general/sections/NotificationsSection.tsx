import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { ToggleSwitch } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import { api } from "@/utils/api/apiCalls";
import type {
  NotificationPreference,
  NotificationPreferenceChannelAvailability,
} from "@/utils/api/notifications/interfaces";

import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";

type PrefKey = "inAppEnabled" | "emailEnabled" | "smsEnabled";

const CHANNELS: { label: string; available: keyof NotificationPreferenceChannelAvailability; key: PrefKey }[] = [
  { label: "In-app", available: "inApp", key: "inAppEnabled" },
  { label: "Email", available: "email", key: "emailEnabled" },
  { label: "SMS", available: "sms", key: "smsEnabled" },
];

const humanize = (type: string) =>
  type
    .split(/[._]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normalize = (entry: NotificationPreference): NotificationPreference => ({
  ...entry,
  title: entry.title?.trim() || humanize(entry.type),
  description: entry.description?.trim() || "",
  category: entry.category?.trim() || "Other",
  availableChannels: {
    inApp: entry.availableChannels?.inApp ?? true,
    email: entry.availableChannels?.email ?? true,
    sms: entry.availableChannels?.sms ?? true,
  },
  inAppEnabled: entry.inAppEnabled !== false,
  emailEnabled: entry.emailEnabled !== false,
  smsEnabled: entry.smsEnabled === true,
});

const toList = (payload: unknown): NotificationPreference[] =>
  (Array.isArray(payload) ? payload : payload ? [payload] : [])
    .filter(
      (entry): entry is NotificationPreference =>
        !!entry && typeof entry === "object" && typeof (entry as NotificationPreference).type === "string"
    )
    .map(normalize);

const COLS = "grid grid-cols-[minmax(0,1fr)_52px_52px_52px] tablet:grid-cols-[minmax(0,1fr)_88px_88px_88px]";

/** The signed-in user's own alert preferences. Each switch saves at once. */
export const NotificationsSection = () => {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await api.fetch.fetchNotificationPreferences();
      setPrefs(toList(response.data));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, NotificationPreference[]>();
    prefs.forEach((pref) => {
      const category = pref.category || "Other";
      map.set(category, [...(map.get(category) ?? []), pref]);
    });
    return Array.from(map.entries());
  }, [prefs]);

  const toggle = async (pref: NotificationPreference, channel: (typeof CHANNELS)[number], next: boolean) => {
    const busyKey = `${pref.type}:${channel.key}`;
    const patch = (value: boolean) =>
      setPrefs((current) => current.map((item) => (item.type === pref.type ? { ...item, [channel.key]: value } : item)));
    setBusy((current) => [...current, busyKey]);
    patch(next);
    try {
      const response = await api.put.updateNotificationPreference(pref.type, { [channel.key]: next });
      const [updated] = toList(response.data);
      if (updated) setPrefs((current) => current.map((item) => (item.type === pref.type ? updated : item)));
      notify.success({
        title: "Notification updated",
        message: `${pref.title} by ${channel.label} is ${next ? "on" : "off"}.`,
      });
    } catch {
      patch(!next);
    } finally {
      setBusy((current) => current.filter((key) => key !== busyKey));
    }
  };

  return (
    <>
      <SectionTitle
        title="Notifications"
        text="How each alert reaches you. Changes save straight away. SMS needs a saved phone number."
      />
      {status === "loading" ? (
        <RowsSkeleton rows={6} />
      ) : status === "error" ? (
        <LoadFailed what="your notification settings" onRetry={() => void load()} />
      ) : !prefs.length ? (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
          No notifications to set up yet.
        </p>
      ) : (
        <Card>
          <div className={`${COLS} items-center bg-lightGray text-sm font-semibold text-primary`}>
            <span className="px-4 py-3">Notification</span>
            {CHANNELS.map((channel) => (
              <span key={channel.key} className="py-3 text-center">
                {channel.label}
              </span>
            ))}
          </div>
          {groups.map(([category, items]) => (
            <Fragment key={category}>
              <p className="border-b border-gray-200 bg-inputBackground px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-gray-500">
                {category}
              </p>
              {items.map((pref) => (
                <div key={pref.type} className={`${COLS} min-h-16 items-center border-b border-gray-200 last:border-b-0`}>
                  <div className="flex min-w-0 flex-col px-4 py-3">
                    <span className="text-sm font-medium text-primary">{pref.title}</span>
                    {pref.description && <span className="text-xs text-gray-500">{pref.description}</span>}
                  </div>
                  {CHANNELS.map((channel) => (
                    <span key={channel.key} className="flex justify-center">
                      {pref.availableChannels?.[channel.available] ? (
                        <ToggleSwitch
                          on={!!pref[channel.key]}
                          label={`${pref.title} by ${channel.label}`}
                          disabled={busy.includes(`${pref.type}:${channel.key}`)}
                          onChange={(next) => void toggle(pref, channel, next)}
                        />
                      ) : (
                        <span title="Not available" className="text-gray-500">
                          —
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </Fragment>
          ))}
        </Card>
      )}
    </>
  );
};
