import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type {
  BiometricAttendanceImportJob,
  BiometricEventAttendanceRecord,
  EventResponseType,
} from "@/utils/api/events/interfaces";
import type { QueryType } from "@/utils/interfaces";

import {
  asArray,
  CheckIn,
  normalizeCheckIn,
  normalizeEvent,
  normalizeRecord,
  Occurrence,
  timingFromConfig,
  TimingRules,
} from "./attendanceModel";

/** Every headcount record (the endpoint is not paginated). */
export const useAttendanceRecords = () => {
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchChurchAttendance);
  const records = useMemo(
    () =>
      asArray<Record<string, unknown>>(data?.data)
        .map(normalizeRecord)
        .filter((record) => record.id && record.date),
    [data]
  );
  return { records, loading, error, refetch };
};

/**
 * Event occurrences for whole years. `event/list-events` without month/year
 * only returns the current month, so each year is fetched explicitly.
 */
export const useEventOccurrences = (years: number[]) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const signature = useMemo(() => [...new Set(years)].sort().join(","), [years]);
  const [events, setEvents] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const list = signature ? signature.split(",").map(Number) : [];
    if (!list.length) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(list.map((year) => api.fetch.fetchEvents({ year, take: 2000 })))
      .then((responses) => {
        if (cancelled) return;
        const byId = new Map<string, Occurrence>();
        responses.forEach((response) =>
          asArray<EventResponseType>(response?.data).forEach((event) => {
            const occ = normalizeEvent(event);
            if (occ.date) byId.set(occ.id, occ);
          })
        );
        setEvents([...byId.values()]);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signature, activeBranchId]);

  const byId = useMemo(() => new Map(events.map((occ) => [occ.id, occ])), [events]);
  return { events, byId, loading };
};

/** Biometric check-ins, optionally bounded by event and day range. */
export const useCheckIns = (
  query: { eventId?: string; fromDate?: string; toDate?: string },
  lazy?: boolean
) => {
  const fetchQuery = useMemo(() => {
    const next: QueryType = {};
    if (query.eventId) next.eventId = query.eventId;
    if (query.fromDate) next.fromDate = query.fromDate;
    if (query.toDate) next.toDate = query.toDate;
    return next;
  }, [query.eventId, query.fromDate, query.toDate]);

  const { data, loading, error, refetch } = useFetch(api.fetch.fetchBiometricAttendance, fetchQuery, lazy);
  const checkIns = useMemo<CheckIn[]>(
    () =>
      ((data?.data?.records || []) as BiometricEventAttendanceRecord[]).map(normalizeCheckIn),
    [data]
  );
  return { checkIns, loading, error, refetch };
};

/**
 * Early / late thresholds from Settings → Attendance. The endpoint is open to
 * attendance and settings viewers; anyone else falls back to the 15 minute
 * defaults.
 */
export const useTimingRules = (): TimingRules => {
  const { canView } = useAccessControl();
  const allowed = canView("Church_Attendance") || canView("Settings");
  const { data } = useFetch(api.fetch.fetchAttendanceTimingConfig, undefined, !allowed, {
    silent: true,
  });
  return useMemo(() => timingFromConfig(allowed ? data?.data : null), [allowed, data]);
};

const isActive = (job: BiometricAttendanceImportJob) =>
  job.status === "QUEUED" || job.status === "RUNNING";

/** Starts biometric import jobs and polls them until they finish. */
export const useImportJobs = (onImported?: () => void) => {
  const [jobs, setJobs] = useState<BiometricAttendanceImportJob[]>([]);
  const [starting, setStarting] = useState(false);
  const statusRef = useRef<Record<number, string>>({});
  const notifiedRef = useRef(false);
  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;

  const busy = starting || jobs.some(isActive);
  const activeIds = useMemo(
    () => jobs.filter(isActive).map((job) => job.id).join(","),
    [jobs]
  );

  useEffect(() => {
    if (!activeIds) return;
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const responses = await Promise.all(
          activeIds.split(",").map((id) => api.fetch.fetchBiometricAttendanceImportJob({ id }))
        );
        if (cancelled) return;
        const next = new Map(responses.map((response) => [response.data.id, response.data]));
        setJobs((current) => current.map((job) => next.get(job.id) || job));
      } catch {
        if (!cancelled) timer = window.setTimeout(poll, 2000);
      }
    };
    timer = window.setTimeout(poll, 1000);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [activeIds, jobs]);

  useEffect(() => {
    jobs.forEach((job) => {
      if (statusRef.current[job.id] === job.status) return;
      statusRef.current[job.id] = job.status;
      if (job.status === "FAILED") {
        showNotification(
          job.error_message || `Import failed for ${job.event_name || "the selected event"}.`,
          "error",
          "Event Attendance"
        );
      }
    });
    if (!jobs.length || jobs.some(isActive) || notifiedRef.current) return;
    notifiedRef.current = true;
    const dry = jobs.every((job) => job.dry_run);
    const failed = jobs.filter((job) => job.status === "FAILED").length;
    showNotification(
      dry
        ? "Preview finished. Nothing was saved."
        : failed
          ? `Import finished with ${failed} failed event${failed === 1 ? "" : "s"}.`
          : "Import finished. Check-ins are recorded as official attendance.",
      failed ? "error" : "success",
      "Event Attendance"
    );
    if (!dry) onImportedRef.current?.();
  }, [jobs]);

  const start = useCallback(async (eventIds: string[], dryRun: boolean) => {
    if (!eventIds.length) return false;
    setStarting(true);
    try {
      const response = await api.post.importBiometricAttendance({ eventIds, dryRun });
      const payload = response?.data;
      const started = payload ? (Array.isArray(payload) ? payload : [payload]) : [];
      statusRef.current = Object.fromEntries(started.map((job) => [job.id, job.status]));
      notifiedRef.current = false;
      setJobs(started);
      return true;
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Unable to start the import.",
        "error",
        "Event Attendance"
      );
      return false;
    } finally {
      setStarting(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (jobs.some(isActive)) return;
    statusRef.current = {};
    notifiedRef.current = false;
    setJobs([]);
  }, [jobs]);

  return { jobs, busy, start, reset };
};
