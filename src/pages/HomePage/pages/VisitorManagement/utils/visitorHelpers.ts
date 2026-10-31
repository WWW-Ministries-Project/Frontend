import { useCallback, useMemo } from "react";

import { TITLE_OPTIONS as SHARED_TITLE_OPTIONS } from "@/components/subform/titleOptions";
import { useFetch } from "@/CustomHooks/useFetch";
import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { initialsOf } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { relativePath } from "@/utils/const";
import { formatPhoneNumber } from "@/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type {
  RawFollowUpType,
  RawVisitType,
  VisitorType,
} from "@/utils/api/visitors/interfaces";
import { isCompletedStatus } from "@/utils/api/visitors/visitorActions";
import type { QueryType } from "@/utils/interfaces";

/* -------------------------------------------------------------------------- */
/*                                   Paths                                    */
/* -------------------------------------------------------------------------- */

export const visitorsPath = `${relativePath.home.main}/${relativePath.home.visitors.main}`;
export const visitorDetailsPath = (id: string | number) =>
  `${visitorsPath}/visitor/${id}`;
export const guestRequestsPath = `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.management.main}/${relativePath.home.membership.management.guestToMembership}`;

/* -------------------------------------------------------------------------- */
/*                                  Options                                   */
/* -------------------------------------------------------------------------- */

/** Stored values keep the keys the old form used so existing records still read well. */
export const HEARD_OPTIONS = [
  { value: "friend", label: "Friend or family" },
  { value: "social_media", label: "Social media" },
  { value: "website", label: "Church website" },
  { value: "walk_in", label: "Walked in" },
  { value: "radio", label: "Radio" },
  { value: "flyer", label: "Event flyer" },
  { value: "advertisement", label: "Advertisement" },
  { value: "other", label: "Other" },
];

export const FOLLOW_UP_TYPES = [
  { value: "phone", label: "Phone call" },
  { value: "in-person", label: "Home visit" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

// Derived from the shared list so the visitor and member forms offer the same titles.
export const TITLE_OPTIONS: string[] = SHARED_TITLE_OPTIONS.map((o) => o.value);

const labelFrom = (options: { value: string; label: string }[], value?: string | null) => {
  if (!value) return "";
  return (
    options.find((option) => option.value.toLowerCase() === value.trim().toLowerCase())
      ?.label ?? value
  );
};

export const heardLabel = (value?: string | null) => labelFrom(HEARD_OPTIONS, value);
export const followUpTypeLabel = (value?: string | null) =>
  labelFrom(FOLLOW_UP_TYPES, value);

/* -------------------------------------------------------------------------- */
/*                                   Records                                  */
/* -------------------------------------------------------------------------- */

export type VisitorStage = "need" | "done" | "member";

export const STAGE_PILL: Record<VisitorStage, { label: string; tone: PillTone }> = {
  need: { label: "Needs follow-up", tone: "warning" },
  done: { label: "Followed up", tone: "info" },
  member: { label: "Member", tone: "success" },
};

export interface VisitorRecord {
  id: string;
  visitor: VisitorType;
  name: string;
  initials: string;
  phone: string;
  /** YYYY-MM-DD */
  firstVisit: string;
  /** YYYY-MM-DD */
  lastVisit: string;
  visitCount: number;
  eventName: string;
  howHeard: string;
  followUps: RawFollowUpType[];
  /** YYYY-MM-DD or "" */
  lastFollowUp: string;
  stage: VisitorStage;
}

export const isoDay = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const visitorName = (visitor: Pick<VisitorType, "title" | "firstName" | "lastName">) =>
  [visitor.title, visitor.firstName, visitor.lastName].filter(Boolean).join(" ").trim() ||
  "Unnamed visitor";

export const visitorStage = (
  visitor: Pick<VisitorType, "is_member">,
  followUps: { status: string }[]
): VisitorStage => {
  if (visitor.is_member) return "member";
  return followUps.some((followUp) => isCompletedStatus(followUp.status)) ? "done" : "need";
};

const groupByVisitor = <T extends { visitorId: number | null }>(rows: T[]) => {
  const map = new Map<string, T[]>();
  rows.forEach((row) => {
    if (row.visitorId === null || row.visitorId === undefined) return;
    const key = String(row.visitorId);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  });
  return map;
};

const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), "");

export const buildVisitorRecords = (
  visitors: VisitorType[],
  visits: RawVisitType[],
  followUps: RawFollowUpType[]
): VisitorRecord[] => {
  const visitsBy = groupByVisitor(visits);
  const followUpsBy = groupByVisitor(followUps);
  return visitors.map((visitor) => {
    const id = String(visitor.id);
    const ownVisits = visitsBy.get(id) ?? [];
    const ownFollowUps = followUpsBy.get(id) ?? [];
    const firstVisit = isoDay(visitor.visitDate) || isoDay(visitor.createdAt);
    const lastVisit = latest([firstVisit, ...ownVisits.map((visit) => isoDay(visit.date))]);
    const name = visitorName(visitor);
    return {
      id,
      visitor,
      name,
      initials: initialsOf([visitor.firstName, visitor.lastName].filter(Boolean).join(" ")),
      phone: visitor.phone ? formatPhoneNumber(visitor.country_code, visitor.phone) : "—",
      firstVisit,
      lastVisit,
      visitCount: Math.max(visitor.visitCount || 0, ownVisits.length, 1),
      eventName: visitor.eventName || "",
      howHeard: visitor.howHeard || "",
      followUps: ownFollowUps,
      lastFollowUp:
        latest(ownFollowUps.map((followUp) => isoDay(followUp.date))) ||
        isoDay(visitor.followUp),
      stage: visitorStage(visitor, ownFollowUps),
    };
  });
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * Visitors joined with every visit and follow-up row, so the list can show the
 * last visit and follow-up status (the list endpoint only has counts).
 */
export const useVisitorRecords = (query?: QueryType) => {
  const visitorQuery = useMemo<QueryType>(() => ({ page: "1", take: "5000", ...query }), [query]);
  const visitorsFetch = useFetch(api.fetch.fetchAllVisitors, visitorQuery);
  const visitsFetch = useFetch(api.fetch.fetchVisitorVisits, undefined, false, { silent: true });
  const followUpsFetch = useFetch(api.fetch.fetchVisitorFollowUps, undefined, false, {
    silent: true,
  });

  const records = useMemo(
    () =>
      buildVisitorRecords(
        asArray<VisitorType>(visitorsFetch.data?.data),
        asArray<RawVisitType>(visitsFetch.data?.data),
        asArray<RawFollowUpType>(followUpsFetch.data?.data)
      ),
    [followUpsFetch.data, visitorsFetch.data, visitsFetch.data]
  );

  const { refetch: refetchVisitors } = visitorsFetch;
  const { refetch: refetchVisits } = visitsFetch;
  const { refetch: refetchFollowUps } = followUpsFetch;
  const refetch = useCallback(
    () => Promise.all([refetchVisitors(), refetchVisits(), refetchFollowUps()]),
    [refetchFollowUps, refetchVisitors, refetchVisits]
  );

  return {
    records,
    loaded: visitorsFetch.data !== null,
    loading: visitorsFetch.loading,
    error: visitorsFetch.error,
    refetch,
  };
};
