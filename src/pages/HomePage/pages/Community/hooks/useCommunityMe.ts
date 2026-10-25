import { useCallback, useEffect, useState } from "react";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import { NO_COMMUNITY_ACTIONS, type CommunityMe } from "@/utils/api/community/interfaces";

const EMPTY_ME: CommunityMe = {
  canManage: false,
  canModerate: false,
  actions: NO_COMMUNITY_ACTIONS,
  departments: [],
  pendingReports: 0,
  unreadNotifications: 0,
};

/** Viewer context for Community (`GET /community/me`). Disabled for guests,
 *  who get 403 from every member endpoint. */
export const useCommunityMe = (enabled = true) => {
  const [me, setMe] = useState<CommunityMe>(EMPTY_ME);
  const [loaded, setLoaded] = useState(false);
  // Actions come from the active branch's role, so reload on a switch.
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await api.fetch.fetchCommunityMe();
      if (response.data) {
        setMe({
          ...EMPTY_ME,
          ...response.data,
          actions: { ...NO_COMMUNITY_ACTIONS, ...response.data.actions },
        });
      }
    } catch {
      // Keep the defaults: no manage actions, no departments.
    } finally {
      setLoaded(true);
    }
    // activeBranchId only triggers the reload; the request reads the branch itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activeBranchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setUnread = useCallback((count: number) => {
    setMe((current) => ({ ...current, unreadNotifications: count }));
  }, []);

  return { me, loaded, refresh, setUnread };
};
