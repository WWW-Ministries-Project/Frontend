import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { convertPermissions } from "@/utils/helperFunctions";
import { userType } from "@/utils/interfaces";

type UserState = userType;

type UserActions = {
  setUser: (
    data: Omit<userType, "permissions"> & {
      permissions: Record<string, string> | Record<string, boolean>;
    }
  ) => void;
  clearUser: () => void;
};

// Type to persist (user state only, excluding methods)
type PersistedUserState = Omit<UserState, keyof UserActions>;

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      id: "",
      name: "",
      email: "",
      phone: "",
      permissions: {},
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
        profile_img,
        member_since,
        membership_type,
        ministry_worker,
        department,
        permissions,
      }) => {
        const permissionValues = Object.values(permissions || {});
        const hasBooleanPermissions = permissionValues.every(
          (value) => typeof value === "boolean"
        );

        set({
          id,
          name,
          email,
          phone,
          profile_img,
          member_since,
          membership_type,
          ministry_worker,
          department,
          permissions: permissions
            ? hasBooleanPermissions
              ? (permissions as Record<string, boolean>)
              : convertPermissions(permissions as Record<string, string>)
            : {},
        });
      },

      clearUser: () =>
        set({
          id: "",
          name: "",
          email: "",
          phone: "",
          permissions: {},
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
        const {
          setUser,
          clearUser,
          ...persistedState
        } = state as UserState & Partial<UserActions>; 
        return persistedState;
      },
    }
  )
);
