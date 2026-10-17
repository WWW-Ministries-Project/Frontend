import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { AdminRideCatalog } from "@/utils/api/rides/interfaces";

const EMPTY_CATALOG: AdminRideCatalog = { areas: [], pickup_points: [] };

/** Every area (active or not) and every pickup point, for the catalog panels. */
export const useAdminRideCatalog = () => {
  const [catalog, setCatalog] = useState<AdminRideCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchRideAdminCatalog();
      if (requestId !== requestRef.current) return;
      const data = response.data;
      setCatalog({
        areas: Array.isArray(data?.areas) ? data.areas : [],
        pickup_points: Array.isArray(data?.pickup_points)
          ? data.pickup_points
          : [],
      });
    } catch {
      if (requestId === requestRef.current) setFailed(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { catalog, setCatalog, loading, failed, reload };
};
