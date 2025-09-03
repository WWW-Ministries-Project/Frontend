import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";
import { encodeQuery } from "@/pages/HomePage/utils";
import { routes } from "@/routes/appRoutes";

export default function ProductsPage() {
  const {
    data: products,
    loading,
    error,
  } = useFetch(api.fetch.fetchAllProducts);

  // Infer loading if hook doesn't expose it
  // const loading = typeof hookLoading === "boolean" ? hookLoading : typeof products === "undefined";

  const navigate = useNavigate();
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => (m.route)?.name)?.route?.name;

  const handleViewProduct = (productId: string) => {
    if (routeName === "out")
      return navigate(`/out/products/${encodeQuery(productId)}`);
    return navigate(`/member/market/product/${encodeQuery(productId)}`);
  };

  const items = products?.data || [];

  return (
    <>
      {routeName === "out" && (
        <div className="text-2xl font-semibold text-white mb-4">
          {" "}
          PA 2025 Apparel
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && <ProductsGridSkeleton count={8} />}

      {/* Loaded Grid */}
      {!loading && items.length > 0 && (
        <GridComponent
          columns={10}
          data={items}
          displayedCount={2}
          filter={""}
          setFilter={() => {}}
          renderRow={(row) => (
            <ProductCard
              product={row.original}
              handleViewProduct={handleViewProduct}
              key={row.original.id}
            />
          )}
        />
      )}

      {/* Empty / Error */}
      {!loading && items.length === 0 && (
        <EmptyState
          msg={error ? "Failed to load products" : "No products found"}
        />
      )}
    </>
  );
}

/** -------- Skeleton Components -------- */
function ProductsGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white w-[20rem]">
      <div className="aspect-square w-full bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-9 w-full bg-gray-200 rounded-lg mt-2" />
      </div>
    </div>
  );
}
