import axios from "@/axiosInstance";
import { useUserStore } from "@/store/userStore";
import { getToken } from "@/utils/helperFunctions";
import type { userTypeWithToken } from "@/utils/interfaces";
import { mergeUserPermissionSources } from "@/utils/userPermissions";

/**
 * Reactions to the backend's session events. `session.changed` means the
 * signed-in user's permissions, departments or profile changed: refetch and
 * merge exactly as login does. `session.revoked` means sign out everywhere.
 */

const SESSION_REFRESH_DEBOUNCE_MS = 500;

let refreshTimer: number | null = null;

const hasOwn = (value: unknown, key: string) =>
  !!value &&
  typeof value === "object" &&
  Object.prototype.hasOwnProperty.call(value, key);

const refreshCurrentUser = async () => {
  const startToken = getToken();
  if (!startToken) return;

  try {
    const response = await axios.get("user/current-user");
    // Ignore a response that outlived its session (logout or re-login).
    if (getToken() !== startToken) return;

    const state = useUserStore.getState();
    const payload = response.data;
    // When the response states `permissions` (null for non-admins) it is
    // authoritative, as the login token is: start from the same empty base
    // login uses so a removed access level clears. An older backend omits the
    // key; keep the stored permissions then rather than strip admins' access.
    const statesPermissions =
      hasOwn(payload?.data, "permissions") || hasOwn(payload, "permissions");
    const base = statesPermissions
      ? {
          ...(state as unknown as userTypeWithToken),
          permissions: null,
          access_permissions: undefined,
        }
      : (state as unknown as userTypeWithToken);
    state.setUser(mergeUserPermissionSources(base, payload));
  } catch {
    // The next 401/403 from the API handles a session that really changed.
  }
};

export const handleSessionChanged = () => {
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    void refreshCurrentUser();
  }, SESSION_REFRESH_DEBOUNCE_MS);
};

/** Same path as an expired session: AuthWrapper logs out (all tabs) and goes to /login. */
export const handleSessionRevoked = () => {
  window.dispatchEvent(
    new CustomEvent("app:session-expired", { detail: { message: "session revoked" } })
  );
};
