import { clearNotificationRealtimeStorage } from "@/features/notifications/realtimeStorageKeys";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { useProgramsStore } from "@/pages/HomePage/pages/MinistrySchool/store/programsStore";
import { UserStats } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import { useStore } from "@/store/useStore";
import { useUserStore } from "@/store/userStore";
import { removeToken } from "@/utils/helperFunctions";

const INITIAL_USER_STATS: UserStats = {
  online: {
    total_members: 0,
    total_males: 0,
    total_females: 0,
    stats: {
      children: { Total: 0, Male: 0, Female: 0 },
      adults: { Total: 0, Male: 0, Female: 0 },
    },
  },
  inhouse: {
    total_members: 0,
    total_males: 0,
    total_females: 0,
    stats: {
      children: { Total: 0, Male: 0, Female: 0 },
      adults: { Total: 0, Male: 0, Female: 0 },
    },
  },
};

/** Window event fired in the current tab as soon as the session is cleared. */
export const AUTH_SESSION_CLEARED_EVENT = "app:auth-session-cleared";

/**
 * localStorage key used to broadcast a logout to the other tabs of the same
 * browser. The auth cookie is shared across tabs, so once one tab signs out
 * every other tab is unauthenticated too and must stop calling the API.
 */
export const AUTH_LOGOUT_BROADCAST_KEY = "churchproject.auth.logout";

const broadcastAuthSessionCleared = (): void => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CLEARED_EVENT));

  try {
    localStorage.setItem(AUTH_LOGOUT_BROADCAST_KEY, String(Date.now()));
    localStorage.removeItem(AUTH_LOGOUT_BROADCAST_KEY);
  } catch {
    // Ignore storage failures; the in-tab event still fired.
  }
};

export const resetProtectedAppState = (): void => {
  useStore.setState({
    events: [],
    eventsOptions: [],
    upcomingEvents: [],
    membersOptions: [],
    userStats: INITIAL_USER_STATS,
    familyByMemberId: {},
    rows: [],
    requests: [],
    products: [],
    loading: false,
    error: null,
  });

  useSettingsStore.setState({
    departments: [],
    positions: [],
    departmentsOptions: [],
    positionOptions: {},
  });

  useProgramsStore.getState().clearSelection();
  useCart.getState().clearCart();
  useCart.setState({ cartOpen: false });
  useInAppNotificationStore.getState().reset();
};

export const clearAuthSession = (): void => {
  removeToken();
  useUserStore.getState().clearUser();
  resetProtectedAppState();
  useNotificationStore.getState().setVisible(false);
  clearNotificationRealtimeStorage();
  broadcastAuthSessionCleared();
};
