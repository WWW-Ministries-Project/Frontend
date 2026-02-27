import { useUserStore } from "@/store/userStore";
import { clearAuthSession, resetProtectedAppState } from "@/utils/authSession";
import { getToken } from "@/utils/helperFunctions";
import { userType, userTypeWithToken } from "@/utils/interfaces";
import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type contextType = {
  user: userType;
  login: (data: userType | userTypeWithToken) => void;
  logout: () => void;
};

export const AuthContext = createContext<contextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthWrapper");
  return context;
};

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => ({
    id: state.id,
    name: state.name,
    email: state.email,
    phone: state.phone,
    user_category: state.user_category,
    permissions: state.permissions,
    access_permissions: state.access_permissions,
    profile_img: state.profile_img,
    member_since: state.member_since,
    membership_type: state.membership_type,
    ministry_worker: state.ministry_worker,
    department: state.department,
  }));

  const setUser = useUserStore((state) => state.setUser);

  const login = useCallback((data: userType | userTypeWithToken) => {
    resetProtectedAppState();
    setUser(data);
  }, [setUser]);

  const logout = useCallback(() => {
    clearAuthSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      navigate("/login", { replace: true });
    };

    const handleAccessDenied = () => {
      const token = getToken();
      if (!token) return;

      const currentPath = window.location.pathname;
      const isAuthPath =
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/forgot-password") ||
        currentPath.startsWith("/reset-password");

      if (isAuthPath || currentPath.startsWith("/home/access-denied")) return;

      navigate("/home/access-denied", { replace: true });
    };

    window.addEventListener("app:session-expired", handleSessionExpired);
    window.addEventListener("app:access-denied", handleAccessDenied);

    return () => {
      window.removeEventListener("app:session-expired", handleSessionExpired);
      window.removeEventListener("app:access-denied", handleAccessDenied);
    };
  }, [logout, navigate]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};
