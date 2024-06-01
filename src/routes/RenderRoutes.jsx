import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthWrapper";
import { routes } from "./appRoutes";

export const RenderRoutes = () => {
    const { user: { permissions } } = useAuth();
    
    return (
        <Routes>
            {routes.map((route, i) => (
                <Route
                    key={i}
                    path={route.path}
                    element={route.isPrivate && !permissions[route.permissionNeeded] ? (
                        <Navigate to="/login" />
                    ) : (
                        route.element
                    )}
                >
                    {/* Render child routes */}
                    {route.children && route.children.map((childRoute, j) => (
                        <Route
                            key={j}
                            path={childRoute.path}
                            element={childRoute.isPrivate && !permissions[childRoute.permissionNeeded] ? (
                                <Navigate to="/login" />
                            ) : (
                                childRoute.element
                            )}
                        />
                    ))}
                </Route>
            ))}
        </Routes>
    );
};

export default RenderRoutes;
