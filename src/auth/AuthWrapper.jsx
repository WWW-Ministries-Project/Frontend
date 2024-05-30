import { createContext, useContext, useState } from "react";
// import RenderRoutes from "/src/routes/RenderRoutes";
import PropTypes from "prop-types";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthWrapper = ({ children }) => {
    const [user, setUser] = useState({ name: "", email: "" });
    const login = (name, email) => {
        setUser({ name, email });
    };
    const logout = () => {
        setUser({ name: "", email: "" });
    };
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {/* <RenderRoutes /> */}
            {children}
        </AuthContext.Provider>
    )
}
AuthWrapper.propTypes = {
    children: PropTypes.node.isRequired
};