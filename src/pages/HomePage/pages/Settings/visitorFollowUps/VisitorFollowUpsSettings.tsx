import { useCallback, useEffect, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { api } from "@/utils/api/apiCalls";

import { ToggleSwitch } from "../../ChurchCommunication/ui/commUi";
import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../general/generalUi";
import { selectClass } from "../general/generalModel";

const MIN = 1;
const MAX = 31;

const VisitorFollowUpsSettings = () => {
  const { canManage } = useAccessControl();
  const canEdit = canManage("Settings");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [perMonth, setPerMonth] = useState("1");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await api.fetch.fetchVisitorFollowUpConfig();
      setPerMonth(String(response.data?.follow_ups_per_month ?? 1));
      setEnabled(Boolean(response.data?.enabled));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const count = Number(perMonth);
  const valid = Number.isInteger(count) && count >= MIN && count <= MAX;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const response = await api.post.upsertVisitorFollowUpConfig({
        follow_ups_per_month: count,
        enabled,
      });
      if (response.data) {
        setPerMonth(String(response.data.follow_ups_per_month));
        setEnabled(response.data.enabled);
      }
      notify.success({
        title: "Settings saved",
        message: "Visitor follow-up settings are live.",
      });
    } catch {
      // The API error handler already raised a toast.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <SectionTitle
        title="Visitor follow-ups"
        text="Set how many follow-ups each visitor gets every month."
      />
      {status === "error" ? (
        <LoadFailed what="visitor follow-up settings" onRetry={() => void load()} />
      ) : status === "loading" ? (
        <RowsSkeleton rows={2} />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-primary">Auto-generate monthly follow-ups</span>
              <span className="text-xs text-gray-500">
                When on, follow-ups are created for visitors automatically each month.
              </span>
            </div>
            <ToggleSwitch
              on={enabled}
              onChange={setEnabled}
              label="Auto-generate monthly follow-ups"
              disabled={!canEdit || saving}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <label htmlFor="follow-ups-per-month" className="text-sm font-medium text-primary">
                Follow-ups per month
              </label>
              <span className="text-xs text-gray-500">
                Between {MIN} and {MAX}.
              </span>
              {!valid && (
                <span className="text-xs text-red-600">
                  Enter a whole number from {MIN} to {MAX}.
                </span>
              )}
            </div>
            <input
              id="follow-ups-per-month"
              type="number"
              min={MIN}
              max={MAX}
              value={perMonth}
              onChange={(event) => setPerMonth(event.target.value)}
              disabled={!canEdit || saving}
              className={`${selectClass} w-24`}
            />
          </div>
          {canEdit && (
            <div className="flex justify-end border-t border-gray-200 bg-inputBackground px-4 py-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!valid || saving}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default VisitorFollowUpsSettings;
