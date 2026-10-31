import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthWrapper";
import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";

import {
  AttendanceRecord,
  fmtDate,
  nf,
  Occurrence,
  occurrenceLabel,
  t12,
  totalsOf,
} from "../utils/attendanceModel";

type CountKey =
  | "adultMale"
  | "adultFemale"
  | "youthMale"
  | "youthFemale"
  | "childrenMale"
  | "childrenFemale";

const ROWS: [string, CountKey, CountKey][] = [
  ["Adults", "adultMale", "adultFemale"],
  ["Youth", "youthMale", "youthFemale"],
  ["Children", "childrenMale", "childrenFemale"],
];

const EMPTY: Record<CountKey, string> = {
  adultMale: "",
  adultFemale: "",
  youthMale: "",
  youthFemale: "",
  childrenMale: "",
  childrenFemale: "",
};

const GRID = "grid grid-cols-[minmax(100px,1.2fr)_1fr_1fr_minmax(64px,0.6fr)] items-center gap-3 px-4 py-3";
const INPUT =
  "h-10 w-full min-w-0 rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgb(var(--color-shadow)_/_0.08)]";

const num = (value: string) => Math.max(0, parseInt(value, 10) || 0);

export interface RecordTarget {
  /** Existing record to edit. */
  record?: AttendanceRecord;
  /** Occurrence to preselect when recording a new headcount. */
  eventId?: string;
}

export const RecordAttendanceDialog = ({
  target,
  onClose,
  onSaved,
  options,
  byId,
  usualFor,
}: {
  target: RecordTarget | null;
  onClose: () => void;
  onSaved: () => void;
  /** Occurrences that can still be recorded, most recent first. */
  options: Occurrence[];
  byId: Map<string, Occurrence>;
  usualFor: (occ: Occurrence) => number;
}) => {
  const { user } = useAuth();
  const editing = target?.record;
  const [eventId, setEventId] = useState("");
  const [counts, setCounts] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setError("");
    setSaving(false);
    if (target.record) {
      const r = target.record;
      setEventId(r.eventId);
      setCounts({
        adultMale: String(r.adultMale),
        adultFemale: String(r.adultFemale),
        youthMale: String(r.youthMale),
        youthFemale: String(r.youthFemale),
        childrenMale: String(r.childrenMale),
        childrenFemale: String(r.childrenFemale),
      });
    } else {
      setEventId(target.eventId || "");
      setCounts(EMPTY);
    }
  }, [target]);

  const occ = byId.get(eventId);
  const date = editing?.date || occ?.date || "";
  const members = (Object.keys(counts) as CountKey[]).reduce((sum, key) => sum + num(counts[key]), 0);
  const editingTotals = editing ? totalsOf(editing) : null;
  const visitors = editingTotals ? editingTotals.vis + editingTotals.cl : 0;
  const total = members + visitors;
  const usual = occ ? usualFor(occ) : 0;
  const deviation = usual && members ? ((total - usual) * 100) / usual : 0;

  const selectOptions = useMemo(() => {
    if (editing) {
      const label = occ ? occurrenceLabel(occ) : `${editing.eventName || "Event"} · ${fmtDate(editing.date)}`;
      return [{ value: editing.eventId, label }];
    }
    return [
      { value: "", label: "Select a service" },
      ...options.slice(0, 60).map((option) => ({ value: option.id, label: occurrenceLabel(option) })),
    ];
  }, [editing, occ, options]);

  const save = async () => {
    if (!eventId || !date) {
      setError("Choose the service you are recording.");
      return;
    }
    if (!members) {
      setError("Enter at least one headcount before saving.");
      return;
    }
    const payload = Object.fromEntries(
      (Object.keys(counts) as CountKey[]).map((key) => [key, num(counts[key])])
    );
    setSaving(true);
    try {
      if (editing) {
        await api.put.updateChurchAttendance(payload, { id: editing.id });
        showNotification("Attendance updated.", "success", "Attendance");
      } else {
        await api.post.recordChurchAttendance({
          ...payload,
          eventId,
          date,
          recordedBy: user.id,
          recordedByName: user.name,
        });
        showNotification(
          `Attendance recorded for ${occ?.name || "the service"}, ${fmtDate(date)}.`,
          "success",
          "Attendance"
        );
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const title = editing ? "Edit attendance" : "Record attendance";

  return (
    <Modal
      open={Boolean(target)}
      onClose={() => {
        if (!saving) onClose();
      }}
      persist={false}
      title={title}
      description="Enter headcounts for members."
      className="max-w-[672px] overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-1 border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
          <p className="text-sm text-gray-600">
            Enter headcounts for members. Visitors are added from visitor registrations.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">Service *</span>
              <select
                value={eventId}
                onChange={(event) => {
                  setEventId(event.target.value);
                  setError("");
                }}
                disabled={Boolean(editing)}
                className="h-10 w-full rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary disabled:bg-gray-50"
              >
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">Attendance date</span>
              <input
                type="text"
                readOnly
                value={date ? `${fmtDate(date)}${occ?.time ? ` · ${t12(occ.time)}` : ""}` : "Select a service first"}
                className="h-10 w-full rounded-lg border border-gray-500/35 bg-gray-50 px-3 text-sm text-gray-600"
              />
              <span className="text-xs text-gray-500">Filled from the selected service.</span>
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-lightGray">
            <div className={`${GRID} bg-lightGray text-sm font-semibold text-primary`}>
              <span>Group</span>
              <span>Male</span>
              <span>Female</span>
              <span className="text-right">Total</span>
            </div>
            {ROWS.map(([label, male, female]) => (
              <div key={label} className={`${GRID} border-b border-gray-200`}>
                <span className="text-sm font-medium text-primary">{label}</span>
                {[male, female].map((key) => (
                  <input
                    key={key}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    aria-label={`${label} ${key === male ? "male" : "female"}`}
                    value={counts[key]}
                    onChange={(event) => {
                      setCounts((current) => ({ ...current, [key]: event.target.value }));
                      setError("");
                    }}
                    className={INPUT}
                  />
                ))}
                <span className="text-right text-sm font-semibold text-primary">
                  {nf(num(counts[male]) + num(counts[female]))}
                </span>
              </div>
            ))}
            <div className={`${GRID} border-b border-gray-200 bg-inputBackground`}>
              <span className="text-sm font-medium text-primary">Visitors</span>
              <span className="col-span-2 text-xs text-gray-500">
                {editingTotals
                  ? `From visitor registrations, including ${editingTotals.cl} visiting clergy`
                  : occ
                    ? "Counted from visitor registrations once saved"
                    : "Shown once a service is selected"}
              </span>
              <span className="text-right text-sm font-semibold text-primary">
                {editingTotals ? nf(visitors) : "—"}
              </span>
            </div>
            <div className={`${GRID} bg-inputBackground`}>
              <span className="text-sm font-semibold text-primary">Total attendance</span>
              <span className="col-span-2 text-xs text-gray-500">
                {usual ? `Usual for this service: ~${nf(usual)}` : ""}
              </span>
              <span className="text-right text-base font-semibold text-primary">{nf(total)}</span>
            </div>
          </div>

          {usual > 0 && members > 0 && Math.abs(deviation) > 35 && (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              This is {Math.round(Math.abs(deviation))}% {deviation < 0 ? "below" : "above"} the usual ~
              {nf(usual)} for this service. Check the figures before saving.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <UiButton tone="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </UiButton>
          <UiButton tone="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Save attendance"}
          </UiButton>
        </div>
      </div>
    </Modal>
  );
};
