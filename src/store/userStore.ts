import {
  flattenPermissionsToLegacyFlags,
  LegacyPermissionMap,
  normalizePermissionPayload,
  PermissionMap,
} from "@/utils/accessControl";
import { useBranchStore } from "@/store/useBranchStore";
import { resolveBranchPermissions, resolveBranchWorkspaces } from "@/utils/branchAccess";
import type { WorkspaceKey } from "@/utils/api/workspaces/interfaces";
import { userType } from "@/utils/interfaces";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UserState = userType;

type UserActions = {
  setUser: (
    data: Omit<userType, "permissions" | "access_permissions"> & {
      permissions?:
        | PermissionMap
        | Record<string, boolean>
        | string[]
        | null;
      access_permissions?: PermissionMap | null;
    }
  ) => void;
  clearUser: () => void;
};

type PersistedUserState = Omit<UserState, keyof UserActions>;

const allValuesAreBoolean = (value: unknown): value is Record<string, boolean> => {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every((item) => typeof item === "boolean");
};

const toLegacyPermissionMap = (value: unknown): LegacyPermissionMap => {
  if (!value) return {};

  if (Array.isArray(value)) {
    return value.reduce<LegacyPermissionMap>((acc, entry) => {
      if (typeof entry === "string" && entry.trim()) {
        acc[entry.trim()] = true;
      }
      return acc;
    }, {});
  }

  if (allValuesAreBoolean(value)) {
    return value;
  }

  if (!value || typeof value !== "object") return {};

  return Object.entries(value as Record<string, unknown>).reduce<LegacyPermissionMap>(
    (acc, [key, entry]) => {
      if (entry === true) {
        acc[key] = true;
      } else if (
        typeof entry === "string" &&
        ["true", "1", "yes"].includes(entry.trim().toLowerCase())
      ) {
        acc[key] = true;
      }
      return acc;
    },
    {}
  );
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      id: "",
      member_id: "",
      name: "",
      email: "",
      phone: null,
      user_category: "",
      permissions: {},
      access_permissions: {},
      profile_img: undefined,
      member_since: undefined,
      membership_type: "",
      ministry_worker: false,
      department: undefined,
      department_positions: [],
      life_center_leader: false,
      instructor: false,
      is_guest: null,
      branch_id: null,
      branch_name: null,
      branch_access: [],

      setUser: ({
        id,
        member_id,
        name,
        email,
        phone,
        user_category,
        profile_img,
        member_since,
        membership_type,
        ministry_worker,
        department,
        department_positions,
        life_center_leader,
        instructor,
        is_guest,
        branch_id,
        branch_name,
        branch_access,
        permissions,
        access_permissions,
      }) => {
        // Roles are per branch: when the API sent each branch's permissions,
        // the active branch's role decides what the UI offers.
        const branchPermissions = resolveBranchPermissions(
          branch_access,
          useBranchStore.getState().activeBranchId
        );
        const legacyPermissionPayload = branchPermissions
          ? {}
          : toLegacyPermissionMap(permissions);
        const explicitPermissionPayload =
          branchPermissions ??
          access_permissions ??
          (Array.isArray(permissions) ? undefined : permissions) ??
          {};
        const normalizedPermissionPayload = normalizePermissionPayload(
          explicitPermissionPayload as PermissionMap
        );

        const hasCanonicalPermissionDomains = Object.keys(
          normalizedPermissionPayload
        ).some((key) => key !== "Exclusions");

        const legacyPermissions = hasCanonicalPermissionDomains
          ? {
              ...legacyPermissionPayload,
              ...flattenPermissionsToLegacyFlags(normalizedPermissionPayload),
            }
          : Object.keys(legacyPermissionPayload).length > 0
            ? legacyPermissionPayload
            : flattenPermissionsToLegacyFlags(normalizedPermissionPayload);

        set({
          id: id ? String(id) : "",
          member_id: member_id ? String(member_id) : "",
          name,
          email,
          phone: phone ?? null,
          user_category,
          profile_img,
          member_since: member_since ?? null,
          membership_type,
          ministry_worker,
          department,
          department_positions,
          life_center_leader: Boolean(life_center_leader),
          instructor: Boolean(instructor),
          is_guest: is_guest ?? null,
          branch_id: branch_id ?? null,
          branch_name: branch_name ?? null,
          branch_access: Array.isArray(branch_access) ? branch_access : [],
          permissions: legacyPermissions ?? {},
          access_permissions: normalizedPermissionPayload,
        });
      },

      clearUser: () =>
        set({
          id: "",
          member_id: "",
          name: "",
          email: "",
          phone: null,
          user_category: "",
          permissions: {},
          access_permissions: {},
          profile_img: undefined,
          member_since: undefined,
          membership_type: "",
          ministry_worker: false,
          department: undefined,
          department_positions: [],
          life_center_leader: false,
          instructor: false,
          is_guest: null,
          branch_id: null,
          branch_name: null,
          branch_access: [],
        }),
    }),
    {
      name: "user",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): PersistedUserState => {
        const { setUser: _setUser, clearUser: _clearUser, ...persistedState } =
          state as UserState & Partial<UserActions>;
        return persistedState;
      },
    }
  )
);

/** Home workspaces the signed-in user's role grants in the active branch. */
export const useActiveWorkspaces = (): WorkspaceKey[] => {
  const grants = useUserStore((state) => state.branch_access);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  return useMemo(
    () => resolveBranchWorkspaces(grants, activeBranchId),
    [grants, activeBranchId]
  );
};
