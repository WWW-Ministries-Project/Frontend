import {
  hasRequiredAccess,
  PermissionRequirement,
  toManageRequirement,
} from "@/utils/accessControl";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { useAuth } from "./AuthWrapper";

type RouteAccessContextType = {
  requirement: PermissionRequirement;
  manageRequirement: PermissionRequirement;
  canManageCurrentRoute: boolean;
};

const RouteAccessContext = createContext<RouteAccessContextType>({
  requirement: undefined,
  manageRequirement: undefined,
  canManageCurrentRoute: true,
});

export const RouteAccessProvider = ({
  requirement,
  children,
}: {
  requirement: PermissionRequirement;
  children: ReactNode;
}) => {
  const {
    user: { permissions, access_permissions },
  } = useAuth();

  const manageRequirement = useMemo(
    () => toManageRequirement(requirement),
    [requirement]
  );

  const canManageCurrentRoute = useMemo(() => {
    if (!manageRequirement) return true;

    return hasRequiredAccess(
      manageRequirement,
      access_permissions,
      permissions
    );
  }, [manageRequirement, access_permissions, permissions]);

  const value = useMemo(
    () => ({
      requirement,
      manageRequirement,
      canManageCurrentRoute,
    }),
    [requirement, manageRequirement, canManageCurrentRoute]
  );

  return (
    <RouteAccessContext.Provider value={value}>
      {children}
    </RouteAccessContext.Provider>
  );
};

export const useRouteAccess = () => useContext(RouteAccessContext);
