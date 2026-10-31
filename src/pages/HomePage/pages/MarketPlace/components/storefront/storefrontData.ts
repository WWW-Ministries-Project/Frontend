import { createContext, useContext, useMemo } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { api, type IDeliveryConfig, type IMarket, type IProductTypeResponse } from "@/utils";

export interface StorefrontData {
  products: IProductTypeResponse[];
  markets: IMarket[];
  deliveryConfig: IDeliveryConfig | null;
  loading: boolean;
  error: Error | null;
}

/** Provided by the member market shell (Market.tsx). */
export const StorefrontContext = createContext<StorefrontData | null>(null);

/**
 * Fetches everything the storefront screens share: the public product list,
 * the markets (for hero banners and chips) and the delivery config. Pass
 * `skip` to keep it idle when a parent already provides the data.
 */
export function useStorefrontFetch(skip = false): StorefrontData {
  const products = useFetch(api.fetch.fetchAllProducts, undefined, skip);
  const markets = useFetch(api.fetch.fetchMarkets, undefined, skip, { silent: true });
  const delivery = useFetch(api.fetch.fetchDeliveryConfig, undefined, skip, {
    silent: true,
  });

  return useMemo(
    () => ({
      products: products.data?.data || [],
      markets: markets.data?.data || [],
      deliveryConfig: delivery.data?.data || null,
      // "Loading" until the first product response lands, so pages show
      // skeletons rather than a flash of the empty state.
      loading: products.loading || (!products.data && !products.error && !skip),
      error: products.error,
    }),
    [
      products.data,
      products.loading,
      products.error,
      markets.data,
      delivery.data,
      skip,
    ]
  );
}

/**
 * Storefront data from the member market shell when mounted inside it, or
 * fetched locally (guest `/out/products` routes have no shell).
 */
export function useStorefrontData(): StorefrontData {
  const shared = useContext(StorefrontContext);
  const own = useStorefrontFetch(Boolean(shared));
  return shared ?? own;
}
