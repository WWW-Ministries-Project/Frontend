import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { RideCatalog } from "@/utils/api/rides/interfaces";
import { isMembersOnlyError } from "../utils/rideHelpers";

/** Areas, pickup points, departure times, reasons and the events taking rides
 *  (`GET /rides/catalog`), for one event — the soonest without `eventId`.
 *  Keeps the last catalog on screen while another event's loads. */
export const useRideCatalog = (enabled = true, eventId: number | null = null) => {
  const [catalog, setCatalog] = useState<RideCatalog | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const request = ++requestRef.current;
    try {
      const response = await api.fetch.fetchRideCatalog(eventId);
      if (request !== requestRef.current) return;
      setCatalog(response.data ?? null);
      setError(null);
    } catch (caught) {
      // ApiErrorHandler has already shown the backend's message.
      if (request === requestRef.current) setError(caught);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    refresh();
    return () => {
      // Drop answers that arrive after unmount.
      requestRef.current += 1;
    };
  }, [refresh]);

  // Seats or offers changed somewhere: open-ride counts may be stale.
  useEffect(() => {
    if (!enabled) return;
    const onRidesChanged = () => {
      void refresh();
    };
    window.addEventListener("app:rides-changed", onRidesChanged);
    return () => window.removeEventListener("app:rides-changed", onRidesChanged);
  }, [enabled, refresh]);

  return {
    catalog,
    loading,
    error,
    membersOnly: isMembersOnlyError(error),
    refresh,
  };
};
