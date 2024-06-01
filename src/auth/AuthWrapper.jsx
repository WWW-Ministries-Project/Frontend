import { createContext, useContext, useState } from "react";
// import RenderRoutes from "/src/routes/RenderRoutes";
import PropTypes from "prop-types";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthWrapper = ({ children }) => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    const [user, setUser] = useState(storedUser ||{ name: "", email: "", permissions: {} });

    const login = ({name,permissions={}}) => {
        sessionStorage.setItem("user", JSON.stringify({name,permissions}));
        setUser({name,permissions});
    };
    const logout = () => {
        setUser({ name: "", email: "", permissions: {} });
        sessionStorage.removeItem('user')
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