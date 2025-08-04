import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { useUserStore } from "@/store/userStore";
import { userType } from "@/utils/interfaces";
import PropTypes from "prop-types";
import { createContext, useContext } from "react";

type contextType = {
  user: userType;
  login: (
    data: Omit<userType, "permissions"> & {
      permissions: Record<string, string>;
    }
  ) => void;
  logout: () => void;
};

export const AuthContext = createContext<contextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthWrapper");
  return context;
};

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((state) => ({
    id: state.id,
    name: state.name,
    email: state.email,
    phone: state.phone,
    permissions: state.permissions,
    profile_img: state.profile_img,
    member_since: state.member_since,
    membership_type: state.membership_type,
    department: state.department,
  }));

  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const login = (
    data: Omit<userType, "permissions"> & {
      permissions: Record<string, string>;
    }
  ) => {
    setUser(data);
  };

  const logout = () => {
    clearUser();
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
