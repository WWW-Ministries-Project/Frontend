import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { IMarket, IOrders, PaymentStatus } from "@/utils/api/marketPlace/interface";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { marketplaceContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  currencyFormatter,
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  numberFormatter,
  resolveFiltersDateRange,
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const orderAmount = (order: IOrders) => {
  const total = toNumber(order.total_amount);
  if (total > 0) return total;
  return toNumber(order.price_amount) * Math.max(1, toNumber(order.quantity));
};

const orderDate = (order: IOrders) => {
  return order.created_at || order.order_created_at || order.ordered_at || "";
};

export const MarketplaceAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );

  const [marketFilter, setMarketFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");

  const { data: ordersResponse, loading, error } = useFetch(api.fetch.fetchAllOrders, {
    page: 1,
    take: 5000,
  });
  const { data: marketsResponse } = useFetch(api.fetch.fetchMarkets);

  const orders = useMemo(() => {
    if (!Array.isArray(ordersResponse?.data)) return [];
    return ordersResponse.data as IOrders[];
  }, [ordersResponse]);

  const markets = useMemo(() => {
    if (!Array.isArray(marketsResponse?.data)) return [];
    return marketsResponse.data as IMarket[];
  }, [marketsResponse]);

  const marketOptions = useMemo(() => {
    return markets.map((market) => ({ id: String(market.id), name: market.name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [markets]);

  const cumulativeFrom = useMemo(
    () => getEarliestIsoDate(orders.map((order) => orderDate(order))),
    [orders]
  );

  const effectiveDateRange = useMemo(
    () => resolveFiltersDateRange(filters, cumulativeFrom),
    [cumulativeFrom, filters]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isWithinRange(orderDate(order), effectiveDateRange)) return false;

      if (marketFilter !== "all" && String(order.market_id) !== marketFilter) return false;

      if (paymentStatusFilter !== "all" && order.payment_status !== paymentStatusFilter) {
        return false;
      }

      return true;
    });
  }, [effectiveDateRange, marketFilter, orders, paymentStatusFilter]);

  const gmvTrend = useMemo(
    () =>
      buildSeries(
        filteredOrders,
        (order) => orderDate(order),
        (order) => orderAmount(order),
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredOrders, filters.groupBy]
  );

  const orderTrend = useMemo(
    () =>
      buildSeries(
        filteredOrders,
        (order) => orderDate(order),
        () => 1,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredOrders, filters.groupBy]
  );

  const paymentStatusMix = useMemo(() => {
    const map = new Map<string, number>();

    filteredOrders.forEach((order) => {
      const status = order.payment_status || "unknown";
      map.set(status, (map.get(status) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredOrders]);

  const marketRevenue = useMemo(() => {
    const map = new Map<string, number>();

    filteredOrders.forEach((order) => {
      const key = String(order.market_id || "Unknown");
      map.set(key, (map.get(key) ?? 0) + orderAmount(order));
    });

    const marketNameLookup = new Map(markets.map((market) => [String(market.id), market.name]));

    return Array.from(map.entries())
      .map(([key, value]) => ({
        label: marketNameLookup.get(key) || key,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredOrders, markets]);

  const gmv = useMemo(
    () => filteredOrders.reduce((acc, order) => acc + orderAmount(order), 0),
    [filteredOrders]
  );

  const pendingExposure = useMemo(
    () =>
      filteredOrders
        .filter((order) => String(order.payment_status).toLowerCase() === "pending")
        .reduce((acc, order) => acc + orderAmount(order), 0),
    [filteredOrders]
  );

  const aov = filteredOrders.length ? gmv / filteredOrders.length : 0;

  const paymentSuccessCount = useMemo(
    () =>
      filteredOrders.filter((order) => {
        const status = String(order.payment_status).toLowerCase();
        return status === "success" || status === "delivered";
      }).length,
    [filteredOrders]
  );

  const statItems = useMemo(
    () => [
      {
        label: "GMV",
        value: currencyFormatter.format(gmv),
      },
      {
        label: "Orders",
        value: numberFormatter.format(filteredOrders.length),
      },
      {
        label: "AOV",
        value: currencyFormatter.format(aov),
      },
      {
        label: "Payment Success Rate",
        value: `${toPercent(paymentSuccessCount, filteredOrders.length || 1).toFixed(1)}%`,
        hint: `Pending exposure: ${currencyFormatter.format(pendingExposure)}`,
      },
    ],
    [aov, filteredOrders.length, gmv, paymentSuccessCount, pendingExposure]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setMarketFilter("all");
    setPaymentStatusFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Marketplace Analytics"
          subtitle="Sales, orders, payment risk, and market-level performance"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          cumulativeFrom={cumulativeFrom}
          extra={
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Market</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={marketFilter}
                  onChange={(event) => setMarketFilter(event.target.value)}
                >
                  <option value="all">All markets</option>
                  {marketOptions.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Payment status</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={paymentStatusFilter}
                  onChange={(event) =>
                    setPaymentStatusFilter(event.target.value as PaymentStatus | "all")
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">GMV Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: gmvTrend.labels,
                  datasets: [
                    {
                      label: "GMV (GHS)",
                      data: gmvTrend.values,
                      borderColor: "#16A34A",
                      backgroundColor: "rgba(22, 163, 74, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Orders Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: orderTrend.labels,
                  datasets: [
                    {
                      label: "Orders",
                      data: orderTrend.values,
                      borderColor: "#2563EB",
                      backgroundColor: "rgba(37, 99, 235, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Payment Status Mix</h3>
            <div className="h-64 mt-3">
              <Doughnut
                data={{
                  labels: paymentStatusMix.map((item) => item.label),
                  datasets: [
                    {
                      data: paymentStatusMix.map((item) => item.value),
                      backgroundColor: ["#16A34A", "#F59E0B", "#DC2626", "#2563EB", "#94A3B8"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Revenue by Market</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: marketRevenue.map((item) => item.label),
                  datasets: [
                    {
                      label: "GMV (GHS)",
                      data: marketRevenue.map((item) => item.value),
                      backgroundColor: "#2563EB",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={marketplaceContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load marketplace analytics data.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading marketplace analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default MarketplaceAnalytics;
