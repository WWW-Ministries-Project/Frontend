import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { Skeleton } from "@/components/Skeleton";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { StorefrontPage } from "@/pages/HomePage/pages/MarketPlace/components/storefront/StorefrontPage";
import { useStorefrontData } from "@/pages/HomePage/pages/MarketPlace/components/storefront/storefrontData";
import {
  isGuestPath,
  isLiveProduct,
  shopPath,
} from "@/pages/HomePage/pages/MarketPlace/components/storefront/storefrontModel";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api, type IProductTypeResponse } from "@/utils";

export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = decodeQuery(id || "");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const guest = isGuestPath(pathname);

  const query = useMemo(() => ({ id: productId }), [productId]);
  const { data: product, loading, error } = useFetch(api.fetch.fetchProductById, query);
  const { products, deliveryConfig } = useStorefrontData();

  const current = product?.data;

  const relatedProducts = useMemo<IProductTypeResponse[]>(() => {
    if (!current?.market_id) return [];
    return products
      .filter(isLiveProduct)
      .filter(
        (p) =>
          String(p.id) !== String(current.id) &&
          String(p.market_id) === String(current.market_id)
      )
      .slice(0, 4);
  }, [products, current]);

  const isLoading = loading || (!product && !error);

  return (
    <StorefrontPage>
      {isLoading && <ProductDetailsSkeleton />}

      {!isLoading && !current && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center text-primary">
          <h2 className="text-lg font-semibold">
            {error ? "We couldn't load this product" : "Product not found"}
          </h2>
          <p className="text-primaryGray">
            {error
              ? "Check your connection and try again."
              : "It may have been removed or the market has closed."}
          </p>
          <button
            type="button"
            onClick={() => navigate(shopPath(guest))}
            className="mt-2 min-h-10 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Back to shop
          </button>
        </div>
      )}

      {!isLoading && current && (
        <ProductDetails
          key={String(current.id)}
          product={current}
          relatedProducts={relatedProducts}
          deliveryConfig={deliveryConfig}
        />
      )}
    </StorefrontPage>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading product details">
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 gap-10 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      <span className="sr-only">Loading product details…</span>
    </div>
  );
}
