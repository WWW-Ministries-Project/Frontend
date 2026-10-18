import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  encodeQuery,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import { api, type IOrders } from "@/utils";
import { cn } from "@/utils/cn";

import {
  downloadCsv,
  formatDate,
  formatMoney,
  formatTime,
  fulfilmentMethodLabel,
  fulfilmentPill,
  groupOrderRows,
  orderTabsFor,
  ordersToCsv,
  paymentPill,
  type MarketOrder,
} from "../../utils/marketplaceModel";
import { StatusPill } from "../StatusPill";
import { CreateOrderForMemberModal } from "./CreateOrderForMemberModal";
import {
  countOrderFilters,
  EMPTY_ORDER_FILTERS,
  type OrderFilterValues,
} from "./orderFilters";
import { OrdersFilterPanel } from "./OrdersFilterPanel";
import { btnPrimary, btnSecondary, errorMessage } from "./orderUi";

interface IProps {
  /** Scope the panel to one market (market detail page). */
  marketId?: string;
  /** Initial status tab label, e.g. "To fulfil" or "Unpaid". */
  initialTab?: string;
  /** When given, renders the design's page header with the actions on the right. */
  title?: string;
  subtitle?: string;
}

const rowKey = (row: IOrders) => String(row.order_id ?? row.id);
const isoDay = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13.9971 21C13.7822 21 13.5732 20.9317 13.4013 20.8054L9.40702 17.8865C9.28368 17.7959 9.18357 17.6783 9.11463 17.5432C9.04568 17.4081 9.00978 17.2592 9.00978 17.1081V13.5373L3.38984 6.10378C3.17102 5.81419 3.03856 5.47075 3.00722 5.11175C2.97589 4.75274 3.04691 4.39226 3.21237 4.07047C3.37783 3.74867 3.63123 3.47821 3.94434 3.28921C4.25745 3.1002 4.61798 3.00008 4.98575 3H19.0143C19.382 3.00008 19.7425 3.1002 20.0557 3.28921C20.3688 3.47821 20.6222 3.74867 20.7876 4.07047C20.9531 4.39226 21.0241 4.75274 20.9928 5.11175C20.9614 5.47075 20.829 5.81419 20.6102 6.10378L14.9902 13.5373V20.027C14.9902 20.2851 14.8856 20.5326 14.6993 20.715C14.5131 20.8975 14.2605 21 13.9971 21ZM10.996 16.6216L13.004 18.0879V13.2162C13.004 13.0057 13.0737 12.8008 13.2026 12.6324L19.0143 4.94595H4.98575L10.8013 12.6324C10.9303 12.8008 11 13.0057 11 13.2162L10.996 16.6216Z"
      fill="#474D66"
    />
  </svg>
);

const GRID =
  "grid grid-cols-[32px_1fr_1fr_1.6fr_0.7fr_1fr_0.8fr_1.1fr_0.8fr] items-center gap-3";

/**
 * Admin orders list: status tabs, search, filters, CSV export, payment
 * reconciliation, bulk status updates and "Place order for member".
 * Used by the Orders page (all markets) and the market detail page.
 */
export function OrdersPanel({ marketId, initialTab, title, subtitle }: IProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAdmin, canManage } = useAccessControl();

  const ordersQuery = useMemo(() => (marketId ? { market_id: marketId } : undefined), [marketId]);
  const { data: ordersRes, refetch } = useFetch(
    marketId ? api.fetch.fetchOrdersByMarket : api.fetch.fetchAllOrders,
    ordersQuery
  );
  const { data: marketsRes } = useFetch(api.fetch.fetchMarkets, undefined, false, { silent: true });

  const rows = useMemo(() => ordersRes?.data || [], [ordersRes]);
  const markets = useMemo(() => marketsRes?.data || [], [marketsRes]);
  const orders = useMemo(() => groupOrderRows(rows), [rows]);
  const tabs = useMemo(() => orderTabsFor(orders), [orders]);

  const [tab, setTab] = useState(initialTab || "All");
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrderFilterValues>(EMPTY_ORDER_FILTERS);
  const [selected, setSelected] = useState<string[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Tab labels can change wording ("Ready for pickup" ↔ "Out for delivery / ready").
  const activeTab =
    tabs.find((t) => t.label === tab) ||
    (tab === "Ready for pickup" || tab === "Out for delivery / ready"
      ? tabs[3]
      : tabs[0]);

  // Item-level filters (product/size/colour/market) match on the raw rows:
  // an order matches when any of its items satisfies all of them.
  const itemMatchedIds = useMemo(() => {
    const needItemFilter =
      market || filters.product || filters.size || filters.colour || filters.marketStatus;
    if (!needItemFilter) return null;
    const ids = new Set<string>();
    rows.forEach((r) => {
      const colourName = r.colour_name?.trim() || r.color;
      if (market && String(r.market_id) !== market) return;
      if (filters.product && String(r.product_id) !== filters.product) return;
      if (filters.size && r.size !== filters.size) return;
      if (filters.colour && colourName !== filters.colour) return;
      if (
        filters.marketStatus &&
        String(r.market_status || "").toLowerCase() !== filters.marketStatus
      )
        return;
      ids.add(rowKey(r));
    });
    return ids;
  }, [rows, market, filters]);

  const baseFiltered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (!itemMatchedIds || itemMatchedIds.has(String(o.id))) &&
          (!filters.payment || o.payment === filters.payment) &&
          (!filters.date || isoDay(o.createdAt) === filters.date)
      ),
    [orders, itemMatchedIds, filters.payment, filters.date]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseFiltered
      .filter(activeTab.match)
      .filter(
        (o) =>
          !q ||
          `${o.orderNumber} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(q)
      );
  }, [baseFiltered, activeTab, query]);

  const filterOptions = useMemo(() => {
    const products = new Map<string, string>();
    const sizes = new Set<string>();
    const colours = new Set<string>();
    rows.forEach((r) => {
      const name = (r as IOrders & { product_name?: string }).product_name || r.name;
      if (r.product_id != null && name) products.set(String(r.product_id), name);
      if (r.size) sizes.add(r.size);
      const c = r.colour_name?.trim() || r.color;
      if (c) colours.add(c);
    });
    return {
      products: Array.from(products, ([value, label]) => ({ value, label })).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
      sizes: Array.from(sizes),
      colours: Array.from(colours).sort(),
    };
  }, [rows]);

  const filterCount = countOrderFilters(filters);
  const marketName = marketId
    ? markets.find((m) => String(m.id) === String(marketId))?.name ||
      orders[0]?.lines[0]?.marketName ||
      ""
    : "";

  const clearSelection = () => setSelected([]);
  const updateFilters = (patch: Partial<OrderFilterValues>) => {
    setFilters((f) => ({ ...f, ...patch }));
    clearSelection();
  };

  const allSelected = visible.length > 0 && visible.every((o) => selected.includes(String(o.id)));
  const toggleAll = () => setSelected(allSelected ? [] : visible.map((o) => String(o.id)));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const openOrder = (o: MarketOrder) =>
    navigate(`/home/market-place/orders/${encodeQuery(String(o.id))}`, {
      state: {
        from: location.pathname + location.search,
        backLabel: marketId && marketName ? `Back to ${marketName}` : "Back to orders",
      },
    });

  const handleExport = () => {
    const prefix = marketName ? `${marketName.replace(/\W+/g, "-")}-` : "";
    downloadCsv(ordersToCsv(visible), `${prefix}Orders.csv`);
    showNotification(`Exported ${plural(visible.length, "order")}`, "success");
  };

  const handleReconcile = async () => {
    if (reconciling) return;
    setReconciling(true);
    try {
      const res = await api.post.reconcileHubtelPendingPayments(100);
      const r = (res?.data || {}) as {
        success_updates?: number;
        failed_updates?: number;
        still_pending?: number;
      };
      const changed = (r.success_updates || 0) + (r.failed_updates || 0);
      showNotification(
        changed
          ? `Reconciled ${plural(changed, "pending payment")}` +
              (r.still_pending ? ` · ${r.still_pending} still pending` : "")
          : "No pending payments to reconcile",
        "success"
      );
      await refetch();
    } catch (err) {
      showNotification(errorMessage(err, "Unable to reconcile pending payments."), "error");
    } finally {
      setReconciling(false);
    }
  };

  const orderNumberOf = (id: number | string) =>
    orders.find((o) => String(o.id) === String(id))?.orderNumber || `#${id}`;

  const runBulk = async (
    patch: { payment_status?: "success"; delivery_status?: "shipped" | "delivered" },
    verb: string
  ) => {
    if (!selected.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      const res = await api.put.bulkUpdateOrderStatus({ ids: selected, ...patch });
      const updated = res?.data?.updated?.length || 0;
      const skipped = res?.data?.skipped || [];
      if (skipped.length) {
        showNotification(
          `${plural(updated, "order")} ${verb}, ${skipped.length} skipped`,
          updated ? "success" : "error",
          {
            details: [
              {
                title: "Skipped",
                tone: "neutral",
                items: skipped.map((s) => ({
                  label: orderNumberOf(s.id),
                  description: s.reason,
                })),
              },
            ],
          }
        );
      } else {
        showNotification(`${plural(updated, "order")} ${verb}`, "success");
      }
      clearSelection();
      await refetch();
    } catch (err) {
      showNotification(errorMessage(err, "Unable to update the selected orders"), "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = () => {
    if (!selected.length) return;
    showDeleteDialog(
      { id: selected.join(","), name: plural(selected.length, "order") },
      async (ids) => {
        try {
          const res = await api.delete.bulkDeleteOrders({ ids: String(ids) });
          const skipped = res?.data?.skipped?.length || 0;
          showNotification(
            skipped
              ? `${res?.data?.deleted ?? 0} order(s) deleted, ${skipped} could not be deleted`
              : "Selected orders deleted",
            skipped ? "error" : "success"
          );
          clearSelection();
          await refetch();
        } catch (err) {
          showNotification(errorMessage(err, "Unable to delete selected orders"), "error");
        }
      }
    );
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={showFilters}
        onClick={() => setShowFilters((v) => !v)}
        className={cn(btnSecondary, showFilters && "bg-primary/5")}
      >
        <FilterIcon />
        <span>Filters</span>
        {filterCount > 0 && (
          <span className="rounded-full bg-primary px-2 text-xs font-semibold text-white">
            {filterCount}
          </span>
        )}
      </button>
      <button type="button" onClick={handleExport} className={btnSecondary}>
        Export to Excel
      </button>
      <button
        type="button"
        onClick={handleReconcile}
        disabled={reconciling}
        className={btnSecondary}
      >
        {reconciling ? "Reconciling…" : "Reconcile payments"}
      </button>
      {canManage("Marketplace") && (
        <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
          Place order for member
        </button>
      )}
    </div>
  );

  const bulkBtn =
    "rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/10 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4 text-primary">
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="text-base text-gray-600">{subtitle}</p>}
          </div>
          {actions}
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">{actions}</div>
      )}

      {showFilters && (
        <OrdersFilterPanel
          values={filters}
          onChange={updateFilters}
          onReset={() => updateFilters(EMPTY_ORDER_FILTERS)}
          productOptions={filterOptions.products}
          sizeOptions={filterOptions.sizes}
          colourOptions={filterOptions.colours}
          showMarketStatus={!marketId}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-lightGray bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {tabs.map((t) => {
              const on = t.label === activeTab.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTab(t.label);
                    clearSelection();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
                    on
                      ? "border-primary bg-primary text-white"
                      : "border-lightGray bg-white text-primary hover:bg-gray-50"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs",
                      on ? "bg-white/20" : "bg-gray-100"
                    )}
                  >
                    {baseFiltered.filter(t.match).length}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              clearSelection();
            }}
            placeholder="Order # or customer"
            aria-label="Search orders"
            className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm sm:w-56"
          />
          {!marketId && (
            <select
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                clearSelection();
              }}
              aria-label="Market"
              className="h-10 rounded-lg border border-lightGray bg-white px-2.5 text-sm"
            >
              <option value="">All markets</option>
              {markets.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-primary px-4 py-2.5 text-sm text-white">
            <b className="mr-2">{selected.length} selected</b>
            {canManage("Marketplace") && (
              <>
                <button
                  type="button"
                  disabled={bulkBusy}
                  className={bulkBtn}
                  onClick={() => runBulk({ payment_status: "success" }, "marked paid")}
                >
                  Mark paid
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  className={bulkBtn}
                  onClick={() =>
                    runBulk({ delivery_status: "shipped" }, "marked out for delivery / ready")
                  }
                >
                  Mark out for delivery / ready
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  className={bulkBtn}
                  onClick={() => runBulk({ delivery_status: "delivered" }, "marked completed")}
                >
                  Mark completed
                </button>
              </>
            )}
            {canAdmin("Marketplace") && (
              <button
                type="button"
                disabled={bulkBusy}
                className={cn(bulkBtn, "border-red-300/60 text-red-100")}
                onClick={handleBulkDelete}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto bg-transparent text-sm text-white underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[880px]">
            <div
              className={cn(
                GRID,
                "bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600"
              )}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
                className="h-4 w-4 accent-primary"
              />
              <span>Order</span>
              <span>Date</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Fulfilment</span>
              <span>Method</span>
            </div>
            {visible.map((o) => {
              const id = String(o.id);
              const sel = selected.includes(id);
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openOrder(o)}
                  onKeyDown={(e) => e.key === "Enter" && openOrder(o)}
                  className={cn(
                    GRID,
                    "min-h-16 cursor-pointer border-t border-gray-100 px-4 py-3 text-sm hover:bg-gray-50",
                    sel ? "bg-primary/[0.04]" : "bg-white"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleOne(id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select order ${o.orderNumber}`}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-semibold">{o.orderNumber}</span>
                  <div>
                    <p>{formatDate(o.createdAt)}</p>
                    <p className="text-xs text-gray-500">{formatTime(o.createdAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer.name}</p>
                    <p className="truncate text-xs text-gray-500">{o.customer.email}</p>
                  </div>
                  <span>{plural(o.units, "item")}</span>
                  <span className="font-semibold">{formatMoney(o.total)}</span>
                  <StatusPill status={paymentPill(o)} className="justify-self-start" />
                  <StatusPill status={fulfilmentPill(o)} className="justify-self-start" />
                  <span className="text-gray-600">{fulfilmentMethodLabel(o)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col md:hidden">
          {visible.length > 0 && (
            <label className="flex items-center gap-2 border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary"
              />
              Select all
            </label>
          )}
          {visible.map((o) => {
            const id = String(o.id);
            const sel = selected.includes(id);
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => openOrder(o)}
                onKeyDown={(e) => e.key === "Enter" && openOrder(o)}
                className={cn(
                  "flex gap-3 border-b border-gray-100 px-4 py-3 text-sm",
                  sel ? "bg-primary/[0.04]" : "bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggleOne(id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select order ${o.orderNumber}`}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="truncate text-gray-600">{o.customer.name}</p>
                    </div>
                    <span className="whitespace-nowrap font-semibold">{formatMoney(o.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(o.createdAt)} · {plural(o.units, "item")} ·{" "}
                    {fulfilmentMethodLabel(o)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusPill status={paymentPill(o)} />
                    <StatusPill status={fulfilmentPill(o)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-600">No orders in this view.</p>
        )}
      </section>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Place order for member"
        className="max-w-[560px]"
      >
        {creating && (
          <CreateOrderForMemberModal
            marketId={marketId}
            onClose={() => setCreating(false)}
            onCreated={() => refetch()}
          />
        )}
      </Modal>
    </div>
  );
}
