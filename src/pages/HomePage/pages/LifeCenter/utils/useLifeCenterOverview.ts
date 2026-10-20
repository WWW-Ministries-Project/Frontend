import { useMemo } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type { LifeCenterOverviewCenter } from "@/utils/api/lifeCenter/interfaces";

import { Day, dayKey, toDays } from "./lcModel";

export interface Center {
  id: number;
  name: string;
  description: string;
  location: string;
  days: Day[];
  created: string;
  leader: string | null;
  leaderUserId: number | null;
  memberCount: number;
  soulsTotal: number;
  followUp: number;
  last: string | null;
  /** Last 8 meetings, newest first. */
  recent: { date: string; attendees: number; first_timers: number }[];
}

export const toCenter = (c: LifeCenterOverviewCenter): Center => ({
  id: c.id,
  name: c.name,
  description: c.description ?? "",
  location: c.location ?? "",
  days: toDays(c.meeting_days),
  created: dayKey(c.created_at) || "2000-01-01",
  leader: c.leader?.name ?? null,
  leaderUserId: c.leader?.user_id ?? null,
  memberCount: c.member_count ?? 0,
  soulsTotal: c.souls_total ?? 0,
  followUp: c.souls_to_follow_up ?? 0,
  last: dayKey(c.last_meeting_date) || null,
  recent: (c.recent_meetings ?? []).map((r) => ({ ...r, date: dayKey(r.date) })),
});

/** Average people per meeting (attendees + first-timers) over the recent meetings. */
export const recentAverage = (center: Center) =>
  center.recent.length
    ? center.recent.reduce((total, r) => total + r.attendees + r.first_timers, 0) / center.recent.length
    : 0;

/**
 * Centers plus the meetings and souls won between `from` (empty = all time) and `to` (inclusive),
 * scoped to the active branch and, for leaders, to their own center.
 */
export const useLifeCenterOverview = (from: string, to: string, lifeCenterId?: string | number | null) => {
  const query = useMemo(
    () => ({ ...(from ? { from } : {}), to, ...(lifeCenterId ? { lifeCenterId: String(lifeCenterId) } : {}) }),
    [from, to, lifeCenterId]
  );
  const response = useFetch(api.fetch.fetchLifeCenterOverview, query);
  const data = response.data?.data;
  const centers = useMemo(() => (data?.centers ?? []).map(toCenter), [data]);
  const meetings = useMemo(
    () => (data?.meetings ?? []).map((g) => ({ ...g, date: dayKey(g.date), offering: Number(g.offering) || 0 })),
    [data]
  );
  const souls = useMemo(() => (data?.souls ?? []).map((s) => ({ ...s, date_won: dayKey(s.date_won) })), [data]);
  return {
    centers,
    meetings,
    souls,
    roles: data?.roles ?? [],
    loaded: !!response.data,
    loading: response.loading,
    error: response.error,
    refetch: response.refetch,
  };
};
