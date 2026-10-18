import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/utils";
import type {
  IMarket,
  IProductTypeResponse,
} from "@/utils/api/marketPlace/interface";

/**
 * Loads products (drafts included) for each market in parallel. The public
 * `list-products` endpoint hides drafts and ended markets, so admin screens
 * go market by market instead.
 */
export const useProductsByMarkets = (markets: IMarket[] | undefined) => {
  const [byMarket, setByMarket] = useState<Record<string, IProductTypeResponse[]>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const requestId = useRef(0);

  const ids = useMemo(() => (markets || []).map((m) => String(m.id)), [markets]);
  const ready = markets !== undefined;

  const load = useCallback(async () => {
    const current = ++requestId.current;
    if (!ids.length) {
      setByMarket({});
      setLoaded(ready);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      ids.map((id) =>
        api.fetch
          .fetchProductsByMarket({ market_id: id })
          .then((res) => [id, res?.data || []] as const)
          .catch(() => [id, [] as IProductTypeResponse[]] as const)
      )
    );
    if (current !== requestId.current) return;
    setByMarket(Object.fromEntries(results));
    setLoading(false);
    setLoaded(true);
  }, [ids, ready]);

  useEffect(() => {
    load();
  }, [load]);

  return { byMarket, loading, loaded, refetch: load };
};
