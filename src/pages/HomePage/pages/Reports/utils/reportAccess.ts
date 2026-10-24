import type { PermissionRequirement } from "@/utils/accessControl";

/**
 * Modules each department report reads; viewing one lets you open its report.
 * Departments view covers department attendance reports (`dept_att:<id>`).
 * The server filters the list to what the viewer may read.
 */
export const DEPARTMENT_REPORTS_ACCESS: PermissionRequirement = [
  { domain: "Reports", action: "view" },
  { domain: "Departments", action: "view" },
  { domain: "Membership_Management", action: "view" },
  { domain: "Visitors", action: "view" },
  { domain: "Events", action: "view" },
  { domain: "Church_Attendance", action: "view" },
  { domain: "Asset", action: "view" },
  { domain: "Financials", action: "view" },
  { domain: "Life Center", action: "view" },
];

export const REPORTS_MENU_ACCESS: PermissionRequirement = DEPARTMENT_REPORTS_ACCESS;
export const EXECUTIVE_SUMMARY_ACCESS: PermissionRequirement = { domain: "Reports", action: "view" };
