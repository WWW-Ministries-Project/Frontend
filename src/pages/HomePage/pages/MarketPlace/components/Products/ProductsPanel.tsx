import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { InlineAlert } from "@/components/feedback";
import { encodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  IMarket,
  IOrders,
  IProductTypeResponse,
} from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";
import {
  colourStock,
  formatMoney,
  getMarketState,
  groupOrderRows,
  isStockManaged,
  lowStockVariants,
  productImage,
  variantCount,
} from "../../utils/marketplaceModel";
import { ConfigurationsDrawer } from "../ConfigurationsDrawer";
import { MarketFormModal, type MarketModalMode } from "../markets/MarketFormModal";
import { StatusPill } from "../StatusPill";
import { unitsSoldByProduct } from "../markets/marketStats";
import { PageHeader, PillTabs } from "../markets/ui";
import { btnPrimary, card, selectCls } from "../markets/styles";
import { PRODUCT_TABS, type ProductTab } from "./productTabs";
import { ProductThumb } from "./ProductThumb";
import { useProductsByMarkets } from "./useProductsByMarkets";

interface IProps {
  /** Scope the panel to one market (hides the market column and filter). */
  marketId?: string;
  /** Render the page header (title, subtitle, Add product) above the table. */
  header?: { title: string; subtitle?: string };
  initialTab?: ProductTab;
  /** Pre-fetched data from the parent, to avoid duplicate requests. */
  products?: IProductTypeResponse[] | null;
  orders?: IOrders[] | null;
  marketName?: string;
}

interface Row {
  product: IProductTypeResponse;
  marketId: string;
  marketName: string;
  stock: number;
  managed: boolean;
  low: number;
  variants: number;
}

const tabMatch: Record<ProductTab, (r: Row) => boolean> = {
  All: () => true,
  Published: (r) => r.product.status === "published",
  Draft: (r) => r.product.status !== "published",
  "Low stock": (r) => r.managed && r.stock > 0 && r.low > 0,
  "Out of stock": (r) => r.managed && r.stock === 0,
};

export function ProductsPanel({
  marketId,
  header,
  initialTab = "All",
  products: injectedProducts,
  orders: injectedOrders,
  marketName,
}: IProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAction } = useAccessControl();
  const canManageCatalog = hasAction("Marketplace.manage_catalog");
  const canManageMarkets = hasAction("Marketplace.manage_markets");

  const [tab, setTab] = useState<ProductTab>(initialTab);
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- data ---------------------------------------------------------------
  const productsInjected = injectedProducts !== undefined;
  const { data: marketProducts } = useFetch(
    api.fetch.fetchProductsByMarket,
    marketId ? { market_id: marketId } : undefined,
    productsInjected || !marketId
  );
  const { data: marketsRes, refetch: refetchMarkets } = useFetch(
    api.fetch.fetchMarkets,
    undefined,
    Boolean(marketId)
  );
  const markets: IMarket[] | undefined = marketId ? undefined : marketsRes?.data;
  // Products belong to a market: with none, adding a product can't start.
  const noMarkets = !marketId && Array.isArray(markets) && markets.length === 0;
  const [marketModal, setMarketModal] = useState<MarketModalMode | null>(null);
  const { byMarket, loaded: allLoaded } = useProductsByMarkets(markets);

  const ordersInjected = injectedOrders !== undefined;
  const { data: ordersRes } = useFetch(
    marketId ? api.fetch.fetchOrdersByMarket : api.fetch.fetchAllOrders,
    marketId ? { market_id: marketId } : undefined,
    ordersInjected,
    { silent: true }
  );
  const orderRows = ordersInjected ? injectedOrders : ordersRes?.data;
  const sold = useMemo(
    () => (orderRows ? unitsSoldByProduct(groupOrderRows(orderRows)) : null),
    [orderRows]
  );

  const { data: typesRes, refetch: refetchTypes } = useFetch(
    api.fetch.fetchProductTypes,
    undefined,
    true,
    { silent: true }
  );
  const { data: categoriesRes, refetch: refetchCategories } = useFetch(
    api.fetch.fetchProductCategories,
    undefined,
    true,
    { silent: true }
  );
  const refetchConfig = useCallback(
    (section: "type" | "category") =>
      section === "type" ? refetchTypes() : refetchCategories(),
    [refetchTypes, refetchCategories]
  );
  const openSettings = () => {
    refetchTypes();
    refetchCategories();
    setDrawerOpen(true);
  };

  const loaded = marketId
    ? productsInjected
      ? injectedProducts !== null
      : marketProducts !== null
    : allLoaded;

  const rows: Row[] = useMemo(() => {
    const toRow = (p: IProductTypeResponse, mId: string, mName: string): Row => {
      const managed = isStockManaged(p);
      return {
        product: p,
        marketId: mId,
        marketName: mName,
        managed,
        stock: managed
          ? (p.product_colours || []).reduce((a, c) => a + colourStock(c), 0)
          : 0,
        low: lowStockVariants(p),
        variants: variantCount(p),
      };
    };
    if (marketId) {
      const list = productsInjected ? injectedProducts || [] : marketProducts?.data || [];
      return list.map((p) => toRow(p, marketId, marketName || p.market?.name || ""));
    }
    return (markets || []).flatMap((m) =>
      (byMarket[String(m.id)] || []).map((p) => toRow(p, String(m.id), m.name))
    );
  }, [marketId, productsInjected, injectedProducts, marketProducts, marketName, markets, byMarket]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const c = r.product.product_category;
      if (c?.id !== undefined && c?.name) map.set(String(c.id), c.name);
    });
    return Array.from(map, ([v, l]) => ({ v, l })).sort((a, b) => a.l.localeCompare(b.l));
  }, [rows]);

  const base = useMemo(
    () =>
      rows
        .filter((r) => marketId || !marketFilter || r.marketId === marketFilter)
        .filter(
          (r) =>
            !categoryFilter || String(r.product.product_category?.id) === categoryFilter
        ),
    [rows, marketId, marketFilter, categoryFilter]
  );

  const q = query.trim().toLowerCase();
  const list = base
    .filter(tabMatch[tab])
    .filter(
      (r) =>
        !q ||
        `${r.product.name} ${r.product.product_type?.name || ""}`
          .toLowerCase()
          .includes(q)
    );

  // --- actions ------------------------------------------------------------
  const from = location.pathname + location.search;
  const editProduct = (r: Row) =>
    navigate(
      `/home/market-place/${encodeQuery(r.marketId)}/edit-product/${encodeQuery(String(r.product.id))}`,
      { state: { from, fromLabel: header ? "products" : undefined } }
    );

  const addProduct = () => {
    const target =
      marketId ||
      marketFilter ||
      String(
        (markets || []).find((m) => getMarketState(m) === "Active")?.id ??
          (markets || []).find((m) => getMarketState(m) === "Upcoming")?.id ??
          markets?.[0]?.id ??
          ""
      );
    if (!target) return;
    navigate(`/home/market-place/${encodeQuery(target)}/create-product`, {
      state: { from, fromLabel: header ? "products" : undefined },
    });
  };

  const showMarket = !marketId;
  const showSold = sold !== null;
  const cols = cn(
    "grid items-center gap-3",
    showMarket
      ? showSold
        ? "grid-cols-[2.4fr_1.5fr_1fr_1.4fr_0.6fr_0.9fr_56px]"
        : "grid-cols-[2.4fr_1.5fr_1fr_1.4fr_0.9fr_56px]"
      : showSold
        ? "grid-cols-[2.4fr_1fr_1.4fr_0.6fr_0.9fr_56px]"
        : "grid-cols-[2.4fr_1fr_1.4fr_0.9fr_56px]"
  );

  const noMarketsTip = noMarkets ? "Create a market first" : undefined;

  const panel = (
    <>
    {noMarkets && (
      <InlineAlert
        tone="info"
        title="Create a market first"
        className="mb-4"
        action={
          canManageMarkets
            ? { label: "Create market", onClick: () => setMarketModal({ kind: "create" }) }
            : undefined
        }
      >
        Products belong to a market. Set one up, then add products to it.
      </InlineAlert>
    )}
    <section className={cn(card, "overflow-hidden text-primary")}>
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
        <div className="flex flex-1 flex-wrap gap-1.5">
          <PillTabs
            size="sm"
            tabs={PRODUCT_TABS.map((t) => ({
              label: t,
              count: base.filter(tabMatch[t]).length,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          className="h-[38px] w-full rounded-lg border border-lightGray px-3 text-sm sm:w-[220px]"
        />
        {showMarket && (
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            aria-label="Market"
            className={cn(selectCls, "h-[38px]")}
          >
            <option value="">All markets</option>
            {(markets || []).map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Category"
          className={cn(selectCls, "h-[38px]")}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.v} value={c.v}>
              {c.l}
            </option>
          ))}
        </select>
        {canManageCatalog && (
          <button
            type="button"
            onClick={openSettings}
            aria-label="Product settings"
            title="Product types & categories"
            className="flex size-[38px] items-center justify-center rounded-lg border border-lightGray bg-white text-primaryGray transition-colors hover:bg-gray-100 hover:text-primary"
          >
            <Cog6ToothIcon className="size-5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className={showMarket ? "min-w-[860px]" : "min-w-[720px]"}>
          <div
            className={cn(
              cols,
              "bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primaryGray"
            )}
          >
            <span>Product</span>
            {showMarket && <span>Market</span>}
            <span>Price</span>
            <span>Inventory</span>
            {showSold && <span>Sold</span>}
            <span>Status</span>
            <span />
          </div>
          {list.map((r) => {
            const p = r.product;
            const firstColour = p.product_colours?.[0];
            const typeLine = [p.product_type?.name, p.product_category?.name]
              .filter(Boolean)
              .join(" · ");
            const inv = !r.managed
              ? "Not tracked"
              : r.stock === 0
                ? "Out of stock"
                : `${r.stock} in stock`;
            const invColor = !r.managed
              ? "text-primaryGray"
              : r.stock === 0
                ? "text-red-700"
                : r.low
                  ? "text-amber-700"
                  : "text-primary";
            const invSub = `${r.variants} ${r.variants === 1 ? "variant" : "variants"}${
              r.managed && r.low && r.stock ? ` · ${r.low} low` : ""
            }`;
            return (
              <div
                key={`${r.marketId}-${p.id}`}
                role={canManageCatalog ? "button" : undefined}
                tabIndex={canManageCatalog ? 0 : undefined}
                onClick={canManageCatalog ? () => editProduct(r) : undefined}
                onKeyDown={(e) => {
                  if (!canManageCatalog) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    editProduct(r);
                  }
                }}
                className={cn(
                  cols,
                  "border-t border-gray-100 px-4 py-3 text-sm",
                  canManageCatalog &&
                    "cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb
                    src={productImage(p)}
                    hex={firstColour?.colour}
                    alt={p.name}
                    className="size-11"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    {typeLine && (
                      <p className="truncate text-xs text-gray-500">{typeLine}</p>
                    )}
                  </div>
                </div>
                {showMarket && <span className="truncate">{r.marketName}</span>}
                <span>{formatMoney(p.price_amount)}</span>
                <div>
                  <p className={cn("font-medium", invColor)}>{inv}</p>
                  <p className="text-xs text-gray-500">{invSub}</p>
                </div>
                {showSold && <span>{sold?.get(String(p.id)) ?? 0}</span>}
                <span className="justify-self-start">
                  <StatusPill
                    status={
                      p.status === "published"
                        ? { label: "Published", tone: "green" }
                        : { label: "Draft", tone: "gray" }
                    }
                  />
                </span>
                <span className="font-medium text-blue-700">
                  {canManageCatalog ? "Edit" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {!loaded && (
        <p className="p-8 text-center text-primaryGray">Loading products…</p>
      )}
      {loaded && list.length === 0 && (
        <div className="flex flex-col items-center gap-2 p-8 text-center text-primaryGray">
          <p>
            {rows.length === 0
              ? "No products yet."
              : "No products match these filters."}
          </p>
          {rows.length === 0 && canManageCatalog && !noMarkets && (
            <button type="button" className={btnPrimary} onClick={addProduct}>
              Add product
            </button>
          )}
        </div>
      )}
    </section>
    <ConfigurationsDrawer
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      categories={categoriesRes?.data || []}
      types={typesRes?.data || []}
      refetch={refetchConfig}
    />
    {!marketId && (
      <MarketFormModal
        mode={marketModal}
        onClose={() => setMarketModal(null)}
        onSaved={() => {
          setMarketModal(null);
          refetchMarkets();
        }}
      />
    )}
    </>
  );

  if (!header) return panel;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={header.title}
        subtitle={header.subtitle}
        actions={
          canManageCatalog && (
            <button
              type="button"
              className={cn(btnPrimary, noMarkets && "cursor-not-allowed opacity-50")}
              onClick={addProduct}
              disabled={noMarkets}
              title={noMarketsTip}
            >
              Add product
            </button>
          )
        }
      />
      {panel}
    </div>
  );
}
