import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthWrapper";
import { hasRequiredAccess } from "../utils/accessControl";
import { routes } from "./appRoutes";

const renderRoutes = (routes, permissions, accessPermissions) =>
  routes.map((route, i) => {
    const isForbidden =
      route.isPrivate &&
      !hasRequiredAccess(route.permissionNeeded, accessPermissions, permissions);

    return (
      <Route
        key={i}
        path={route.path}
        element={isForbidden ? <Navigate to="/home/access-denied" /> : route.element}
      >
        {route.children &&
          renderRoutes(route.children, permissions, accessPermissions)}
      </Route>
    );
  });

export const RenderRoutes = () => {
  const {
    user: { permissions, access_permissions },
  } = useAuth();

  return (
    <Routes>{renderRoutes(routes, permissions, access_permissions)}</Routes>
  );
};

export default RenderRoutes;
