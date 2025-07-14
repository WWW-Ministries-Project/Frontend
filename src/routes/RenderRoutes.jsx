import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthWrapper";
import { routes } from "./appRoutes";

const renderRoutes = (routes, permissions) =>
  routes.map((route, i) => {
    const isForbidden =
      route.isPrivate && !permissions[route.permissionNeeded];

    return (
      <Route
        key={i}
        path={route.path}
        element={isForbidden ? <Navigate to="/home/access-denied" /> : route.element}
      >
        {route.children && renderRoutes(route.children, permissions)}
      </Route>
    );
  });

export const RenderRoutes = () => {
  const {
    user: { permissions },
  } = useAuth();

  return <Routes>{renderRoutes(routes, permissions)}</Routes>;
};

export default RenderRoutes;
