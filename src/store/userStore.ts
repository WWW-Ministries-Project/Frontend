import {
  flattenPermissionsToLegacyFlags,
  LegacyPermissionMap,
  normalizePermissionPayload,
  PermissionMap,
} from "@/utils/accessControl";
import { userType } from "@/utils/interfaces";
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
      name: "",
      email: "",
      phone: "",
      user_category: "",
      permissions: {},
      access_permissions: {},
      profile_img: undefined,
      member_since: undefined,
      membership_type: "",
      ministry_worker: false,
      department: undefined,

      setUser: ({
        id,
        name,
        email,
        phone,
        user_category,
        profile_img,
        member_since,
        membership_type,
        ministry_worker,
        department,
        permissions,
        access_permissions,
      }) => {
        const legacyPermissionPayload = toLegacyPermissionMap(permissions);
        const explicitPermissionPayload =
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
          id,
          name,
          email,
          phone,
          user_category,
          profile_img,
          member_since,
          membership_type,
          ministry_worker,
          department,
          permissions: legacyPermissions ?? {},
          access_permissions: normalizedPermissionPayload,
        });
      },

      clearUser: () =>
        set({
          id: "",
          name: "",
          email: "",
          phone: "",
          user_category: "",
          permissions: {},
          access_permissions: {},
          profile_img: undefined,
          member_since: undefined,
          membership_type: "",
          ministry_worker: false,
          department: undefined,
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
