import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Skeleton } from "@/components/Skeleton";
import type { IProductTypeResponse } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import { ShopFilters, type FilterOption } from "@/pages/HomePage/pages/MarketPlace/components/storefront/ShopFilters";
import { ShopHero } from "@/pages/HomePage/pages/MarketPlace/components/storefront/ShopHero";
import { StorefrontPage } from "@/pages/HomePage/pages/MarketPlace/components/storefront/StorefrontPage";
import { useStorefrontData } from "@/pages/HomePage/pages/MarketPlace/components/storefront/storefrontData";
import {
  activeMarketsByEnd,
  colourSizes,
  createdTime,
  isGuestPath,
  isLiveProduct,
  matchesPrice,
  productPath,
  swatchHex,
  variantStock,
  type PriceBucket,
} from "@/pages/HomePage/pages/MarketPlace/components/storefront/storefrontModel";
import { useQuickAdd } from "@/pages/HomePage/pages/MarketPlace/components/storefront/useStorefrontCart";
import {
  CURRENCY_SYMBOL,
  colourLabel,
  productStock,
  sortSizes,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { cn } from "@/utils/cn";

type SortKey = "featured" | "newest" | "asc" | "desc";

const PRICE_OPTIONS: { key: PriceBucket; label: string }[] = [
  { key: "", label: "Any price" },
  { key: "u50", label: `Under ${CURRENCY_SYMBOL} 50` },
  { key: "mid", label: `${CURRENCY_SYMBOL} 50 – 150` },
  { key: "o150", label: `Over ${CURRENCY_SYMBOL} 150` },
];

const categoryKey = (p: IProductTypeResponse) => p.product_category?.name || "";

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export default function ProductsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const guest = isGuestPath(pathname);
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, markets, loading, error } = useStorefrontData();
  const quickAdd = useQuickAdd();

  const fMarket = searchParams.get("market") || "";
  const [q, setQ] = useState("");
  const [fCats, setFCats] = useState<string[]>([]);
  const [fPrice, setFPrice] = useState<PriceBucket>("");
  const [fColours, setFColours] = useState<string[]>([]);
  const [fSizes, setFSizes] = useState<string[]>([]);
  const [fStock, setFStock] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);

  const setMarket = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("market", id);
    else next.delete("market");
    setSearchParams(next, { replace: true });
  };

  const live = useMemo(() => products.filter(isLiveProduct), [products]);
  const activeMarkets = useMemo(() => activeMarketsByEnd(markets), [markets]);
  const marketName = (id: string) =>
    activeMarkets.find((m) => String(m.id) === id)?.name ||
    live.find((p) => String(p.market_id) === id)?.market?.name ||
    "Market";

  const pool = useMemo(
    () => live.filter((p) => !fMarket || String(p.market_id) === fMarket),
    [live, fMarket]
  );

  const categoryOpts = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>();
    pool.forEach((p) => {
      const k = categoryKey(p);
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts, ([key, count]) => ({ key, label: key, count }));
  }, [pool]);

  const colourOpts = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, FilterOption>();
    pool.forEach((p) =>
      (p.product_colours || []).forEach((c) => {
        const key = swatchHex(c).toLowerCase();
        if (!seen.has(key)) seen.set(key, { key, label: colourLabel(c) || key, hex: swatchHex(c) });
      })
    );
    return Array.from(seen.values());
  }, [pool]);

  const sizeOpts = useMemo(() => {
    const all = new Set<string>();
    pool.forEach((p) => (p.product_colours || []).forEach((c) => colourSizes(c).forEach((z) => all.add(z))));
    all.delete("One size");
    return sortSizes(Array.from(all));
  }, [pool]);

  const term = q.trim().toLowerCase();

  const list = useMemo(() => {
    let out = pool.filter((p) => {
      if (
        term &&
        ![p.name, p.product_type?.name, p.product_category?.name, p.market?.name]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
        return false;
      if (fCats.length && !fCats.includes(categoryKey(p))) return false;
      if (!matchesPrice(Number(p.price_amount) || 0, fPrice)) return false;
      if (
        fColours.length &&
        !(p.product_colours || []).some((c) => fColours.includes(swatchHex(c).toLowerCase()))
      )
        return false;
      if (
        fSizes.length &&
        !(p.product_colours || []).some((c) =>
          fSizes.some((z) => colourSizes(c).includes(z) && variantStock(p, c, z) > 0)
        )
      )
        return false;
      if (fStock && productStock(p) <= 0) return false;
      return true;
    });
    if (sort === "newest") out = [...out].sort((a, b) => createdTime(b) - createdTime(a));
    if (sort === "asc") out = [...out].sort((a, b) => Number(a.price_amount) - Number(b.price_amount));
    if (sort === "desc") out = [...out].sort((a, b) => Number(b.price_amount) - Number(a.price_amount));
    return out;
  }, [pool, term, fCats, fPrice, fColours, fSizes, fStock, sort]);

  const chips: { label: string; remove: () => void }[] = [];
  if (fMarket) chips.push({ label: marketName(fMarket), remove: () => setMarket("") });
  fCats.forEach((c) => chips.push({ label: c, remove: () => setFCats((s) => toggle(s, c)) }));
  if (fPrice)
    chips.push({
      label: PRICE_OPTIONS.find((o) => o.key === fPrice)?.label || "",
      remove: () => setFPrice(""),
    });
  fColours.forEach((c) =>
    chips.push({
      label: colourOpts.find((o) => o.key === c)?.label || c,
      remove: () => setFColours((s) => toggle(s, c)),
    })
  );
  fSizes.forEach((z) => chips.push({ label: `Size ${z}`, remove: () => setFSizes((s) => toggle(s, z)) }));
  if (fStock) chips.push({ label: "In stock", remove: () => setFStock(false) });

  const clearAll = () => {
    setMarket("");
    setFCats([]);
    setFPrice("");
    setFColours([]);
    setFSizes([]);
    setFStock(false);
    setQ("");
  };

  const pickMarket = (id: string) => {
    setMarket(id);
    setFColours([]);
    setFSizes([]);
  };

  const heroMarket = activeMarkets[0];
  const heroSecond = activeMarkets[1] || null;
  const showHero = !term && chips.length === 0 && Boolean(heroMarket);

  const openProduct = (id: string) => navigate(productPath(id, guest));

  return (
    <StorefrontPage>
      <div data-screen-label="Shop" className="flex flex-col gap-6 text-primary">
        {showHero && heroMarket && (
          <ShopHero
            market={heroMarket}
            secondary={heroSecond}
            secondaryCount={
              heroSecond ? live.filter((p) => String(p.market_id) === String(heroSecond.id)).length : 0
            }
            onShop={pickMarket}
          />
        )}

        {activeMarkets.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[{ id: "", name: "All markets" }, ...activeMarkets].map((m) => {
              const on = fMarket === String(m.id);
              return (
                <button
                  key={m.id || "all"}
                  type="button"
                  onClick={() => pickMarket(String(m.id))}
                  aria-pressed={on}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium",
                    on
                      ? "border-primary bg-primary text-white"
                      : "border-lightGray bg-white text-primary hover:bg-gray-100"
                  )}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[232px_minmax(0,1fr)]">
          <ShopFilters
            className={showFilters ? "flex" : "hidden lg:flex"}
            categories={categoryOpts}
            selectedCategories={fCats}
            onToggleCategory={(k) => setFCats((s) => toggle(s, k))}
            priceOptions={PRICE_OPTIONS}
            price={fPrice}
            onPrice={setFPrice}
            colours={colourOpts}
            selectedColours={fColours}
            onToggleColour={(k) => setFColours((s) => toggle(s, k))}
            sizes={sizeOpts}
            selectedSizes={fSizes}
            onToggleSize={(k) => setFSizes((s) => toggle(s, k))}
            inStockOnly={fStock}
            onToggleStock={() => setFStock((v) => !v)}
          />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {loading ? "Loading products…" : `${list.length} ${list.length === 1 ? "product" : "products"}`}
                </p>
                {chips.map((c, i) => (
                  <button
                    key={`${c.label}-${i}`}
                    type="button"
                    onClick={c.remove}
                    aria-label={`Remove filter ${c.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-lightGray bg-white px-2.5 py-1 text-sm text-primary hover:bg-gray-100"
                  >
                    {c.label}
                    <span aria-hidden="true" className="text-mainGray">
                      ×
                    </span>
                  </button>
                ))}
                {chips.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-blue-700 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-[260px] max-w-full">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="absolute left-3 top-[11px] text-mainGray"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search tees, books, mugs…"
                    aria-label="Search products"
                    className="h-10 w-full rounded-lg border border-lightGray bg-white pl-[38px] pr-3 text-sm text-primary outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  aria-expanded={showFilters}
                  className="h-10 rounded-lg border border-lightGray bg-white px-3.5 text-sm font-medium text-primary lg:hidden"
                >
                  {showFilters ? "Hide filters" : `Filters${chips.length ? ` (${chips.length})` : ""}`}
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort products"
                  className="h-10 rounded-lg border border-lightGray bg-white px-3 text-sm text-primary"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="newest">Newest</option>
                  <option value="asc">Price: low to high</option>
                  <option value="desc">Price: high to low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <ProductsGridSkeleton count={8} />
            ) : list.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6 tablet:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {list.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    handleViewProduct={openProduct}
                    onQuickAdd={guest ? undefined : quickAdd}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center">
                <h2 className="text-lg font-semibold">
                  {error ? "We couldn't load the shop" : live.length === 0 ? "Nothing on sale right now" : "No products match"}
                </h2>
                <p className="text-primaryGray">
                  {error
                    ? "Check your connection and refresh the page."
                    : live.length === 0
                      ? "Check back when the next market opens."
                      : "Try a different search or remove a filter."}
                </p>
                {!error && live.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-2 min-h-10 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontPage>
  );
}

function ProductsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6 tablet:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-2.5">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
