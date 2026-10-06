import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { CommunityMe } from "@/utils/api/community/interfaces";

const EMPTY_ME: CommunityMe = {
  canManage: false,
  canModerate: false,
  departments: [],
  pendingReports: 0,
  unreadNotifications: 0,
};

/** Viewer context for Community (`GET /community/me`). Disabled for guests,
 *  who get 403 from every member endpoint. */
export const useCommunityMe = (enabled = true) => {
  const [me, setMe] = useState<CommunityMe>(EMPTY_ME);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await api.fetch.fetchCommunityMe();
      if (response.data) setMe({ ...EMPTY_ME, ...response.data });
    } catch {
      // Keep the defaults: no manage actions, no departments.
    } finally {
      setLoaded(true);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setUnread = useCallback((count: number) => {
    setMe((current) => ({ ...current, unreadNotifications: count }));
  }, []);

  return { me, loaded, refresh, setUnread };
};
