import {
  hasRequiredAccess,
  PermissionRequirement,
  toAdminRequirement,
  toManageRequirement,
} from "@/utils/accessControl";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { useAuth } from "./AuthWrapper";

type RouteAccessContextType = {
  requirement: PermissionRequirement;
  manageRequirement: PermissionRequirement;
  adminRequirement: PermissionRequirement;
  canManageCurrentRoute: boolean;
  canAdminCurrentRoute: boolean;
};

const RouteAccessContext = createContext<RouteAccessContextType>({
  requirement: undefined,
  manageRequirement: undefined,
  adminRequirement: undefined,
  canManageCurrentRoute: true,
  canAdminCurrentRoute: true,
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
  const adminRequirement = useMemo(
    () => toAdminRequirement(requirement),
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

  const canAdminCurrentRoute = useMemo(() => {
    if (!adminRequirement) return true;

    return hasRequiredAccess(
      adminRequirement,
      access_permissions,
      permissions
    );
  }, [adminRequirement, access_permissions, permissions]);

  const value = useMemo(
    () => ({
      requirement,
      manageRequirement,
      adminRequirement,
      canManageCurrentRoute,
      canAdminCurrentRoute,
    }),
    [
      requirement,
      manageRequirement,
      adminRequirement,
      canManageCurrentRoute,
      canAdminCurrentRoute,
    ]
  );

  return (
    <RouteAccessContext.Provider value={value}>
      {children}
    </RouteAccessContext.Provider>
  );
};

export const useRouteAccess = () => useContext(RouteAccessContext);
