import { useMemo, useState } from "react";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { api, formatDate } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import { getMarketStatus } from "@/pages/HomePage/pages/MarketPlace/MarketPlace";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { SearchBar } from "@/components/SearchBar";
import Filter from "@/pages/HomePage/Components/reusable/Filter";
import { encodeQuery } from "@/pages/HomePage/utils";
import { routes } from "@/routes/appRoutes";

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route?.name)?.route?.name;

  const {
    data: products,
    loading,
    error,
  } = useFetch(api.fetch.fetchAllProducts);

  const { data: markets } = useFetch(api.fetch.fetchMarkets);
  const { data: productCategories } = useFetch(api.fetch.fetchProductCategories);

  const [search, setSearch] = useState("");
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const activeMarkets = useMemo(() => {
    return (markets?.data || []).filter(
      (market) =>
        getMarketStatus({
          start_date: market.start_date,
          end_date: market.end_date,
        }) === "active"
    );
  }, [markets?.data]);

  const featuredMarket = useMemo(() => {
    if (activeMarkets.length === 0) return null;
    return [...activeMarkets].sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    )[0];
  }, [activeMarkets]);

  const categoryOptions = useMemo(
    () =>
      (productCategories?.data || []).map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    [productCategories?.data]
  );

  const marketOptions = useMemo(
    () => activeMarkets.map((market) => ({ label: market.name, value: String(market.id) })),
    [activeMarkets]
  );

  const filteredProducts = useMemo(() => {
    const list = products?.data || [];
    const term = search.trim().toLowerCase();

    return list.filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (selectedMarketId && String(product.market_id) !== selectedMarketId) return false;
      if (
        selectedCategoryId &&
        String(product.product_category_id) !== selectedCategoryId
      )
        return false;
      if (maxPrice && Number(product.price_amount) > Number(maxPrice)) return false;
      return true;
    });
  }, [products?.data, search, selectedMarketId, selectedCategoryId, maxPrice]);

  const handleViewProduct = (productId: string) => {
    if (routeName === "out")
      return navigate(`/out/products/${encodeQuery(productId)}`);
    return navigate(`/member/market/product/${encodeQuery(productId)}`);
  };

  return (
    <div className="p-6 space-y-6">
      {routeName === "out" && (
        <div className="text-2xl font-semibold text-white mb-4">
          10th Anniversary Apparel
        </div>
      )}

      {featuredMarket && (
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            Featured market
          </p>
          <h2 className="text-2xl font-bold mt-1">{featuredMarket.name}</h2>
          {featuredMarket.description && (
            <p className="mt-1 text-sm opacity-90 max-w-2xl">
              {featuredMarket.description}
            </p>
          )}
          <p className="mt-2 text-sm opacity-90">
            Open until {formatDate(featuredMarket.end_date)}
          </p>
        </div>
      )}

      {activeMarkets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedMarketId("")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedMarketId === ""
                ? "bg-primary text-white"
                : "bg-lightGray/40 text-primary hover:bg-lightGray/60"
            }`}
          >
            All markets
          </button>
          {activeMarkets.map((market) => (
            <button
              key={market.id}
              type="button"
              onClick={() =>
                setSelectedMarketId((prev) => (prev === String(market.id) ? "" : String(market.id)))
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedMarketId === String(market.id)
                  ? "bg-primary text-white"
                  : "bg-lightGray/40 text-primary hover:bg-lightGray/60"
              }`}
            >
              {market.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchBar
          className="h-10 sm:max-w-xs"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Filter
          name="category"
          className="sm:w-48"
          label="Category"
          placeholder="All categories"
          options={[{ label: "All categories", value: "" }, ...categoryOptions]}
          value={selectedCategoryId}
          onChange={(_, value) => setSelectedCategoryId(value)}
        />
        {marketOptions.length > 0 && (
          <Filter
            name="market"
            className="sm:w-48"
            label="Market"
            placeholder="All markets"
            options={[{ label: "All markets", value: "" }, ...marketOptions]}
            value={selectedMarketId}
            onChange={(_, value) => setSelectedMarketId(value)}
          />
        )}
        <div className="sm:w-40">
          <label className="mb-1 block text-sm" htmlFor="max-price">
            Max price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#dcdcdc] bg-white px-3 text-sm text-primary"
          />
        </div>
      </div>

      {loading && <ProductsGridSkeleton count={8} />}

      {!loading && filteredProducts.length > 0 && (
        <GridComponent
          columns={[]}
          data={filteredProducts}
          displayedCount={12}
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

      {!loading && filteredProducts.length === 0 && (
        <EmptyState
          scope="page"
          msg={error ? "Failed to load products" : "No products found"}
        />
      )}
    </div>
  );
}

function ProductsGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}
