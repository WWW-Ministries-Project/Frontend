import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { JoinRequestRow } from "@/utils/api/departmentJoinRequests/interfaces";
import type { MembershipRequestRow } from "@/utils/api/guests/interfaces";
import type { VisitorType } from "@/utils/api/visitors/interfaces";

import {
  extractVisitors,
  getVisitorMemberLinkId,
  ManagerMember,
  SoulwonRecord,
  unconvertedSouls,
} from "./managerHelpers";

/**
 * All data behind the Membership manager is loaded once by the shell and shared
 * with the tab routes through the outlet context. The tab counts need the same
 * lists the tabs render (and soul-winning matching needs the member list), so
 * lifting them avoids fetching the large member/visitor lists twice.
 */

const MEMBERS_QUERY = { take: 5000 };
const VISITORS_QUERY = { take: 5000 };
const SILENT = { silent: true };

export interface ManagerData {
  members: ManagerMember[];
  membersLoading: boolean;
  refetchMembers: () => Promise<unknown>;

  visitors: VisitorType[];
  visitorsLoading: boolean;

  souls: SoulwonRecord[];
  soulsLoading: boolean;
  soulsError: boolean;

  guestRequests: MembershipRequestRow[];
  guestTotal: number;
  guestsLoading: boolean;
  refetchGuests: () => Promise<unknown>;

  joinRequests: JoinRequestRow[];
  joinsLoading: boolean;
  refetchJoins: () => Promise<unknown>;

  /**
   * Which tabs the caller may open. Visitors and souls won are only loaded
   * with Visitors / Life centers view; the guest queue with View pipelines.
   */
  access: {
    visitors: boolean;
    souls: boolean;
    guests: boolean;
  };

  counts: {
    confirm: number | null;
    visitors: number | null;
    souls: number | null;
    guests: number | null;
    joins: number | null;
  };
}

export const useManagerDataSource = (): ManagerData => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const { canView, hasAction } = useAccessControl();
  const access = useMemo(
    () => ({
      visitors: canView("Visitors"),
      souls: canView("Life Center"),
      guests: hasAction("Membership_Management.view_pipelines"),
    }),
    [canView, hasAction]
  );

  const membersFetch = useFetch(api.fetch.fetchAllMembers, MEMBERS_QUERY, false, SILENT);
  const visitorsFetch = useFetch(
    api.fetch.fetchAllVisitors,
    VISITORS_QUERY,
    !access.visitors,
    SILENT
  );
  const soulsFetch = useFetch(api.fetch.fetchSoulsWon, undefined, !access.souls, SILENT);

  const guestQuery = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), status: "PENDING", take: "500" }),
    [activeBranchId]
  );
  const guestsFetch = useFetch(
    api.fetch.fetchMembershipRequests,
    guestQuery,
    !access.guests,
    SILENT
  );

  // `ALL` is not a known status, so the list endpoint returns every request.
  const joinQuery = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), status: "ALL" }),
    [activeBranchId]
  );
  const joinsFetch = useFetch(api.fetch.fetchJoinRequests, joinQuery, false, SILENT);

  const members = useMemo(
    () => (membersFetch.data?.data ?? []) as ManagerMember[],
    [membersFetch.data]
  );

  const visitors = useMemo(
    () =>
      extractVisitors(visitorsFetch.data?.data)
        .filter((visitor) => !visitor.is_member && !getVisitorMemberLinkId(visitor))
        .sort(
          (left, right) =>
            Number(Boolean(right.membershipWish)) - Number(Boolean(left.membershipWish))
        ),
    [visitorsFetch.data]
  );

  const allSouls = useMemo<SoulwonRecord[]>(
    () =>
      (soulsFetch.data?.data ?? [])
        .map((record) => ({
          ...record,
          lifeCenterName: record.lifeCenter?.name || "Unnamed life center",
        }))
        .sort(
          (left, right) =>
            new Date(right.date_won || 0).getTime() - new Date(left.date_won || 0).getTime()
        ),
    [soulsFetch.data]
  );
  const souls = useMemo(() => unconvertedSouls(allSouls, members), [allSouls, members]);

  const guestRequests = useMemo(
    () => (guestsFetch.data?.data?.items ?? []).filter((row) => row.status === "PENDING"),
    [guestsFetch.data]
  );
  const guestTotal = guestsFetch.data?.data?.total ?? guestRequests.length;

  const joinRequests = useMemo(() => joinsFetch.data?.data ?? [], [joinsFetch.data]);

  const counts = useMemo(
    () => ({
      confirm: membersFetch.data
        ? members.filter(
            (member) => member.is_active !== false && member.status !== "MEMBER"
          ).length
        : null,
      visitors: visitorsFetch.data ? visitors.length : null,
      souls: soulsFetch.data && membersFetch.data ? souls.length : null,
      guests: guestsFetch.data ? guestTotal : null,
      joins: joinsFetch.data
        ? joinRequests.filter((row) => row.status === "PENDING").length
        : null,
    }),
    [
      membersFetch.data,
      members,
      visitorsFetch.data,
      visitors,
      soulsFetch.data,
      souls,
      guestsFetch.data,
      guestTotal,
      joinsFetch.data,
      joinRequests,
    ]
  );

  return {
    access,
    members,
    membersLoading: membersFetch.loading,
    refetchMembers: () => membersFetch.refetch(),
    visitors,
    visitorsLoading: visitorsFetch.loading,
    souls,
    soulsLoading: soulsFetch.loading || membersFetch.loading,
    soulsError: Boolean(soulsFetch.error),
    guestRequests,
    guestTotal,
    guestsLoading: guestsFetch.loading,
    refetchGuests: () => guestsFetch.refetch(),
    joinRequests,
    joinsLoading: joinsFetch.loading,
    refetchJoins: () => joinsFetch.refetch(),
    counts,
  };
};

/** Read the shell's shared data from a Membership manager tab. */
export const useManagerData = () => useOutletContext<ManagerData>();
