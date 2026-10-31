import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { encodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { IMarketplaceOverview } from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";

import { card } from "../components/Orders/orderUi";
import { ProductThumb } from "../components/Orders/ProductThumb";
import { StatusPill } from "../components/StatusPill";
import {
  formatDate,
  formatMoney,
  fulfilmentPill,
  getMarketState,
  groupOrderRows,
  isPaid,
  lowStockVariants,
  paymentPill,
  type MarketOrder,
} from "../utils/marketplaceModel";

const ORDERS_PATH = "/home/market-place/orders";
const PRODUCTS_PATH = "/home/market-place/products";

type TopProduct = IMarketplaceOverview["top_products"][number];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shortDay = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * FALLBACK — used only while `GET orders/marketplace-overview` is unavailable
 * (backend not deployed yet). Derives the same numbers client-side from the
 * order rows and live products. KPI period = current calendar month.
 */
const computeOverviewFallback = (
  orders: MarketOrder[],
  lowStock: number
): IMarketplaceOverview => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMonth = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= monthStart);
  const paid = inMonth.filter(isPaid);
  const revenue = paid.reduce((a, o) => a + o.total, 0);

  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + i);
    const key = dayKey(d);
    return {
      date: key,
      revenue: orders
        .filter((o) => isPaid(o) && o.createdAt && dayKey(new Date(o.createdAt)) === key)
        .reduce((a, o) => a + o.total, 0),
    };
  });

  const byProduct = new Map<string, TopProduct>();
  orders.filter(isPaid).forEach((o) =>
    o.lines.forEach((l) => {
      const k = String(l.productId ?? l.name);
      const cur = byProduct.get(k) || {
        product_id: Number(l.productId) || 0,
        name: l.name,
        market_name: l.marketName || "",
        image_url: l.imageUrl,
        units: 0,
        revenue: 0,
      };
      cur.units += l.quantity;
      cur.revenue += l.lineTotal;
      byProduct.set(k, cur);
    })
  );

  return {
    period: { from: dayKey(monthStart), to: dayKey(now) },
    revenue,
    paid_orders: paid.length,
    orders: inMonth.length,
    cancelled: inMonth.filter((o) => o.delivery === "cancelled").length,
    average_order: paid.length ? revenue / paid.length : 0,
    items_sold: paid.reduce((a, o) => a + o.units, 0),
    to_fulfil: orders.filter((o) => o.payment === "success" && o.delivery === "pending").length,
    awaiting_payment: orders.filter((o) => o.payment !== "success" && o.delivery !== "cancelled")
      .length,
    low_stock_variants: lowStock,
    trend,
    top_products: Array.from(byProduct.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5),
  };
};

/** Admin marketplace landing page: KPIs, revenue trend, attention list, recent orders. */
export const MarketplaceOverview = () => {
  const navigate = useNavigate();
  const [marketId, setMarketId] = useState("");

  const { data: marketsRes } = useFetch(api.fetch.fetchMarkets, undefined, false, { silent: true });
  const markets = useMemo(() => marketsRes?.data || [], [marketsRes]);

  const overviewQuery = useMemo(() => (marketId ? { market_id: marketId } : undefined), [marketId]);
  const { data: overviewRes, error: overviewError } = useFetch(
    api.fetch.fetchMarketplaceOverview,
    overviewQuery
  );
  const { data: ordersRes } = useFetch(api.fetch.fetchAllOrders, undefined, false, {
    silent: true,
  });
  // Products are only needed for the fallback low-stock count.
  const { data: productsRes, refetch: fetchProducts } = useFetch(
    api.fetch.fetchAllProducts,
    undefined,
    true,
    { silent: true }
  );
  useEffect(() => {
    if (overviewError && !productsRes) fetchProducts();
  }, [overviewError, productsRes, fetchProducts]);

  const orders = useMemo(() => {
    const all = groupOrderRows(ordersRes?.data);
    return marketId
      ? all.filter((o) => o.lines.some((l) => String(l.marketId) === marketId))
      : all;
  }, [ordersRes, marketId]);

  const ov: IMarketplaceOverview | null = useMemo(() => {
    if (overviewRes?.data && !overviewError) return overviewRes.data;
    if (!overviewError) return null;
    const lowStock = (productsRes?.data || [])
      .filter((p) => (!marketId || String(p.market_id ?? p.market?.id) === marketId))
      .filter((p) => !p.market || getMarketState(p.market) === "Active")
      .reduce((a, p) => a + lowStockVariants(p), 0);
    return computeOverviewFallback(orders, lowStock);
  }, [overviewRes, overviewError, orders, productsRes, marketId]);

  const trend = ov?.trend || [];
  const maxT = Math.max(1, ...trend.map((t) => Number(t.revenue) || 0));
  const trendTotal = trend.reduce((a, t) => a + (Number(t.revenue) || 0), 0);

  const kpis = [
    {
      label: "Revenue",
      value: formatMoney(ov?.revenue),
      sub: `${ov?.paid_orders ?? 0} paid orders this month`,
    },
    { label: "Orders", value: String(ov?.orders ?? 0), sub: `${ov?.cancelled ?? 0} cancelled` },
    { label: "Average order", value: formatMoney(ov?.average_order), sub: "Across paid orders" },
    { label: "Items sold", value: String(ov?.items_sold ?? 0), sub: "Units in paid orders" },
  ];

  const toFulfil = ov?.to_fulfil ?? 0;
  const unpaid = ov?.awaiting_payment ?? 0;
  const low = ov?.low_stock_variants ?? 0;
  const attention = [
    {
      n: toFulfil,
      label: "Orders to fulfil",
      sub: "Paid and waiting to be packed",
      tone: toFulfil ? "amber" : "green",
      go: () => navigate(`${ORDERS_PATH}?tab=To fulfil`, { state: { tab: "To fulfil" } }),
    },
    {
      n: unpaid,
      label: "Awaiting payment",
      sub: "Pending or failed checkouts",
      tone: unpaid ? "amber" : "green",
      go: () => navigate(`${ORDERS_PATH}?tab=Unpaid`, { state: { tab: "Unpaid" } }),
    },
    {
      n: low,
      label: "Variants low on stock",
      sub: "3 units or fewer in live markets",
      tone: low ? "red" : "green",
      go: () => navigate(`${PRODUCTS_PATH}?tab=Low stock`, { state: { tab: "Low stock" } }),
    },
  ];
  const toneCls: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };

  const recent = orders.slice(0, 5);
  const topProducts = ov?.top_products || [];
  const openOrder = (o: MarketOrder) =>
    navigate(`${ORDERS_PATH}/${encodeQuery(String(o.id))}`, {
      state: { from: "/home/market-place", backLabel: "Back to overview" },
    });

  return (
    <PageOutline>
      <div className="flex flex-col gap-6 text-primary">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Marketplace overview</h1>
            <p className="text-base text-gray-600">
              Sales, orders and stock across your church markets
            </p>
          </div>
          <select
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            aria-label="Market"
            className="h-10 rounded-lg border border-lightGray bg-white px-3 text-sm text-primary"
          >
            <option value="">All markets</option>
            {markets.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {kpis.map((k) => (
            <div key={k.label} className={cn(card, "flex flex-col gap-1 p-5 shadow-sm")}>
              <p className="text-sm text-gray-600">{k.label}</p>
              <p className="text-2xl font-semibold">{k.value}</p>
              <p className="text-sm text-gray-500">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={cn(card, "flex flex-col gap-4 p-5")}>
            <div>
              <h2 className="text-base font-semibold">Revenue · last 14 days</h2>
              <p className="text-2xl font-semibold">{formatMoney(trendTotal)}</p>
            </div>
            <div className="flex h-[180px] items-end gap-1.5 border-b border-gray-200">
              {trend.map((t) => {
                const v = Number(t.revenue) || 0;
                const tip = `${shortDay(t.date)}: ${formatMoney(v)}`;
                return (
                  <div
                    key={t.date}
                    className="group relative flex h-full flex-1 items-end"
                    aria-label={tip}
                  >
                    <div
                      className="w-full rounded-t bg-primary opacity-90 group-hover:opacity-100"
                      style={{ height: `${Math.max(2, Math.round((v / maxT) * 100))}%` }}
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs text-white group-hover:block">
                      {tip}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {trend.map((t, i) => (
                <div
                  key={t.date}
                  className="flex-1 whitespace-nowrap text-center text-xs text-gray-500"
                >
                  {i % 3 === 1 || i === trend.length - 1 ? shortDay(t.date) : ""}
                </div>
              ))}
            </div>
          </section>

          <section className={cn(card, "flex flex-col gap-1 p-5")}>
            <h2 className="mb-2 text-base font-semibold">Needs attention</h2>
            {attention.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.go}
                className="-mx-3 flex items-center gap-3 rounded-lg p-3 text-left text-primary hover:bg-gray-50"
              >
                <span
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 font-semibold",
                    toneCls[a.tone]
                  )}
                >
                  {a.n}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{a.label}</span>
                  <span className="text-sm text-gray-500">{a.sub}</span>
                </span>
                <span aria-hidden="true" className="text-gray-500">
                  ›
                </span>
              </button>
            ))}
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={cn(card, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold">Recent orders</h2>
              <button
                type="button"
                onClick={() => navigate(ORDERS_PATH)}
                className="text-sm font-medium text-blue-700"
              >
                View all
              </button>
            </div>
            {recent.map((o) => (
              <div
                key={String(o.id)}
                role="button"
                tabIndex={0}
                onClick={() => openOrder(o)}
                onKeyDown={(e) => e.key === "Enter" && openOrder(o)}
                className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-5 py-3 text-sm hover:bg-gray-50"
              >
                <span className="min-w-24 font-semibold">{o.orderNumber}</span>
                <span className="min-w-[120px] flex-1">{o.customer.name}</span>
                <span className="min-w-[100px] text-gray-600">{formatDate(o.createdAt)}</span>
                <StatusPill status={paymentPill(o)} />
                <StatusPill status={fulfilmentPill(o)} />
                <span className="min-w-24 text-right font-semibold">{formatMoney(o.total)}</span>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="p-8 text-center text-sm text-gray-600">No orders yet.</p>
            )}
          </section>

          <section className={cn(card, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold">Top products</h2>
              <button
                type="button"
                onClick={() => navigate(PRODUCTS_PATH)}
                className="text-sm font-medium text-blue-700"
              >
                View all
              </button>
            </div>
            {topProducts.map((p, i) => (
              <div
                key={`${p.product_id}-${p.name}`}
                className="flex items-center gap-3 border-b border-gray-100 px-5 py-2.5"
              >
                <span className="w-4 text-sm text-gray-500">{i + 1}</span>
                <ProductThumb imageUrl={p.image_url} alt={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[p.market_name, `${p.units} sold`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-medium">
                  {formatMoney(p.revenue)}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="p-8 text-center text-sm text-gray-600">No sales yet.</p>
            )}
          </section>
        </div>
      </div>
    </PageOutline>
  );
};
