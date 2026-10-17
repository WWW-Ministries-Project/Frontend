import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { RideCatalog } from "@/utils/api/rides/interfaces";
import { isMembersOnlyError } from "../utils/rideHelpers";

/** Areas, pickup points, departure times and reasons (`GET /rides/catalog`). */
export const useRideCatalog = (enabled = true) => {
  const [catalog, setCatalog] = useState<RideCatalog | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const request = ++requestRef.current;
    try {
      const response = await api.fetch.fetchRideCatalog();
      if (request !== requestRef.current) return;
      setCatalog(response.data ?? null);
      setError(null);
    } catch (caught) {
      // ApiErrorHandler has already shown the backend's message.
      if (request === requestRef.current) setError(caught);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    return () => {
      // Drop answers that arrive after unmount.
      requestRef.current += 1;
    };
  }, [refresh]);

  return {
    catalog,
    loading,
    error,
    membersOnly: isMembersOnlyError(error),
    refresh,
  };
};
