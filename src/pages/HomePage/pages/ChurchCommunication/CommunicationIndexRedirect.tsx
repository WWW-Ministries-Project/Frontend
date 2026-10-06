import { Navigate } from "react-router-dom";
import { useAccessControl } from "@/CustomHooks/useAccessControl";

/** Communication children in sidebar order, with the permission each needs.
 *  Keep in step with the "communication" children in appRoutes. */
const COMMUNICATION_PAGES = [
  { path: "theme-manager", permission: "view_theme" },
  { path: "community", permission: "view_community" },
  { path: "promotions", permission: "view_promotions" },
  { path: "sermons", permission: "view_sermons" },
];

/** /home/communication → the first page the user can open, so a user with
 *  only Community access is not sent to a Theme page they cannot see. */
const CommunicationIndexRedirect = () => {
  const { hasPermission } = useAccessControl();
  const target = COMMUNICATION_PAGES.find((page) =>
    hasPermission(page.permission)
  );

  return (
    <Navigate to={target ? target.path : "/home/access-denied"} replace />
  );
};

export default CommunicationIndexRedirect;
