import { useEffect, useMemo, useState } from "react";

import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  NotificationPreference,
  NotificationPreferenceChannelAvailability,
  UpdateNotificationPreferencePayload,
} from "@/utils/api/notifications/interfaces";

type NotificationPreferenceToggleKey =
  | "inAppEnabled"
  | "emailEnabled"
  | "smsEnabled";

type NotificationChannelControl = {
  label: string;
  availabilityKey: keyof NotificationPreferenceChannelAvailability;
  preferenceKey: NotificationPreferenceToggleKey;
};

type NotificationPreferenceGroup = {
  category: string;
  items: NotificationPreference[];
};

const NOTIFICATION_CHANNEL_CONTROLS: NotificationChannelControl[] = [
  {
    label: "In-app",
    availabilityKey: "inApp",
    preferenceKey: "inAppEnabled",
  },
  {
    label: "Email",
    availabilityKey: "email",
    preferenceKey: "emailEnabled",
  },
  {
    label: "SMS",
    availabilityKey: "sms",
    preferenceKey: "smsEnabled",
  },
];

const DEFAULT_DESCRIPTION = "Manage how you receive this notification.";
const DEFAULT_CATEGORY = "Other";
const DEFAULT_CHANNELS: NotificationPreferenceChannelAvailability = {
  inApp: true,
  email: true,
  sms: true,
};

const humanizeNotificationType = (value: string): string =>
  value
    .split(".")
    .flatMap((segment) => segment.split("_"))
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const normalizeNotificationPreference = (
  entry: NotificationPreference
): NotificationPreference => ({
  type: entry.type,
  title: entry.title?.trim() || humanizeNotificationType(entry.type),
  description: entry.description?.trim() || DEFAULT_DESCRIPTION,
  category: entry.category?.trim() || DEFAULT_CATEGORY,
  availableChannels: {
    inApp: entry.availableChannels?.inApp ?? DEFAULT_CHANNELS.inApp,
    email: entry.availableChannels?.email ?? DEFAULT_CHANNELS.email,
    sms: entry.availableChannels?.sms ?? DEFAULT_CHANNELS.sms,
  },
  inAppEnabled: entry.inAppEnabled !== false,
  emailEnabled: entry.emailEnabled !== false,
  smsEnabled: entry.smsEnabled === true,
  hasStoredPreference: entry.hasStoredPreference === true,
});

const toNotificationPreferenceList = (
  payload: unknown
): NotificationPreference[] => {
  const entries = Array.isArray(payload) ? payload : payload ? [payload] : [];
  return entries
    .filter(
      (entry): entry is NotificationPreference =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as NotificationPreference).type === "string"
    )
    .map((entry) => normalizeNotificationPreference(entry));
};

const toNotificationPreferenceMap = (
  preferences: NotificationPreference[]
): Record<string, NotificationPreference> =>
  preferences.reduce<Record<string, NotificationPreference>>((acc, preference) => {
    acc[preference.type] = preference;
    return acc;
  }, {});

export function NotificationSettings() {
  const [reloadKey, setReloadKey] = useState(0);
  const [preferenceOrder, setPreferenceOrder] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<
    Record<string, NotificationPreference>
  >({});
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [savingPreferenceKeys, setSavingPreferenceKeys] = useState<string[]>(
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      setLoadingPreferences(true);
      setPreferenceError(null);

      try {
        const response = await api.fetch.fetchNotificationPreferences();

        if (cancelled) {
          return;
        }

        const preferenceList = toNotificationPreferenceList(response.data);
        setPreferenceOrder(preferenceList.map((preference) => preference.type));
        setPreferences(toNotificationPreferenceMap(preferenceList));
      } catch (error) {
        if (!cancelled) {
          setPreferenceError(
            error instanceof Error
              ? error.message
              : "Unable to load notification preferences."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPreferences(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const orderedPreferences = useMemo(() => {
    const ordered: NotificationPreference[] = [];
    const seenTypes = new Set<string>();

    preferenceOrder.forEach((type) => {
      const preference = preferences[type];
      if (!preference || seenTypes.has(type)) {
        return;
      }

      ordered.push(preference);
      seenTypes.add(type);
    });

    Object.values(preferences).forEach((preference) => {
      if (seenTypes.has(preference.type)) {
        return;
      }

      ordered.push(preference);
    });

    return ordered;
  }, [preferenceOrder, preferences]);

  const groupedPreferences = useMemo<NotificationPreferenceGroup[]>(() => {
    const grouped = new Map<string, NotificationPreference[]>();

    orderedPreferences.forEach((preference) => {
      const category = preference.category || DEFAULT_CATEGORY;
      const currentGroup = grouped.get(category) || [];
      currentGroup.push(preference);
      grouped.set(category, currentGroup);
    });

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [orderedPreferences]);

  const availableChannelCount = useMemo(
    () =>
      orderedPreferences.reduce(
        (count, preference) =>
          count +
          NOTIFICATION_CHANNEL_CONTROLS.filter(
            (channel) => preference.availableChannels?.[channel.availabilityKey]
          ).length,
        0
      ),
    [orderedPreferences]
  );

  const enabledChannelCount = useMemo(
    () =>
      orderedPreferences.reduce(
        (count, preference) =>
          count +
          NOTIFICATION_CHANNEL_CONTROLS.filter(
            (channel) =>
              preference.availableChannels?.[channel.availabilityKey] &&
              preference[channel.preferenceKey]
          ).length,
        0
      ),
    [orderedPreferences]
  );

  const handleTogglePreference = async (
    notificationType: string,
    preferenceKey: NotificationPreferenceToggleKey,
    nextValue: boolean
  ) => {
    const previousPreference = preferences[notificationType];
    if (!previousPreference) {
      return;
    }

    const savingKey = `${notificationType}:${preferenceKey}`;
    const channelLabel =
      NOTIFICATION_CHANNEL_CONTROLS.find(
        (channel) => channel.preferenceKey === preferenceKey
      )?.label || "Notification";
    const payload: UpdateNotificationPreferencePayload = {
      [preferenceKey]: nextValue,
    };

    setPreferenceError(null);
    setSavingPreferenceKeys((current) =>
      current.includes(savingKey) ? current : [...current, savingKey]
    );
    setPreferences((current) => ({
      ...current,
      [notificationType]: {
        ...previousPreference,
        [preferenceKey]: nextValue,
      },
    }));

    try {
      const response = await api.put.updateNotificationPreference(
        notificationType,
        payload
      );
      const [updatedPreference] = toNotificationPreferenceList(response.data);

      setPreferences((current) => ({
        ...current,
        [notificationType]: updatedPreference || {
          ...previousPreference,
          [preferenceKey]: nextValue,
          hasStoredPreference: true,
        },
      }));

      showNotification(
        `${channelLabel} notifications ${
          nextValue ? "enabled" : "disabled"
        } for ${previousPreference.title || humanizeNotificationType(notificationType)}.`,
        "success",
        { title: "Notifications" }
      );
    } catch (error) {
      setPreferences((current) => ({
        ...current,
        [notificationType]: previousPreference,
      }));

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update notification preference.";

      setPreferenceError(message);
      showNotification(message, "error", { title: "Notifications" });
    } finally {
      setSavingPreferenceKeys((current) =>
        current.filter((key) => key !== savingKey)
      );
    }
  };

  return (
    <section className="app-card max-w-5xl space-y-5 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            Notification preferences
          </h4>
          <p className="text-sm text-primaryGray">
            Control how each notification type is delivered across in-app,
            email, and SMS channels.
          </p>
          <p className="text-xs text-primaryGray">
            SMS delivery depends on your saved phone number and server-side SMS
            availability. Some notification types are only available on
            specific channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-lightGray bg-white px-3 py-1 text-xs font-medium text-primaryGray">
            {enabledChannelCount} of {availableChannelCount} routes enabled
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="rounded-md border border-lightGray px-3 py-1.5 text-xs font-medium text-primary hover:bg-lightGray"
          >
            Refresh
          </button>
        </div>
      </div>

      {preferenceError && (
        <div className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-sm text-error">
          {preferenceError}
        </div>
      )}

      {loadingPreferences ? (
        <div className="rounded-md border border-dashed border-lightGray bg-white px-4 py-6 text-sm text-primaryGray">
          Loading notification preferences...
        </div>
      ) : groupedPreferences.length === 0 ? (
        <div className="rounded-md border border-dashed border-lightGray bg-white px-4 py-6 text-sm text-primaryGray">
          No notification preferences are available yet.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedPreferences.map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h5 className="text-sm font-semibold uppercase tracking-wide text-primaryGray">
                  {group.category}
                </h5>
                <span className="rounded-full border border-lightGray bg-white px-3 py-1 text-[11px] font-medium text-primaryGray">
                  {group.items.length} types
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((preference) => (
                  <div
                    key={preference.type}
                    className="flex flex-col gap-4 rounded-lg border border-lightGray bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h6 className="text-sm font-semibold text-primary">
                          {preference.title}
                        </h6>
                        <span className="rounded-full bg-lightGray px-2 py-1 text-[11px] font-medium text-primaryGray">
                          {preference.hasStoredPreference
                            ? "Customized"
                            : "Default"}
                        </span>
                      </div>
                      <p className="text-xs text-primaryGray">
                        {preference.description}
                      </p>
                      <p className="text-[11px] text-primaryGray/80">
                        {preference.type}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {NOTIFICATION_CHANNEL_CONTROLS.filter(
                        (channel) =>
                          preference.availableChannels?.[channel.availabilityKey]
                      ).map((channel) => {
                        const enabled = preference[channel.preferenceKey];
                        const saving = savingPreferenceKeys.includes(
                          `${preference.type}:${channel.preferenceKey}`
                        );

                        return (
                          <button
                            key={`${preference.type}:${channel.preferenceKey}`}
                            type="button"
                            onClick={() => {
                              void handleTogglePreference(
                                preference.type,
                                channel.preferenceKey,
                                !enabled
                              );
                            }}
                            disabled={saving}
                            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              enabled
                                ? "border-primary bg-primary text-white"
                                : "border-lightGray bg-white text-primary hover:bg-lightGray"
                            }`}
                          >
                            {saving
                              ? `${channel.label}...`
                              : `${channel.label} ${enabled ? "on" : "off"}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
