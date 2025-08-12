import { useAuth } from "@/context/AuthWrapper";
import { decodeToken, getToken } from "@/utils";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  const decodedToken = decodeToken(token)
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !decodedToken?.ministry_worker ) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [token, logout, navigate]);

  if (!token) return null;

  return <>{children}</>;
};
