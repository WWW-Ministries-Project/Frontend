import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  SystemNotificationAdminCandidate,
  SystemNotificationSettingsConfig,
} from "@/utils/api/settings/systemNotificationInterfaces";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const formatUpdatedAt = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsed));
};

const buildCandidateLabel = (candidate: SystemNotificationAdminCandidate) => {
  const accessLevelName = candidate.access_level_name?.trim() || "Admin";
  const email = candidate.email?.trim();

  return email
    ? `${candidate.name} (${accessLevelName}) - ${email}`
    : `${candidate.name} (${accessLevelName})`;
};

export function LogsSettings() {
  const [reloadKey, setReloadKey] = useState(0);
  const [config, setConfig] = useState<SystemNotificationSettingsConfig | null>(
    null
  );
  const [adminCandidates, setAdminCandidates] = useState<
    SystemNotificationAdminCandidate[]
  >([]);
  const [selectedRecipientUserId, setSelectedRecipientUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [configResponse, adminsResponse] = await Promise.all([
          api.fetch.fetchSystemNotificationConfig(),
          api.fetch.fetchSystemNotificationAdmins(),
        ]);

        if (cancelled) {
          return;
        }

        const nextConfig = configResponse.data;
        const nextCandidates = Array.isArray(adminsResponse.data)
          ? adminsResponse.data
          : [];
        const configuredRecipient = nextConfig?.system_failure_recipient;
        const mergedCandidates = configuredRecipient
          ? [
              configuredRecipient,
              ...nextCandidates.filter(
                (candidate) => candidate.id !== configuredRecipient.id
              ),
            ]
          : nextCandidates;

        setConfig(nextConfig);
        setAdminCandidates(mergedCandidates);
        setSelectedRecipientUserId(
          nextConfig?.system_failure_recipient_user_id
            ? String(nextConfig.system_failure_recipient_user_id)
            : ""
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            toErrorMessage(
              loadError,
              "Unable to load log notification settings."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const currentRecipientUserId = config?.system_failure_recipient_user_id
    ? String(config.system_failure_recipient_user_id)
    : "";
  const hasSelectionChanged =
    selectedRecipientUserId.trim() !== currentRecipientUserId.trim();

  const adminOptions = useMemo(
    () =>
      adminCandidates.map((candidate) => ({
        value: String(candidate.id),
        label: buildCandidateLabel(candidate),
      })),
    [adminCandidates]
  );

  const configuredRecipient = config?.system_failure_recipient || null;
  const pendingRecipient =
    adminCandidates.find(
      (candidate) => String(candidate.id) === selectedRecipientUserId
    ) || null;
  const formattedUpdatedAt = formatUpdatedAt(config?.updated_at);

  const handleSave = async () => {
    if (!selectedRecipientUserId) {
      const message =
        "Select an admin to receive system failure notifications.";
      setError(message);
      showNotification(message, "error", { title: "Logs" });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.post.upsertSystemNotificationConfig({
        system_failure_recipient_user_id: Number(selectedRecipientUserId),
      });

      const nextConfig = response.data;
      setConfig(nextConfig);
      setSelectedRecipientUserId(
        nextConfig?.system_failure_recipient_user_id
          ? String(nextConfig.system_failure_recipient_user_id)
          : ""
      );

      showNotification(
        "System failure notification recipient saved.",
        "success",
        { title: "Logs" }
      );
    } catch (saveError) {
      const message = toErrorMessage(
        saveError,
        "Unable to save log notification settings."
      );
      setError(message);
      showNotification(message, "error", { title: "Logs" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="app-card max-w-3xl space-y-4 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            System failure notifications
          </h4>
          <p className="text-sm text-primaryGray">
            Choose which admin receives system-level failure alerts, including
            job failures and related backend notification errors.
          </p>
        </div>

        <Button
          value="Refresh"
          variant="secondary"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading || saving}
        />
      </div>

      {error && (
        <div className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-dashed border-lightGray bg-white px-4 py-6 text-sm text-primaryGray">
          Loading log notification settings...
        </div>
      ) : (
        <>
          {!currentRecipientUserId && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-primary">
              No admin is currently selected. Until you save one, the backend
              will keep using its default admin fallback for system failures.
            </div>
          )}

          <div className="space-y-4">
            <SelectField
              id="system_failure_recipient_user_id"
              label="Notify this admin"
              placeholder={
                adminOptions.length
                  ? "Select an admin"
                  : "No active admin accounts available"
              }
              value={selectedRecipientUserId}
              options={adminOptions}
              searchable
              disabled={!adminOptions.length || saving}
              helperText="Only active admin accounts are listed here."
              onChange={(_, value) => setSelectedRecipientUserId(String(value))}
            />

            {configuredRecipient && (
              <div className="rounded-lg border border-lightGray bg-white px-4 py-3">
                <h5 className="text-sm font-semibold text-primary">
                  Current recipient
                </h5>
                <p className="mt-1 text-sm text-primaryGray">
                  {buildCandidateLabel(configuredRecipient)}
                </p>
                {(config?.updated_by || formattedUpdatedAt) && (
                  <p className="mt-2 text-xs text-primaryGray">
                    {config?.updated_by
                      ? `Updated by ${config.updated_by.name}`
                      : "Updated"}
                    {formattedUpdatedAt ? ` on ${formattedUpdatedAt}` : ""}
                  </p>
                )}
              </div>
            )}

            {pendingRecipient &&
              selectedRecipientUserId &&
              selectedRecipientUserId !== currentRecipientUserId && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  Next recipient: {buildCandidateLabel(pendingRecipient)}
                </div>
              )}

            <div className="flex justify-end">
              <Button
                value="Save Changes"
                onClick={handleSave}
                disabled={
                  saving ||
                  loading ||
                  !adminOptions.length ||
                  !selectedRecipientUserId ||
                  !hasSelectionChanged
                }
                loading={saving}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
