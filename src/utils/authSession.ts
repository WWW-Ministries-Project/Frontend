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
    total: 0,
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
};
