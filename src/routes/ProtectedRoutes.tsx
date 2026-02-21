import { useAuth } from "@/context/AuthWrapper";
import { getToken } from "@/utils";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  const { logout } = useAuth();

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [token, logout]);

  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
