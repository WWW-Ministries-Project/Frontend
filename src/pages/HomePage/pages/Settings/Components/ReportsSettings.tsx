import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import type { EventReportExcludedUser } from "@/utils/api/settings/eventReportExclusionInterfaces";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const buildExcludedUserLabel = (user: EventReportExcludedUser) =>
  user.member_id ? `${user.name} (${user.member_id})` : user.name;

const toSortedIds = (values: string[]) => [...values].sort().join(",");

export function ReportsSettings() {
  const membersOptions = useStore((state) => state.membersOptions);
  const [reloadKey, setReloadKey] = useState(0);
  const [savedUsers, setSavedUsers] = useState<EventReportExcludedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.fetch.fetchEventReportExclusions();
        if (cancelled) {
          return;
        }

        const users = response.data?.users ?? [];
        setSavedUsers(users);
        setSelectedUserIds(users.map((user) => String(user.id)));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            toErrorMessage(loadError, "Unable to load the event report exclusion list.")
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

  // Saved exclusions may sit outside the active branch's member list, so keep
  // them selectable (and labelled) alongside the branch options.
  const memberOptions = useMemo(() => {
    const savedOptions = savedUsers.map((user) => ({
      value: String(user.id),
      label: buildExcludedUserLabel(user),
    }));
    const savedIds = new Set(savedOptions.map((option) => option.value));

    return [
      ...savedOptions,
      ...membersOptions
        .map((member) => ({
          value: String(member.value),
          label: member.label,
        }))
        .filter((option) => !savedIds.has(option.value)),
    ];
  }, [membersOptions, savedUsers]);

  const hasChanges =
    toSortedIds(selectedUserIds) !==
    toSortedIds(savedUsers.map((user) => String(user.id)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await api.post.upsertEventReportExclusions({
        user_ids: selectedUserIds.map(Number),
      });
      const users = response.data?.users ?? [];
      setSavedUsers(users);
      setSelectedUserIds(users.map((user) => String(user.id)));

      showNotification("Event report exclusion list saved.", "success", {
        title: "Reports",
      });
    } catch (saveError) {
      const message = toErrorMessage(
        saveError,
        "Unable to save the event report exclusion list."
      );
      setError(message);
      showNotification(message, "error", { title: "Reports" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="app-card max-w-5xl space-y-4 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">Event Report</h4>
          <p className="text-sm text-primaryGray">
            Members on the exclusion list do not appear in event reports. They
            are left out of department rosters, attendance counts and exported
            summaries.
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
          Loading event report exclusion list...
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-lightGray bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h5 className="text-sm font-semibold text-primary">
                  Exclusion list
                </h5>
                <p className="text-sm text-primaryGray">
                  Select the members to hide from event reports.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {selectedUserIds.length === 0
                  ? "No members excluded"
                  : `${selectedUserIds.length} member${selectedUserIds.length === 1 ? "" : "s"} excluded`}
              </span>
            </div>

            <MultiSelect
              options={memberOptions}
              selectedValues={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Select members to exclude"
              emptyMsg="No members excluded"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end">
            <Button
              value="Save Changes"
              onClick={handleSave}
              disabled={loading || saving || !hasChanges}
              loading={saving}
            />
          </div>
        </>
      )}
    </section>
  );
}
