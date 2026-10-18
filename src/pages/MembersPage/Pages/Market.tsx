import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useStore } from "@/store/useStore";
import {
  StorefrontContext,
  useStorefrontFetch,
} from "@/pages/HomePage/pages/MarketPlace/components/storefront/storefrontData";
import { MarketLayout } from "../layouts/MarketLayout";

/**
 * Member marketplace shell. Loads the storefront data once (products,
 * markets, delivery config) and shares it with the Shop / Product pages.
 */
const Market = () => {
  const storefront = useStorefrontFetch();
  const setProducts = useStore((s) => s.setProducts);
  const setLoading = useStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(storefront.loading);
  }, [storefront.loading, setLoading]);

  useEffect(() => {
    setProducts(storefront.products);
  }, [storefront.products, setProducts]);

  return (
    <StorefrontContext.Provider value={storefront}>
      <MarketLayout>
        <Outlet />
      </MarketLayout>
    </StorefrontContext.Provider>
  );
};

export default Market;
