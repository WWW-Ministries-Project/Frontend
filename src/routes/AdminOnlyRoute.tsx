import { useAuth } from "@/context/AuthWrapper";
import { Navigate, useLocation } from "react-router-dom";

const normalizeCategory = (category?: string) =>
  category?.trim().toLowerCase() ?? "";

export const AdminOnlyRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = normalizeCategory(user.user_category) === "admin";
  if (isAdmin) return <>{children}</>;

  return (
    <Navigate
      to="/home/access-denied"
      replace
      state={{ from: location.pathname }}
    />
  );
};
