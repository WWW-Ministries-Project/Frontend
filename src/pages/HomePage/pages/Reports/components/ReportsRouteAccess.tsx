import type { ReactNode } from "react";

import { RouteAccessProvider } from "@/context/RouteAccessContext";

import { REPORTS_DOMAIN_ACCESS } from "../utils/reportAccess";

/**
 * The Reports routes open on view of any module a report reads, so the route's
 * own "can manage" would count manage on any of those modules. Inside a
 * Reports page, manage and admin come from the Reports domain only; the
 * workflow buttons use the server's per-report flags.
 */
export const ReportsRouteAccess = ({ children }: { children: ReactNode }) => (
  <RouteAccessProvider requirement={REPORTS_DOMAIN_ACCESS}>{children}</RouteAccessProvider>
);
