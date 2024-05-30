import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { routes } from "./appRoutes";
import { useContext } from "react";
import { AuthContext, AuthWrapper, useAuth } from "../auth/AuthWrapper";



export const RenderRoutes = () => {
    const navigate = useNavigate();
    const { name, email } = useAuth();
    return (
        <Routes>
            {routes.map((route, i) => {

                return <Route
                    key={i}
                    path={route.path}
                    element={route.isPrivate && name ? (
                        <Navigate to="/login" />
                      ) : (
                        route.element
                      )}
                >
                    {/* Render child routes */}
                    {route.children && (
                        <Route>
                            {route.children.map((childRoute, j) => (
                                <Route
                                    key={j}
                                    path={childRoute.path}
                                    element={childRoute.element}
                                />
                            ))}
                        </Route>
                    )}
                </Route>

            }
            )}
        </Routes>
    );
};

RenderRoutes.propTypes = {
    routes: PropTypes.arrayOf(
        PropTypes.shape({
            path: PropTypes.string.isRequired,
            element: PropTypes.elementType.isRequired,
            children: PropTypes.arrayOf(
                PropTypes.shape({
                    path: PropTypes.string.isRequired,
                    element: PropTypes.elementType.isRequired,
                })
            ),
        })
    ),
};

export default RenderRoutes;
