import { createContext, useContext, useState } from "react";
// import RenderRoutes from "/src/routes/RenderRoutes";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthWrapper");
  return context;
};

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const storedUser = JSON.parse(
    sessionStorage.getItem("user") || JSON.stringify(defaultValue)
  );
  const [user, setUser] = useState<userType>(storedUser);

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
    const { setVisible } = useNotificationStore.getState();
    setVisible(false);
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
