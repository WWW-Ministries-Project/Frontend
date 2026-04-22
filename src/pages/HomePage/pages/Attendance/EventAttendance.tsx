import { Button } from "@/components";
import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import {
  api,
  BiometricAttendanceImportJob,
  BiometricAttendanceImportResponse,
  BiometricAttendanceImportStartResponse,
  BiometricEventAttendanceListResponse,
  BiometricEventAttendanceRecord,
  EventResponseType,
  formatDate,
  relativePath,
  resolveScope,
} from "@/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type GroupBy = "event" | "date";

type EventAttendanceImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  canManageAttendance: boolean;
};

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const getCurrentMonthYear = () => {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeOnly = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDepartmentPosition = (departmentPosition: {
  department_name: string | null;
  position_name: string | null;
}) => {
  if (
    departmentPosition.department_name &&
    departmentPosition.position_name
  ) {
    return `${departmentPosition.department_name} - ${departmentPosition.position_name}`;
  }

  return (
    departmentPosition.department_name ||
    departmentPosition.position_name ||
    "No department position"
  );
};

const isImportJobActive = (
  status: BiometricAttendanceImportJob["status"]
) => status === "QUEUED" || status === "RUNNING";

const normalizeImportJobs = (
  payload?: BiometricAttendanceImportStartResponse | null
) => {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [payload];
};

const buildProgressSummary = (job: BiometricAttendanceImportJob) => {
  if (!job.progress) {
    return [];
  }

  return [
    {
      label: "Devices",
      value: `${job.progress.processed_devices}/${job.progress.total_devices}`,
    },
    {
      label: "Raw punches",
      value: job.progress.raw_punches_fetched,
    },
    {
      label: "Unique punches",
      value: job.progress.unique_punches,
    },
    {
      label: "Duplicates removed",
      value: job.progress.duplicate_punches_skipped,
    },
  ];
};

const buildResultSummary = (result: BiometricAttendanceImportResponse) => [
  {
    label: "Punches fetched",
    value: result.totals.punches_fetched,
  },
  {
    label: "Unique punches",
    value: result.totals.unique_punches,
  },
  {
    label: "Duplicates removed",
    value: result.totals.duplicate_punches_skipped,
  },
  {
    label: "Matched to members",
    value: result.totals.punches_matched_to_users,
  },
  result.dry_run
    ? {
        label: "Attendance candidates",
        value: result.totals.attendance_candidates,
      }
    : {
        label: "Attendance created",
        value: result.totals.attendance_rows_created,
      },
];

const EventAttendanceImportModal = ({
  open,
  onClose,
  onImported,
  canManageAttendance,
}: EventAttendanceImportModalProps) => {
  const currentPeriod = useMemo(() => getCurrentMonthYear(), []);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<BiometricAttendanceImportJob[]>([]);
  const jobStatusRef = useRef<
    Record<number, BiometricAttendanceImportJob["status"]>
  >({});
  const hasRefetchedImportResults = useRef(false);

  const eventQuery = useMemo(
    () => ({
      month: selectedMonth,
      year: selectedYear,
      take: 500,
    }),
    [selectedMonth, selectedYear]
  );

  const {
    data: eventsResponse,
    loading: eventsLoading,
    error: eventsError,
  } = useFetch(api.fetch.fetchEvents, eventQuery, !open);

  const {
    postData: startImportJob,
    data: startedJobResponse,
    error: startJobError,
    loading: startJobLoading,
  } = usePost(api.post.importBiometricAttendance);

  useEffect(() => {
    if (!open) return;

    const nextPeriod = getCurrentMonthYear();
    setSelectedMonth(nextPeriod.month);
    setSelectedYear(nextPeriod.year);
    setSelectedEventIds([]);
    setJobs([]);
    jobStatusRef.current = {};
    hasRefetchedImportResults.current = false;
  }, [open]);

  const filteredEvents = useMemo(() => {
    return (eventsResponse?.data || []) as EventResponseType[];
  }, [eventsResponse]);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 11 }, (_, index) => currentPeriod.year - 5 + index);
  }, [currentPeriod.year]);

  const jobSummary = useMemo(() => {
    return {
      total: jobs.length,
      queued: jobs.filter((job) => job.status === "QUEUED").length,
      running: jobs.filter((job) => job.status === "RUNNING").length,
      completed: jobs.filter((job) => job.status === "COMPLETED").length,
      failed: jobs.filter((job) => job.status === "FAILED").length,
    };
  }, [jobs]);

  useEffect(() => {
    const nextJobs = normalizeImportJobs(startedJobResponse?.data);
    if (!nextJobs.length) return;

    jobStatusRef.current = Object.fromEntries(
      nextJobs.map((job) => [job.id, job.status])
    );
    hasRefetchedImportResults.current = false;
    setJobs(nextJobs);
    showNotification(
      nextJobs[0]?.dry_run
        ? `Bulk biometric preview started for ${nextJobs.length} event${
            nextJobs.length === 1 ? "" : "s"
          }.`
        : `Bulk biometric import started for ${nextJobs.length} event${
            nextJobs.length === 1 ? "" : "s"
          }.`,
      "success",
      "Event Attendance"
    );
  }, [startedJobResponse]);

  useEffect(() => {
    if (!startJobError?.message) return;

    showNotification(startJobError.message, "error", "Event Attendance");
  }, [startJobError]);

  const activeJobIds = useMemo(() => {
    return jobs.filter((job) => isImportJobActive(job.status)).map((job) => job.id);
  }, [jobs]);

  useEffect(() => {
    if (!activeJobIds.length) return;

    let isCancelled = false;
    let timer: number | undefined;

    const pollJobs = async () => {
      try {
        const responses = await Promise.all(
          activeJobIds.map((id) =>
            api.fetch.fetchBiometricAttendanceImportJob({
              id,
            })
          )
        );
        if (isCancelled) return;

        const nextJobsById = new Map(
          responses.map((response) => [response.data.id, response.data])
        );
        const nextJobs = jobs.map((job) => nextJobsById.get(job.id) || job);

        nextJobs.forEach((job) => {
          const previousStatus = jobStatusRef.current[job.id];
          if (previousStatus === job.status) {
            return;
          }

          jobStatusRef.current[job.id] = job.status;

          if (job.status === "COMPLETED") {
            showNotification(
              job.dry_run
                ? `Preview completed for ${job.event_name || "selected event"}.`
                : `Import completed for ${job.event_name || "selected event"}.`,
              "success",
              "Event Attendance"
            );
          }

          if (job.status === "FAILED") {
            showNotification(
              job.error_message ||
                `Import failed for ${job.event_name || "selected event"}.`,
              "error",
              "Event Attendance"
            );
          }
        });

        setJobs(nextJobs);

        if (nextJobs.some((job) => isImportJobActive(job.status))) {
          timer = window.setTimeout(pollJobs, 1000);
        }
      } catch (error: unknown) {
        if (isCancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh biometric import progress.";
        showNotification(message, "error", "Event Attendance");

        timer = window.setTimeout(pollJobs, 2000);
      }
    };

    timer = window.setTimeout(pollJobs, 1000);

    return () => {
      isCancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [activeJobIds, jobs]);

  const isJobActive = jobs.some((job) => isImportJobActive(job.status));
  const canSubmit = Boolean(selectedEventIds.length && canManageAttendance);

  useEffect(() => {
    if (!jobs.length || isJobActive || hasRefetchedImportResults.current) return;
    if (!jobs.some((job) => !job.dry_run && job.status === "COMPLETED")) return;

    hasRefetchedImportResults.current = true;
    onImported();
  }, [isJobActive, jobs, onImported]);

  const resetJobs = () => {
    setJobs([]);
    jobStatusRef.current = {};
    hasRefetchedImportResults.current = false;
  };

  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
    setSelectedEventIds([]);
    resetJobs();
  };

  const handleYearChange = (value: number) => {
    setSelectedYear(value);
    setSelectedEventIds([]);
    resetJobs();
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }

      return [...current, eventId];
    });
    resetJobs();
  };

  const handleStartJob = (dryRun: boolean) => {
    if (!canSubmit || isJobActive) return;

    hasRefetchedImportResults.current = false;
    startImportJob({
      eventIds: selectedEventIds,
      dryRun,
    });
  };

  return (
    <Modal open={open} onClose={() => (!isJobActive ? onClose() : null)} className="max-w-5xl">
      <div className="flex flex-col">
        <div className="border-b border-lightGray px-6 py-5">
          <h2 className="text-lg font-semibold text-primary">
            Bulk Event Attendance Import
          </h2>
          <p className="mt-1 text-sm text-primaryGray">
            Select a month and year, choose one or more scheduled events, and
            run biometric attendance imports in parallel background jobs.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {!canManageAttendance && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can view event attendance, but you need manage attendance
              access to start preview or import jobs.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-primary">Month</label>
              <select
                value={selectedMonth}
                onChange={(event) => handleMonthChange(Number(event.target.value))}
                className="h-11 w-full rounded-lg border border-lightGray px-3 text-sm"
                disabled={isJobActive}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-primary">Year</label>
              <select
                value={selectedYear}
                onChange={(event) => handleYearChange(Number(event.target.value))}
                className="h-11 w-full rounded-lg border border-lightGray px-3 text-sm"
                disabled={isJobActive}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-lightGray bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">
                  Events in {MONTH_OPTIONS[selectedMonth - 1]?.label} {selectedYear}
                </p>
                <p className="text-xs text-primaryGray">
                  Each selected event uses its own scheduled date when the bulk
                  import job runs.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-primary/30 px-3 py-2 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    setSelectedEventIds(filteredEvents.map((event) => String(event.id)));
                    resetJobs();
                  }}
                  disabled={!filteredEvents.length || isJobActive}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-primary/30 px-3 py-2 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    setSelectedEventIds([]);
                    resetJobs();
                  }}
                  disabled={!selectedEventIds.length || isJobActive}
                >
                  Clear selection
                </button>
              </div>
            </div>

            {eventsLoading ? (
              <div className="rounded-lg border border-dashed border-lightGray px-4 py-4 text-sm text-primaryGray">
                Loading events for the selected month and year...
              </div>
            ) : eventsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {eventsError.message || "Unable to load events for import."}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-lightGray px-4 py-4 text-sm text-primaryGray">
                No events were found for the selected month and year.
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredEvents.map((event) => {
                  const eventId = String(event.id);
                  const isSelected = selectedEventIds.includes(eventId);

                  return (
                    <label
                      key={eventId}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-lightGray bg-white"
                      } ${isJobActive ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEventSelection(eventId)}
                        disabled={isJobActive}
                        className="mt-1 h-4 w-4 rounded border-lightGray text-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">
                          {event.name || "Unnamed event"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-primaryGray">
                          <span>{formatDate(event.start_date, "short")}</span>
                          <span>{event.event_type || "Unknown type"}</span>
                          {event.location ? <span>{event.location}</span> : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-primaryGray">
              {selectedEventIds.length} event{selectedEventIds.length === 1 ? "" : "s"} selected.
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">
                  Bulk Processing
                </p>
                <p className="text-xs text-primaryGray">
                  Each selected event runs as a separate background job,
                  reports progress independently, and removes duplicate punches
                  before attendance is staged.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  value="Preview Selected Events"
                  variant="secondary"
                  disabled={!canSubmit || isJobActive}
                  loading={startJobLoading}
                  onClick={() => handleStartJob(true)}
                />
                <Button
                  value="Import Selected Events"
                  variant="primary"
                  disabled={!canSubmit || isJobActive}
                  loading={startJobLoading}
                  onClick={() => handleStartJob(false)}
                />
              </div>
            </div>

            {!jobs.length ? (
              <p className="mt-4 rounded-lg border border-dashed border-primary/30 bg-white px-3 py-3 text-xs text-primaryGray">
                Select a month and year, choose one or more events, then start
                a preview or import. Each job will show its own progress below.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[
                    { label: "Jobs", value: jobSummary.total },
                    { label: "Queued", value: jobSummary.queued },
                    { label: "Running", value: jobSummary.running },
                    { label: "Completed", value: jobSummary.completed },
                    { label: "Failed", value: jobSummary.failed },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-lightGray bg-white px-3 py-3"
                    >
                      <p className="text-xs text-primaryGray">{item.label}</p>
                      <p className="text-lg font-semibold text-primary">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {jobs.map((job) => {
                  const result = job.result;
                  const progressSummary = buildProgressSummary(job);
                  const resultSummary = result ? buildResultSummary(result) : [];

                  return (
                    <div
                      key={job.id}
                      className="space-y-4 rounded-lg border border-lightGray bg-white p-4"
                    >
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-primaryGray">
                        <span>Job #{job.id}</span>
                        <span>Event: {job.event_name || "Selected event"}</span>
                        <span>Status: {job.status}</span>
                        <span>
                          Mode: {job.dry_run ? "Preview only" : "Import attendance"}
                        </span>
                        <span>Date: {job.occurrence_date}</span>
                        <span>
                          Started: {formatDateTime(job.started_at || job.created_at)}
                        </span>
                      </div>

                      <div className="rounded-lg border border-lightGray px-4 py-4">
                        <div className="mb-2 flex items-center justify-between text-sm font-medium text-primary">
                          <span>{job.current_step || "Preparing job"}</span>
                          <span>{job.progress_percentage}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-lightGray/50">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {progressSummary.map((item) => (
                          <div
                            key={`${job.id}-${item.label}`}
                            className="rounded-lg border border-lightGray bg-lightGray/20 px-3 py-3"
                          >
                            <p className="text-xs text-primaryGray">{item.label}</p>
                            <p className="text-lg font-semibold text-primary">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {job.error_message && job.status === "FAILED" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                          {job.error_message}
                        </div>
                      )}

                      {result && (
                        <div className="space-y-4 rounded-lg border border-lightGray px-3 py-3">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-primaryGray">
                            <span>
                              Result: {result.dry_run ? "Preview completed" : "Import completed"}
                            </span>
                            <span>Event: {result.event.event_name || "Selected event"}</span>
                            <span>Date: {result.occurrence_date}</span>
                            <span>
                              Window: {formatTimeOnly(result.attendance_window.start)} to{" "}
                              {formatTimeOnly(result.attendance_window.end)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {resultSummary.map((item) => (
                              <div
                                key={`${job.id}-${item.label}`}
                                className="rounded-lg border border-lightGray bg-lightGray/20 px-3 py-3"
                              >
                                <p className="text-xs text-primaryGray">{item.label}</p>
                                <p className="text-lg font-semibold text-primary">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-lg border border-lightGray px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
                              Unmatched device users
                            </p>
                            {result.unmatched_device_users.length === 0 ? (
                              <p className="mt-2 text-sm text-green-700">
                                All unique punches in this job matched to existing members.
                              </p>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {result.unmatched_device_users
                                  .slice(0, 5)
                                  .map((user) => (
                                    <div
                                      key={`${job.id}-${user.device_user_id}-${user.device_user_name ?? ""}`}
                                      className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900"
                                    >
                                      <p className="font-medium">
                                        {user.device_user_name || "Unknown device user"} (
                                        {user.device_user_id})
                                      </p>
                                      <p className="text-xs text-amber-800">
                                        {user.punch_count} punch
                                        {user.punch_count === 1 ? "" : "es"} on{" "}
                                        {user.device_ips.join(", ")}
                                      </p>
                                    </div>
                                  ))}
                                {result.unmatched_device_users.length > 5 && (
                                  <p className="text-xs text-primaryGray">
                                    {result.unmatched_device_users.length - 5} more
                                    unmatched device users are hidden from this result.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-lightGray px-6 py-4">
          <div className="flex justify-end">
            <Button
              value={isJobActive ? "Processing..." : "Close"}
              variant="secondary"
              disabled={isJobActive}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default function EventAttendance() {
  const { eventsOptions } = useStore();
  const { user } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("event");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    eventId: "",
    date: "",
  });

  const canManageAttendance = Boolean(
    user.permissions?.manage_church_attendance
  );
  const hasDepartmentScopedAttendance =
    resolveScope(user.access_permissions, "Church_Attendance") ===
    "assigned_departments";

  const query = useMemo(() => {
    const nextQuery: Record<string, string> = {};

    if (filters.eventId) {
      nextQuery.eventId = filters.eventId;
    }

    if (filters.date) {
      nextQuery.date = filters.date;
    }

    return nextQuery;
  }, [filters.date, filters.eventId]);

  const { data, loading, error, refetch } = useFetch(
    api.fetch.fetchBiometricAttendance,
    query
  );

  const attendanceData = useMemo(() => {
    return (data?.data || {
      records: [],
      summary: {
        total_records: 0,
        total_events: 0,
        total_members: 0,
        total_punches: 0,
        attendance_recorded: 0,
      },
    }) as BiometricEventAttendanceListResponse;
  }, [data]);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, BiometricEventAttendanceRecord[]> = {};

    attendanceData.records.forEach((record) => {
      const key =
        groupBy === "event"
          ? record.event_name || "Unknown Event"
          : record.attendance_date;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(record);
    });

    return groups;
  }, [attendanceData.records, groupBy]);

  useEffect(() => {
    const keys = Object.keys(groupedRecords);
    if (keys.length === 0) return;

    setOpenGroups((current) => {
      const nextState = {} as Record<string, boolean>;

      keys.forEach((key, index) => {
        nextState[key] = current[key] ?? index === 0;
      });

      return nextState;
    });
  }, [groupedRecords]);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Event Attendance", link: "" },
  ];

  const statItems = [
    {
      label: "Computed records",
      value: attendanceData.summary.total_records,
    },
    {
      label: "Events covered",
      value: attendanceData.summary.total_events,
    },
    {
      label: "Members matched",
      value: attendanceData.summary.total_members,
    },
    {
      label: "Unique staged punches",
      value: attendanceData.summary.total_punches,
    },
    {
      label: "Official attendance rows",
      value: attendanceData.summary.attendance_recorded,
    },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <div className="space-y-6">
        <HeaderControls
          title="Event Attendance"
          subtitle="Unique biometric attendance computed from imported ZKTeco punches"
          hasFilter
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          customIcon={
            <Button
              value="Bulk Import"
              onClick={() => setShowImportModal(true)}
              disabled={!canManageAttendance}
            />
          }
        />

        {hasDepartmentScopedAttendance && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            Department-specific access is active. This page only shows
            attendance records for members in your assigned or headed
            departments.
          </div>
        )}

        {showFilter && (
          <div className="flex flex-wrap gap-4 rounded-xl border border-lightGray bg-white p-4">
            <div className="flex min-w-[220px] flex-1 flex-col">
              <label className="mb-1 text-xs text-primaryGray">Event</label>
              <select
                className="h-10 rounded-lg border border-lightGray px-3"
                value={filters.eventId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    eventId: event.target.value,
                  }))
                }
              >
                <option value="">All events</option>
                {eventsOptions?.map((event) => (
                  <option key={String(event.value)} value={String(event.value)}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[220px] flex-1 flex-col">
              <label className="mb-1 text-xs text-primaryGray">Date</label>
              <input
                type="date"
                className="h-10 rounded-lg border border-lightGray px-3"
                value={filters.date}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-end">
              <Button
                value="Reset"
                variant="secondary"
                onClick={() => setFilters({ eventId: "", date: "" })}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message || "Unable to load biometric event attendance."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-lightGray bg-white px-4 py-4"
            >
              <p className="text-xs text-primaryGray">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-primary">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded-lg border px-3 py-1 text-sm ${
              groupBy === "event" ? "bg-primary text-white" : "bg-white"
            }`}
            onClick={() => setGroupBy("event")}
          >
            Group by Event
          </button>
          <button
            className={`rounded-lg border px-3 py-1 text-sm ${
              groupBy === "date" ? "bg-primary text-white" : "bg-white"
            }`}
            onClick={() => setGroupBy("date")}
          >
            Group by Date
          </button>
        </div>

        {!loading && attendanceData.records.length === 0 && (
          <EmptyState
            scope="page"
            msg="No biometric event attendance records found for the selected filters"
          />
        )}

        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([group, records]) => (
            <div key={group} className="space-y-3">
              <button
                className="flex w-full items-center justify-between rounded-xl bg-lightGray/30 px-4 py-3 text-left"
                onClick={() =>
                  setOpenGroups((current) => ({
                    ...current,
                    [group]: !current[group],
                  }))
                }
              >
                <span className="text-lg font-semibold text-primary">
                  {group} ({records.length})
                </span>
                <span className="text-primary">
                  {openGroups[group] ? "−" : "+"}
                </span>
              </button>

              {openGroups[group] && (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div
                      key={`${record.event_id}-${record.user_id}-${record.attendance_date}`}
                      className="rounded-xl border border-lightGray bg-white px-4 py-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                          <p className="text-xs text-primaryGray">Member</p>
                          <p className="font-semibold text-primary">
                            {record.user_name || "Unknown member"}
                          </p>
                          <p className="text-xs text-primaryGray">
                            {record.member_id || "No member ID"}
                          </p>
                          <p className="mt-1 text-xs text-primaryGray">
                            {record.department_positions.length > 0
                              ? record.department_positions
                                  .map((entry) => formatDepartmentPosition(entry))
                                  .join(", ")
                              : "No department position"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-primaryGray">Event</p>
                          <p className="font-medium text-primary">
                            {record.event_name || "Unknown Event"}
                          </p>
                          <p className="text-xs text-primaryGray">
                            {record.event_type || "Unknown type"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-primaryGray">First Punch</p>
                          <p className="font-medium text-primary">
                            {formatDateTime(record.first_punch_at)}
                          </p>
                          <p className="text-xs text-primaryGray">
                            Last: {formatTimeOnly(record.last_punch_at)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-primaryGray">Punches</p>
                          <p className="font-medium text-primary">
                            {record.punch_count}
                          </p>
                          <p className="text-xs text-primaryGray">
                            {record.device_ips.join(", ")}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-primaryGray">Status</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              record.attendance_recorded
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {record.attendance_recorded
                              ? "Official attendance recorded"
                              : "Biometric only"}
                          </span>
                          <p className="mt-2 text-xs text-primaryGray">
                            Date: {record.attendance_date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <EventAttendanceImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          void refetch();
        }}
        canManageAttendance={canManageAttendance}
      />
    </PageOutline>
  );
}
