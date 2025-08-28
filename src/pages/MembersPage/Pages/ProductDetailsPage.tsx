import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { api, ICartItem } from "@/utils";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import EmptyState from "@/components/EmptyState";

export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = decodeQuery(id || "");

  // If your useFetch exposes isLoading/error, we use them.
  // Otherwise we infer loading by checking for undefined data.
  const {
    data: product, 
    loading,
    error,
  } = useFetch(api.fetch.fetchProductById, { id: productId });

  

  const { addToCart } = useCart();

  const handleAddToCart = (item: ICartItem) => {
    addToCart(item);
  };

  return (
    <div className="mx-auto bg-white rounded-xl">
      {/* Loading state */}
      {loading && (
        <ProductDetailsSkeleton />
      )}

      {/* Error / empty state */}
      {!loading && (!product || !product?.data) && (
        <EmptyState />
      )}

      {/* Loaded state */}
      {!loading && product?.data && (
        <ProductDetails product={product.data} addToCart={handleAddToCart} />
      )}
    </div>
  );
}

/** ---------- Skeleton ---------- **/
function ProductDetailsSkeleton() {
  return (
    <div
      className="w-full max-w-6xl mx-auto p-6 md:p-8 animate-pulse"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading product details"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image placeholder */}
        <div className="aspect-square w-full rounded-2xl bg-gray-200" />

        {/* Right column */}
        <div className="space-y-4">
          {/* Title */}
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          {/* Price */}
          <div className="h-6 w-40 rounded bg-gray-200" />

          {/* Rating / meta */}
          <div className="flex gap-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>

          {/* Short bullets */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-4 pt-4">
            <div className="h-10 w-28 rounded-xl bg-gray-200" />
            <div className="h-11 w-40 rounded-xl bg-gray-200" />
          </div>

          {/* Description */}
          <div className="space-y-2 pt-6">
            <div className="h-4 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-11/12 rounded bg-gray-200" />
            <div className="h-4 w-10/12 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product details…</span>
    </div>
  );
}
