import { createContext, useContext, useState } from "react";
// import RenderRoutes from "/src/routes/RenderRoutes";
import PropTypes from "prop-types";
import { useUserStore } from "../store/userStore";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthWrapper = ({ children }) => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    const [user, setUser] = useState(storedUser ||{ name: "", email: "", permissions: {}, id: "" });

    const login = ({name,email, id, permissions={}}) => {
        sessionStorage.setItem("user", JSON.stringify({name,permissions,email, id}));
        setUser({name,permissions,email, id});
        useUserStore.setState({name,permissions,email, id});
    };
    const logout = () => {
        setUser({ name: "", email: "", permissions: {}, id: "" });
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