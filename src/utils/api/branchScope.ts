import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type { QueryType } from "../interfaces";

const BRANCH_SCOPED_ENDPOINTS = [
  "user/list-users",
  "user/list-users-light",
  "user/stats-users",
  "user/register",
  "department/",
  "position/",
  "assets/",
  "visitor/visitors",
  "visitor/visitor",
  "visitor/convert-to-member",
  "visit",
  "event/list-events",
  "event/list-events-light",
  "event/upcoming-events",
  "event/get-event",
  "event/church-attendance",
  "event/biometric-attendance",
  "event/import-biometric-attendance",
  "event/create-event",
  "event/update-event",
  "event-reports/",
  "requisitions/",
  "program/program",
  "program/programs",
  "program/get-member-programs",
  "lifecenter/",
  "market/",
  "appointment/availability",
  "appointment/book",
  "appointment/bookings",
  "theme/",
  "receiptconfig/",
  "paymentconfig/",
  "bankaccountconfig/",
  "tithebreakdownconfig/",
  "financials/",
] as const;

const isBranchScopedEndpoint = (path: string) =>
  BRANCH_SCOPED_ENDPOINTS.some((endpoint) =>
    endpoint.endsWith("/") ? path.startsWith(endpoint) : path === endpoint
  );

const getActiveBranchId = () => useBranchStore.getState().activeBranchId;

export const applyActiveBranchQuery = (
  path: string,
  query?: QueryType
): QueryType | undefined => {
  if (!isBranchScopedEndpoint(path) || query?.branch_id !== undefined) {
    return query;
  }

  const activeBranchId = getActiveBranchId();
  if (activeBranchId === ALL_BRANCHES) {
    return query;
  }

  return {
    ...(query || {}),
    branch_id: activeBranchId,
  };
};

export const applyActiveBranchPayload = <T>(path: string, payload: T): T => {
  if (!isBranchScopedEndpoint(path)) {
    return payload;
  }

  const activeBranchId = getActiveBranchId();
  if (activeBranchId === ALL_BRANCHES) {
    return payload;
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload instanceof FormData ||
    "branch_id" in payload
  ) {
    return payload;
  }

  return {
    ...payload,
    branch_id: activeBranchId,
  };
};
