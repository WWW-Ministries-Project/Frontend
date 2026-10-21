import { lazy } from "react";

// Settings pages load on first visit to keep the main bundle under the PWA precache limit.
export const GeneralConfiguration = lazy(() => import("./general/GeneralConfiguration"));
export const AccessRightsList = lazy(() => import("./access/AccessRightsList"));
export const RoleDetail = lazy(() => import("./access/RoleDetail"));
export const UsersPage = lazy(() => import("./users/UsersPage"));
export const ApprovalsPage = lazy(() => import("./approvals/ApprovalsPage"));
