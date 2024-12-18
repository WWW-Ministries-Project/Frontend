import { createContext, useContext, useState } from "react";
// import RenderRoutes from "/src/routes/RenderRoutes";
import { convertPermissions } from "@/utils/helperFunctions";
import { userType } from "@/utils/interfaces";
import PropTypes from "prop-types";

type contextType = {
  user: userType;
  login: ({
    name,
    email,
    id,
    permissions,
  }: Omit<userType, "permissions"> & {
    permissions: Record<string, string>;
  }) => void;
  logout: () => void;
};

const defaultValue: userType = {
  name: "name",
  email: "email",
  permissions: {},
  id: "",
};
export const AuthContext = createContext<contextType | null>(null);
export const useAuth = () => useContext(AuthContext);

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const storedUser = JSON.parse(
    sessionStorage.getItem("user") || JSON.stringify(defaultValue)
  );
  const [user, setUser] = useState<
    Omit<userType, "permissions"> & { permissions: Record<string, boolean> }
  >(storedUser);

  const login = ({
    name,
    email,
    id,
    permissions = {},
  }: Omit<userType, "permissions"> & {
    permissions: Record<string, string>;
  }) => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        name,
        permissions: convertPermissions(permissions),
        email,
        id,
      })
    );
    setUser({ name, permissions: convertPermissions(permissions), email, id });
    // useUserStore.setState({ name, permissions, email, id });
  };
  const logout = () => {
    setUser({ name: "", email: "", permissions: {}, id: "" });
    sessionStorage.removeItem("user");
  };
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};
