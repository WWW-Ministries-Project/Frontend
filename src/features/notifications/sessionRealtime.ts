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

const refreshCurrentUser = async () => {
  if (!getToken()) return;

  try {
    const response = await axios.get("user/current-user");
    if (!getToken()) return;

    const state = useUserStore.getState();
    const merged = mergeUserPermissionSources(
      state as unknown as userTypeWithToken,
      response.data
    );
    state.setUser(merged);
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
