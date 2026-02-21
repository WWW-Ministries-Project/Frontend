import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthWrapper";
import { RouteAccessProvider } from "../context/RouteAccessContext";
import { hasRequiredAccess } from "../utils/accessControl";
import { routes } from "./appRoutes";

const renderRoutes = (routes, permissions, accessPermissions) =>
  routes.map((route, i) => {
    const hasRenderableElement = Boolean(route.element);
    const isForbidden =
      route.isPrivate &&
      hasRenderableElement &&
      !hasRequiredAccess(route.permissionNeeded, accessPermissions, permissions);

    const routeElement = hasRenderableElement ? (
      <RouteAccessProvider requirement={route.permissionNeeded}>
        {route.element}
      </RouteAccessProvider>
    ) : (
      route.element
    );

    return (
      <Route
        key={i}
        path={route.path}
        element={isForbidden ? <Navigate to="/home/access-denied" /> : routeElement}
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
