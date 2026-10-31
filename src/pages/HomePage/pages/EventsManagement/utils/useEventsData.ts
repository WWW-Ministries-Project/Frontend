import { useEffect, useMemo, useState } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import {
  asArray,
  normalizeRecord,
  totalsOf,
} from "@/pages/HomePage/pages/Attendance/utils/attendanceModel";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";

import { type EventRecord, type ScheduledEvent, toScheduled } from "./eventsModel";

/** Recorded headcount per occurrence id (all groups and days summed). */
export const useHeadcounts = () => {
  const { data, loading } = useFetch(api.fetch.fetchChurchAttendance, undefined, false, { silent: true });
  const headcounts = useMemo(() => {
    const map = new Map<string, number>();
    asArray<Record<string, unknown>>(data?.data).forEach((raw) => {
      const record = normalizeRecord(raw);
      if (!record.eventId) return;
      map.set(record.eventId, (map.get(record.eventId) ?? 0) + totalsOf(record).total);
    });
    return map;
  }, [data]);
  return { headcounts, loading };
};

/**
 * Occurrences for whole years. `event/list-events` without month/year only
 * returns the current month, so each year is asked for explicitly.
 */
export const useEventsForYears = (years: number[], reloadKey = 0) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const signature = useMemo(() => Array.from(new Set(years)).sort().join(","), [years]);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const list = signature ? signature.split(",").map(Number) : [];
    if (!list.length) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    Promise.all(list.map((year) => api.fetch.fetchEvents({ year, page: 1, take: 5000 })))
      .then((responses) => {
        if (cancelled) return;
        const byId = new Map<string, ScheduledEvent>();
        responses.forEach((response) =>
          asArray<EventRecord>(response?.data).forEach((raw) => {
            const event = toScheduled(raw);
            if (event.date) byId.set(event.id, event);
          })
        );
        setEvents(Array.from(byId.values()));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signature, activeBranchId, reloadKey]);

  return { events, loading, failed };
};
