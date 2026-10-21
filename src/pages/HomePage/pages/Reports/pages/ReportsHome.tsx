import { Navigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";

import { DEPARTMENT_REPORTS_ACCESS } from "../utils/reportAccess";

/** /home/reports opens the most senior page the viewer can see. */
const ReportsHome = () => {
  const { canView, hasPermission } = useAccessControl();
  const to = canView("Reports")
    ? "executive-summary"
    : hasPermission(DEPARTMENT_REPORTS_ACCESS)
      ? "department"
      : "event-reports";
  return <Navigate to={`/home/reports/${to}`} replace />;
};

export default ReportsHome;
