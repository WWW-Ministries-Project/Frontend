import { useEffect, useMemo, useState } from "react";

import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { NotificationPreference } from "@/utils/api/notifications/interfaces";

type SmsPreferenceOption = {
  type: string;
  title: string;
  description: string;
};

const SMS_NOTIFICATION_OPTIONS: SmsPreferenceOption[] = [
  {
    type: "order.payment_success",
    title: "Successful payments",
    description: "Receive a text when your marketplace payment succeeds.",
  },
  {
    type: "order.payment_failed",
    title: "Failed payments",
    description:
      "Receive a text when a marketplace payment fails so you can retry quickly.",
  },
  {
    type: "follow_up.assigned",
    title: "Follow-up assignments",
    description: "Receive a text when a visitor follow-up is assigned to you.",
  },
];

const toNotificationPreferenceMap = (
  payload: unknown
): Record<string, NotificationPreference> => {
  const entries = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const normalized = entries.filter(
    (entry): entry is NotificationPreference =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as NotificationPreference).type === "string"
  );

  return normalized.reduce<Record<string, NotificationPreference>>(
    (acc, entry) => {
      acc[entry.type] = {
        type: entry.type,
        inAppEnabled: entry.inAppEnabled !== false,
        emailEnabled: entry.emailEnabled !== false,
        smsEnabled: entry.smsEnabled === true,
        hasStoredPreference: entry.hasStoredPreference,
      };
      return acc;
    },
    {}
  );
};

const createDefaultSmsPreferences = (): Record<string, NotificationPreference> =>
  SMS_NOTIFICATION_OPTIONS.reduce<Record<string, NotificationPreference>>(
    (acc, option) => {
      acc[option.type] = {
        type: option.type,
        inAppEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        hasStoredPreference: false,
      };
      return acc;
    },
    {}
  );

export function NotificationSettings() {
  const [reloadKey, setReloadKey] = useState(0);
  const [smsPreferences, setSmsPreferences] = useState<
    Record<string, NotificationPreference>
  >(() => createDefaultSmsPreferences());
  const [loadingSmsPreferences, setLoadingSmsPreferences] = useState(true);
  const [smsPreferenceError, setSmsPreferenceError] = useState<string | null>(
    null
  );
  const [savingSmsPreferenceTypes, setSavingSmsPreferenceTypes] = useState<
    string[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    const loadSmsPreferences = async () => {
      setLoadingSmsPreferences(true);
      setSmsPreferenceError(null);

      try {
        const response = await api.fetch.fetchNotificationPreferences({
          types: SMS_NOTIFICATION_OPTIONS.map((option) => option.type).join(","),
        });

        if (cancelled) {
          return;
        }

        setSmsPreferences({
          ...createDefaultSmsPreferences(),
          ...toNotificationPreferenceMap(response.data),
        });
      } catch (error) {
        if (!cancelled) {
          setSmsPreferenceError(
            error instanceof Error
              ? error.message
              : "Unable to load SMS notification preferences."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSmsPreferences(false);
        }
      }
    };

    void loadSmsPreferences();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const enabledSmsCount = useMemo(
    () =>
      Object.values(smsPreferences).filter(
        (preference) => preference.smsEnabled === true
      ).length,
    [smsPreferences]
  );

  const handleToggleSmsPreference = async (
    notificationType: string,
    nextValue: boolean
  ) => {
    const previousPreference = smsPreferences[notificationType] || {
      type: notificationType,
      inAppEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
    };

    setSmsPreferenceError(null);
    setSavingSmsPreferenceTypes((current) =>
      current.includes(notificationType)
        ? current
        : [...current, notificationType]
    );
    setSmsPreferences((current) => ({
      ...current,
      [notificationType]: {
        ...previousPreference,
        smsEnabled: nextValue,
      },
    }));

    try {
      const response = await api.put.updateNotificationPreference(
        notificationType,
        {
          smsEnabled: nextValue,
        }
      );

      const updatedPreference =
        toNotificationPreferenceMap(response.data)[notificationType];

      setSmsPreferences((current) => ({
        ...current,
        [notificationType]: updatedPreference || {
          ...previousPreference,
          smsEnabled: nextValue,
          hasStoredPreference: true,
        },
      }));

      showNotification(
        nextValue ? "SMS alert enabled." : "SMS alert disabled.",
        "success",
        { title: "Notifications" }
      );
    } catch (error) {
      setSmsPreferences((current) => ({
        ...current,
        [notificationType]: previousPreference,
      }));

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update SMS notification preference.";

      setSmsPreferenceError(message);
      showNotification(message, "error", { title: "Notifications" });
    } finally {
      setSavingSmsPreferenceTypes((current) =>
        current.filter((type) => type !== notificationType)
      );
    }
  };

  return (
    <section className="app-card max-w-3xl space-y-4 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            SMS notifications
          </h4>
          <p className="text-sm text-primaryGray">
            Manage which eligible alerts can be sent to your phone. Hubtel
            credentials remain server-managed and are not configured here.
          </p>
          <p className="text-xs text-primaryGray">
            SMS delivery depends on your saved phone number and server-side SMS
            availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-lightGray bg-white px-3 py-1 text-xs font-medium text-primaryGray">
            {enabledSmsCount} of {SMS_NOTIFICATION_OPTIONS.length} enabled
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

      {smsPreferenceError && (
        <div className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-sm text-error">
          {smsPreferenceError}
        </div>
      )}

      {loadingSmsPreferences ? (
        <div className="rounded-md border border-dashed border-lightGray bg-white px-4 py-6 text-sm text-primaryGray">
          Loading notification preferences...
        </div>
      ) : (
        <div className="space-y-3">
          {SMS_NOTIFICATION_OPTIONS.map((option) => {
            const preference = smsPreferences[option.type];
            const smsEnabled = preference?.smsEnabled === true;
            const saving = savingSmsPreferenceTypes.includes(option.type);

            return (
              <div
                key={option.type}
                className="flex flex-col gap-3 rounded-lg border border-lightGray bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-primary">
                    {option.title}
                  </h5>
                  <p className="text-xs text-primaryGray">
                    {option.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      smsEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-lightGray text-primaryGray"
                    }`}
                  >
                    {smsEnabled ? "SMS on" : "SMS off"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleToggleSmsPreference(option.type, !smsEnabled);
                    }}
                    disabled={saving}
                    className="rounded-md border border-lightGray px-3 py-1.5 text-xs font-medium text-primary hover:bg-lightGray disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : smsEnabled ? "Turn off" : "Turn on"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
