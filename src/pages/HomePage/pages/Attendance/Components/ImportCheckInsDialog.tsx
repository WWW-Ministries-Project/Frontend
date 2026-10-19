import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  Pill,
  PillTone,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils";
import type {
  BiometricAttendanceImportJob,
  EventResponseType,
} from "@/utils/api/events/interfaces";
import { cn } from "@/utils/cn";

import {
  asArray,
  clock,
  daysInMonth,
  fmtShort,
  MONF,
  nf,
  normalizeEvent,
  plural,
  t12,
  todayKey,
} from "../utils/attendanceModel";
import { useCheckIns, useImportJobs } from "../utils/useAttendanceData";

const SELECT =
  "h-10 w-full rounded-lg border border-[rgba(107,114,128,0.35)] bg-white px-3 text-sm text-primary disabled:opacity-60";

const jobStatus = (job: BiometricAttendanceImportJob): [string, PillTone] => {
  if (job.status === "COMPLETED") return ["Completed", "success"];
  if (job.status === "FAILED") return ["Failed", "danger"];
  if (job.status === "RUNNING") return ["Running", "info"];
  return ["Queued", "neutral"];
};

const jobStats = (job: BiometricAttendanceImportJob) => {
  const totals = job.result?.totals;
  if (!totals) return [];
  return [
    { label: "Punches fetched", value: totals.punches_fetched },
    { label: "Unique punches", value: totals.unique_punches },
    { label: "Duplicates removed", value: totals.duplicate_punches_skipped },
    { label: "Matched to members", value: totals.punches_matched_to_users },
    job.dry_run
      ? { label: "Would be created", value: totals.attendance_candidates }
      : totals.attendance_rows_created
        ? { label: "Check-ins created", value: totals.attendance_rows_created }
        : { label: "Already existed", value: totals.attendance_rows_existing },
  ];
};

export const ImportCheckInsDialog = ({
  open,
  onClose,
  onImported,
  canManage,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  canManage: boolean;
}) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string[]>([]);
  const { jobs, busy, start, reset } = useImportJobs(onImported);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
    setSelected([]);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const eventQuery = useMemo(() => ({ month, year, take: 500 }), [month, year]);
  const { data: eventsResponse, loading: eventsLoading } = useFetch(
    api.fetch.fetchEvents,
    eventQuery,
    !open
  );
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const { checkIns } = useCheckIns(
    { fromDate: `${monthKey}-01`, toDate: `${monthKey}-${daysInMonth(year, month)}` },
    !open
  );

  const today = todayKey();
  const events = useMemo(
    () =>
      asArray<EventResponseType>(eventsResponse?.data)
        .map(normalizeEvent)
        .filter((occ) => occ.date && occ.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)),
    [eventsResponse, today]
  );
  const importedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    checkIns.forEach((checkIn) => {
      counts[checkIn.eventId] = (counts[checkIn.eventId] || 0) + 1;
    });
    return counts;
  }, [checkIns]);

  const years = Array.from({ length: 6 }, (_, index) => now.getFullYear() - index);
  const pick = (next: string[]) => {
    setSelected(next);
    reset();
  };
  const disabled = busy || !selected.length || !canManage;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      persist={busy}
      title="Import check-ins"
      description="Import punches from the biometric devices."
      className="max-w-[880px] overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-1 border-b border-[#E5E7EB] px-6 py-5">
          <h2 className="text-xl font-semibold leading-7 text-primary">Import check-ins</h2>
          <p className="text-sm text-[#4B5563]">
            Pick a month, choose events, then preview or import punches from the biometric devices.
            Duplicate punches are removed before attendance is staged.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          {!canManage && (
            <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
              You can view check-ins, but you need manage attendance access to preview or import.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">Month</span>
              <select
                value={month}
                disabled={busy}
                onChange={(event) => {
                  setMonth(Number(event.target.value));
                  pick([]);
                }}
                className={SELECT}
              >
                {MONF.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">Year</span>
              <select
                value={year}
                disabled={busy}
                onChange={(event) => {
                  setYear(Number(event.target.value));
                  pick([]);
                }}
                className={SELECT}
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-lightGray p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-primary">
                  Events in {MONF[month - 1]} {year}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Only events that have already started are listed.
                </p>
              </div>
              <div className="flex gap-2">
                <UiButton
                  size="sm"
                  disabled={busy || !events.length}
                  onClick={() => pick(events.filter((occ) => !importedCount[occ.id]).map((occ) => occ.id))}
                >
                  Select not imported
                </UiButton>
                <UiButton size="sm" disabled={busy || !selected.length} onClick={() => pick([])}>
                  Clear
                </UiButton>
              </div>
            </div>
            <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
              {events.map((occ) => {
                const on = selected.includes(occ.id);
                const count = importedCount[occ.id] || 0;
                return (
                  <label
                    key={occ.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3",
                      on ? "border-primary bg-primary/5" : "border-lightGray bg-white",
                      busy && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={busy}
                      onChange={() =>
                        pick(on ? selected.filter((id) => id !== occ.id) : [...selected, occ.id])
                      }
                      className="m-0 h-4 w-4 accent-primary"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold text-primary">{occ.name}</span>
                      <span className="text-xs text-[#6B7280]">
                        {fmtShort(occ.date)}
                        {occ.time ? ` · ${t12(occ.time)}` : ""} · {occ.typeLabel}
                      </span>
                    </span>
                    <Pill tone={count ? "success" : "neutral"}>
                      {count ? `Imported · ${nf(count)} check-ins` : "Not imported"}
                    </Pill>
                  </label>
                );
              })}
              {!events.length && (
                <p className="py-3 text-sm text-[#6B7280]">
                  {eventsLoading ? "Loading events…" : "No events were held in this month."}
                </p>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              {plural(selected.length, "event")} selected. Events already imported skip existing
              check-ins.
            </p>
          </div>

          {jobs.map((job) => {
            const [label, tone] = jobStatus(job);
            const stats = jobStats(job);
            const unmatched = job.result?.unmatched_device_users || [];
            const range = job.result?.attendance_window;
            return (
              <div key={job.id} className="flex flex-col gap-3 rounded-xl border border-lightGray p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">
                      {job.event_name || "Selected event"}
                      {job.occurrence_date ? ` · ${fmtShort(job.occurrence_date.slice(0, 10))}` : ""}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      {job.dry_run ? "Preview only" : "Import attendance"}
                      {range ? ` · window ${clock(range.start)} to ${clock(range.end)}` : ""}
                    </span>
                  </div>
                  <Pill tone={tone}>{label}</Pill>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm text-primary">
                    <span>
                      {job.status === "COMPLETED"
                        ? job.dry_run
                          ? "Preview complete"
                          : "Import complete"
                        : job.status === "QUEUED"
                          ? "Waiting to start"
                          : job.current_step || "Preparing job"}
                    </span>
                    <span className="font-semibold">{job.progress_percentage}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={job.progress_percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${job.progress_percentage}%` }}
                    />
                  </div>
                </div>
                {job.status === "FAILED" && job.error_message && (
                  <p className="text-sm text-[#B91C1C]">{job.error_message}</p>
                )}
                {stats.length > 0 && (
                  <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
                      {stats.map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-lightGray bg-[#F8F9FC] px-3 py-2">
                          <p className="text-xs text-[#6B7280]">{stat.label}</p>
                          <p className="text-lg font-semibold text-primary">{nf(stat.value)}</p>
                        </div>
                      ))}
                    </div>
                    <p className={cn("text-sm", unmatched.length ? "text-[#B45309]" : "text-[#15803D]")}>
                      {unmatched.length
                        ? `${plural(unmatched.length, "device user")} not matched: ${unmatched
                            .slice(0, 6)
                            .map((entry) => `${entry.device_user_name || "No name"} (${entry.device_user_id})`)
                            .join(", ")}${unmatched.length > 6 ? ` and ${unmatched.length - 6} more` : ""}.`
                        : "All punches matched to existing members."}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
          <UiButton className="mr-auto" onClick={onClose} disabled={busy}>
            {busy ? "Processing…" : "Close"}
          </UiButton>
          <UiButton disabled={disabled} onClick={() => start(selected, true)}>
            Preview
          </UiButton>
          <UiButton tone="primary" disabled={disabled} onClick={() => start(selected, false)}>
            Import selected
          </UiButton>
        </div>
      </div>
    </Modal>
  );
};
