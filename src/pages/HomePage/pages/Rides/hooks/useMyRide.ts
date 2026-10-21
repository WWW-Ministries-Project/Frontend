import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { MyRide } from "@/utils/api/rides/interfaces";
import { isAwaitingDecision, isMembersOnlyError } from "../utils/rideHelpers";

const POLL_MS = 30_000;

interface UseMyRideOptions {
  enabled?: boolean;
  /** Poll while a request is pending on either side, so an accept/decline
   *  shows up without a push. */
  pollWhilePending?: boolean;
  /** The event to ask about; without it the server picks the soonest event
   *  the member rides to, else the soonest event. */
  eventId?: number | null;
}

/** The member's ride to one church event (`GET /rides/mine`). Refetches when
 *  the window regains focus and when the realtime connector reports a ride
 *  change (`app:rides-changed`). */
export const useMyRide = ({
  enabled = true,
  pollWhilePending = false,
  eventId = null,
}: UseMyRideOptions = {}) => {
  const [myRide, setMyRide] = useState<MyRide | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const request = ++requestRef.current;
    try {
      const response = await api.fetch.fetchMyRide(eventId);
      if (request !== requestRef.current) return;
      setMyRide(response.data ?? null);
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
      requestRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onRidesChanged = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("app:rides-changed", onRidesChanged);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("app:rides-changed", onRidesChanged);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [enabled, refresh]);

  const shouldPoll = pollWhilePending && isAwaitingDecision(myRide);
  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPoll, refresh]);

  /** Mutations that answer with the fresh `MyRide` can apply it directly. */
  const apply = useCallback((next: MyRide | null | undefined) => {
    if (!next) return;
    requestRef.current += 1;
    setMyRide(next);
    setError(null);
    setLoading(false);
  }, []);

  return {
    myRide,
    loading,
    error,
    membersOnly: isMembersOnlyError(error),
    refresh,
    apply,
  };
};
