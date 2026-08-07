import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { api, ICartItem, IProductTypeResponse } from "@/utils";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = decodeQuery(id || "");

  const {
    data: product,
    loading,
    error,
  } = useFetch(api.fetch.fetchProductById, { id: productId });

  const { data: allProducts } = useFetch(api.fetch.fetchAllProducts);

  const { addToCart } = useCart();

  const handleAddToCart = (item: ICartItem) => {
    addToCart(item);
  };

  const relatedProducts = useMemo<IProductTypeResponse[]>(() => {
    if (!product?.data) return [];
    const current = product.data;
    return (allProducts?.data || [])
      .filter((candidate) => String(candidate.id) !== String(current.id))
      .filter(
        (candidate) =>
          String(candidate.market_id) === String(current.market_id) ||
          String(candidate.product_type_id) === String(current.product_type_id)
      )
      .slice(0, 4);
  }, [allProducts?.data, product?.data]);

  return (
    <div className="mx-auto bg-white rounded-xl">
      {loading && <ProductDetailsSkeleton />}

      {!loading && (!product || !product?.data) && (
        <EmptyState
          scope="page"
          msg={error ? "Failed to load product details" : "Product not found"}
        />
      )}

      {!loading && product?.data && (
        <ProductDetails
          product={product.data}
          addToCart={handleAddToCart}
          relatedProducts={relatedProducts}
        />
      )}
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div
      className="w-full max-w-6xl mx-auto p-6 md:p-8"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading product details"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-2xl" />

        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-40" />

          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>

          <div className="space-y-2 pt-6">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product details…</span>
    </div>
  );
}
