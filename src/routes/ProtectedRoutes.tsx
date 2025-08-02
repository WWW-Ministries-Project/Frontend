import { useAuth } from "@/context/AuthWrapper";
import { getToken } from "@/utils";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [token, logout, navigate]);

  if (!token) return null;

  return <>{children}</>;
};
