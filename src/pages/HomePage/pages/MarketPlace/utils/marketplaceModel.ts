import type {
  FulfilmentMethod,
  IMarket,
  IOrderDetail,
  IOrders,
  IProductTypeResponse,
  ProductColour,
} from "@/utils";

/**
 * Shared marketplace model helpers used by both the admin panel and the
 * member storefront. Keep presentation-agnostic logic here (money, status
 * derivation, order grouping, stock maths) so every screen words things the
 * same way.
 */

export const CURRENCY_SYMBOL = "GH₵";

export const formatMoney = (value: number | string | null | undefined) =>
  `${CURRENCY_SYMBOL} ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Sizes in display order. Anything not listed sorts after, alphabetically. */
export const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "XXL",
  "3XL",
  "4XL",
  "One size",
];

/** Variants at or below this count are flagged as low stock. */
export const LOW_STOCK_THRESHOLD = 3;

/**
 * Default pickup point. Orders without `fulfilment_method` (older data) are
 * treated as pickup; the live pickup location comes from
 * `fetchDeliveryConfig().pickup_location` where a screen has it.
 */
export const PICKUP_LOCATION = "Church office · after any service";

// ---------------------------------------------------------------------------
// Status tones (Tailwind 50/700/200 sets from the design system)
// ---------------------------------------------------------------------------

export type Tone = "green" | "yellow" | "red" | "blue" | "gray";

export const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export interface StatusInfo {
  label: string;
  tone: Tone;
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

export type MarketState = "Upcoming" | "Active" | "Ended";

export const getMarketState = (
  market: Pick<IMarket, "start_date" | "end_date"> | null | undefined
): MarketState => {
  if (!market?.start_date || !market?.end_date) return "Ended";
  const now = Date.now();
  const start = new Date(market.start_date).getTime();
  // Treat the end date as inclusive for the whole day.
  const end = new Date(market.end_date).getTime() + 86_399_999;
  if (now < start) return "Upcoming";
  if (now <= end) return "Active";
  return "Ended";
};

export const marketStatePill = (state: MarketState): StatusInfo =>
  state === "Active"
    ? { label: "Active", tone: "green" }
    : state === "Upcoming"
      ? { label: "Upcoming", tone: "blue" }
      : { label: "Ended", tone: "gray" };

export const daysLeft = (market: Pick<IMarket, "end_date">) =>
  Math.max(
    0,
    Math.ceil(
      (new Date(market.end_date).getTime() + 86_399_999 - Date.now()) /
        86_400_000
    )
  );

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// ---------------------------------------------------------------------------
// Products & stock
// ---------------------------------------------------------------------------

export const sortSizes = (sizes: string[]) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

export const colourStock = (colour: ProductColour) =>
  (colour.stock || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

export const isStockManaged = (product: Pick<IProductTypeResponse, "stock_managed">) =>
  product.stock_managed !== "no";

/** Total units across colours. Unmanaged products report Infinity. */
export const productStock = (product: IProductTypeResponse) =>
  isStockManaged(product)
    ? (product.product_colours || []).reduce((a, c) => a + colourStock(c), 0)
    : Number.POSITIVE_INFINITY;

export const variantCount = (product: IProductTypeResponse) =>
  (product.product_colours || []).reduce(
    (a, c) => a + Math.max(1, (c.stock || []).length),
    0
  );

export const lowStockVariants = (product: IProductTypeResponse) =>
  isStockManaged(product)
    ? (product.product_colours || []).reduce(
        (a, c) =>
          a +
          (c.stock || []).filter(
            (s) => Number(s.stock) <= LOW_STOCK_THRESHOLD
          ).length,
        0
      )
    : 0;

export const colourLabel = (colour?: Pick<ProductColour, "colour" | "colour_name"> | null) =>
  colour?.colour_name?.trim() || colour?.colour || "";

export const productImage = (product: IProductTypeResponse) => {
  const img = product.product_colours?.find((c) => typeof c.image_url === "string" && c.image_url)
    ?.image_url;
  return typeof img === "string" ? img : "";
};

export const isPublished = (product: Pick<IProductTypeResponse, "status">) =>
  product.status === "published";

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type PaymentState = "pending" | "success" | "failed";
export type DeliveryState = "pending" | "shipped" | "delivered" | "cancelled";

export interface MarketOrderLine {
  id: string | number;
  productId?: string | number;
  marketId?: string | number;
  marketName?: string;
  name: string;
  colour: string;
  colourName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
  productType?: string;
  productCategory?: string;
}

export interface MarketOrder {
  id: string | number;
  orderNumber: string;
  reference?: string;
  createdAt?: string;
  payment: PaymentState;
  delivery: DeliveryState;
  customer: { firstName: string; lastName: string; name: string; email: string; phone: string };
  lines: MarketOrderLine[];
  units: number;
  /** Grand total, including any delivery fee. */
  total: number;
  /** Sum of line totals (before delivery fee). */
  subtotal?: number;
  /** "pickup" when absent (older orders). */
  fulfilmentMethod?: FulfilmentMethod;
  deliveryAddress?: string;
  deliveryFee?: number;
  /** Gateway used, when the API exposes it ("hubtel" | "paystack"). */
  paymentType?: string;
}

/** Fields the order endpoints may add over time; read defensively. */
type OrderExtras = {
  fulfilment_method?: FulfilmentMethod | string | null;
  delivery_address?: string | null;
  delivery_fee?: number | string | null;
  payment_type?: string | null;
  product_name?: string;
  market_name?: string;
};

const normMethod = (v: unknown): FulfilmentMethod =>
  String(v || "").toLowerCase() === "delivery" ? "delivery" : "pickup";

/** Method-bearing shape accepted by the wording helpers below. */
type WithMethod = { fulfilmentMethod?: FulfilmentMethod };

const isDeliveryOf = (o: WithMethod | null | undefined, method?: FulfilmentMethod) =>
  (method ?? o?.fulfilmentMethod) === "delivery";

export const isDeliveryOrder = (o: WithMethod) => isDeliveryOf(o);

const normPayment = (v: unknown): PaymentState => {
  const s = String(v || "").toLowerCase();
  return s === "success" || s === "failed" ? s : "pending";
};

const normDelivery = (v: unknown): DeliveryState => {
  const s = String(v || "").toLowerCase();
  return s === "shipped" || s === "delivered" || s === "cancelled" ? s : "pending";
};

/**
 * The list endpoints return one row per order item. Fold them back into
 * whole orders, preserving the server's ordering (newest first).
 */
export const groupOrderRows = (rows: IOrders[] | null | undefined): MarketOrder[] => {
  const map = new Map<string, MarketOrder>();
  const serverTotals = new Map<string, number>();
  (rows || []).forEach((row) => {
    const key = String(row.order_id ?? row.order_number ?? row.id);
    let order = map.get(key);
    if (!order) {
      const first = row.first_name || "";
      const last = row.last_name || "";
      const x = row as IOrders & OrderExtras;
      const fee = Number(x.delivery_fee) || 0;
      order = {
        id: row.order_id ?? row.id,
        orderNumber: row.order_number || String(row.order_id ?? row.id),
        reference: row.reference,
        createdAt: row.created_at || row.order_created_at || row.ordered_at,
        payment: normPayment(row.payment_status),
        delivery: normDelivery(row.delivery_status),
        customer: {
          firstName: first,
          lastName: last,
          name: `${first} ${last}`.trim() || row.email || "Guest",
          email: row.email || "",
          phone: row.phone_number || "",
        },
        lines: [],
        units: 0,
        total: fee,
        subtotal: 0,
        fulfilmentMethod: normMethod(x.fulfilment_method),
        deliveryAddress: x.delivery_address || undefined,
        deliveryFee: fee,
        paymentType: x.payment_type || undefined,
      };
      map.set(key, order);
    }
    const qty = Number(row.quantity) || 0;
    const unit = Number(row.price_amount) || 0;
    const r = row as IOrders & OrderExtras;
    order.lines.push({
      id: row.id,
      productId: row.product_id,
      marketId: row.market_id,
      marketName: r.market_name,
      name: r.product_name || row.name,
      colour: row.color,
      colourName: row.colour_name?.trim() || row.color,
      size: row.size,
      quantity: qty,
      unitPrice: unit,
      lineTotal: unit * qty,
      imageUrl: row.image_url,
      productType: row.product_type,
      productCategory: row.product_category,
    });
    order.units += qty;
    order.total += unit * qty;
    order.subtotal = (order.subtotal || 0) + unit * qty;
    // Prefer the server's stored order total (incl. delivery fee) when sent.
    if (row.order_total != null && Number.isFinite(Number(row.order_total)))
      serverTotals.set(key, Number(row.order_total));
  });
  serverTotals.forEach((t, key) => {
    const o = map.get(key);
    if (o) o.total = t;
  });
  return Array.from(map.values());
};

/** Normalise the single-order endpoint into the same shape as list rows. */
export const fromOrderDetail = (detail: IOrderDetail): MarketOrder => {
  const b = detail.billing_details;
  const first = b?.first_name || "";
  const last = b?.last_name || "";
  const lines: MarketOrderLine[] = (detail.items || []).map((i) => {
    const qty = Number(i.quantity) || 0;
    const unit = Number(i.price_amount) || 0;
    return {
      id: i.id,
      productId: i.product_id ?? undefined,
      marketId: i.market_id ?? undefined,
      name: i.name,
      colour: i.product_colour?.colour || i.color,
      colourName: i.product_colour?.colour_name?.trim() || i.color,
      size: i.size,
      quantity: qty,
      unitPrice: unit,
      lineTotal: unit * qty,
      imageUrl: i.image_url || i.product_colour?.image_url || "",
      productType: i.product_type,
      productCategory: i.product_category,
    };
  });
  const x = detail as IOrderDetail & OrderExtras;
  const fee = Number(x.delivery_fee) || 0;
  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  return {
    id: detail.id,
    orderNumber: detail.order_number,
    reference: detail.reference,
    createdAt: detail.created_at,
    payment: normPayment(detail.payment_status),
    delivery: normDelivery(detail.delivery_status),
    customer: {
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim() || b?.email || "Guest",
      email: b?.email || "",
      phone: b?.phone_number || "",
    },
    lines,
    units: lines.reduce((a, l) => a + l.quantity, 0),
    total: Number(detail.total_amount) || subtotal + fee,
    subtotal,
    fulfilmentMethod: normMethod(x.fulfilment_method),
    deliveryAddress: x.delivery_address || undefined,
    deliveryFee: fee,
    paymentType: x.payment_type || undefined,
  };
};

export const isPaid = (o: Pick<MarketOrder, "payment" | "delivery">) =>
  o.payment === "success" && o.delivery !== "cancelled";

export const isManualOrder = (o: Pick<MarketOrder, "reference">) =>
  String(o.reference || "").startsWith("MANUAL-");

export const paymentPill = (o: Pick<MarketOrder, "payment">): StatusInfo =>
  o.payment === "success"
    ? { label: "Paid", tone: "green" }
    : o.payment === "failed"
      ? { label: "Failed", tone: "red" }
      : { label: "Pending", tone: "yellow" };

/**
 * Fulfilment wording follows the order's method (pickup unless the order says
 * delivery). `method` overrides the order's own `fulfilmentMethod`.
 */
export const fulfilmentPill = (
  o: Pick<MarketOrder, "delivery"> & WithMethod,
  method?: FulfilmentMethod
): StatusInfo => {
  const del = isDeliveryOf(o, method);
  return o.delivery === "cancelled"
    ? { label: "Cancelled", tone: "red" }
    : o.delivery === "delivered"
      ? { label: del ? "Delivered" : "Collected", tone: "green" }
      : o.delivery === "shipped"
        ? { label: del ? "Out for delivery" : "Ready for pickup", tone: "blue" }
        : { label: "Unfulfilled", tone: "gray" };
};

/** Single member-facing status that combines payment and fulfilment. */
export const orderStatusPill = (
  o: Pick<MarketOrder, "payment" | "delivery"> & WithMethod,
  method?: FulfilmentMethod
): StatusInfo => {
  const del = isDeliveryOf(o, method);
  if (o.delivery === "cancelled") return { label: "Cancelled", tone: "red" };
  if (o.payment === "failed") return { label: "Payment failed", tone: "red" };
  if (o.payment === "pending") return { label: "Awaiting payment", tone: "yellow" };
  if (o.delivery === "delivered") return { label: del ? "Delivered" : "Collected", tone: "green" };
  if (o.delivery === "shipped") return { label: del ? "On the way" : "Ready for pickup", tone: "blue" };
  return { label: "Processing", tone: "gray" };
};

/** "Pickup" / "Delivery" short label for tables. */
export const fulfilmentMethodLabel = (o: WithMethod, method?: FulfilmentMethod) =>
  isDeliveryOf(o, method) ? "Delivery" : "Pickup";

/** Payment gateway display info, inferred from the reference / payment type. */
export const paymentGateway = (
  o: Pick<MarketOrder, "reference"> & { paymentType?: string }
): { key: "manual" | "hubtel" | "paystack"; name: string; channel: string } => {
  if (isManualOrder(o)) return { key: "manual", name: "Manual", channel: "Cash / bank transfer" };
  if (String(o.paymentType || "").toLowerCase() === "paystack")
    return { key: "paystack", name: "Paystack", channel: "Card or mobile money" };
  // Hubtel is the active marketplace gateway; orders without a recorded
  // payment type are Hubtel checkouts.
  return { key: "hubtel", name: "Hubtel", channel: "Mobile money" };
};

export interface OrderStep {
  label: string;
  sub: string;
  done: boolean;
}

export const orderSteps = (o: MarketOrder, method?: FulfilmentMethod): OrderStep[] => {
  const del = isDeliveryOf(o, method);
  const idx =
    o.delivery === "delivered" ? 3 : o.delivery === "shipped" ? 2 : o.payment === "success" ? 1 : 0;
  const placed = [formatDate(o.createdAt), formatTime(o.createdAt)].filter(Boolean).join(" · ");
  const labels = [
    "Order placed",
    "Payment confirmed",
    del ? "Out for delivery" : "Ready for pickup",
    del ? "Delivered" : "Collected",
  ];
  const subs = [
    placed,
    isManualOrder(o) ? "Recorded by the church office" : `Via ${paymentGateway(o).name}`,
    del ? "On its way to your address" : "We'll notify you when it's ready",
    del ? "Delivered to your address" : "Show your order number at the church office",
  ];
  return labels.map((label, i) => ({
    label,
    sub: i <= idx ? subs[i] : i === idx + 1 ? "Up next" : "",
    done: i <= idx,
  }));
};

/** The next fulfilment action an admin can take, if any. */
export const nextOrderAction = (
  o: Pick<MarketOrder, "payment" | "delivery"> & WithMethod,
  method?: FulfilmentMethod
): { label: string; patch: { payment_status?: PaymentState; delivery_status?: DeliveryState }; success: string } | null => {
  const del = isDeliveryOf(o, method);
  if (o.delivery === "cancelled" || o.delivery === "delivered") return null;
  if (o.payment !== "success")
    return { label: "Mark as paid", patch: { payment_status: "success" }, success: "Payment recorded" };
  if (o.delivery === "pending")
    return del
      ? { label: "Mark out for delivery", patch: { delivery_status: "shipped" }, success: "Marked out for delivery" }
      : {
          label: "Mark ready for pickup",
          patch: { delivery_status: "shipped" },
          success: "Customer notified: ready for pickup",
        };
  return {
    label: del ? "Mark as delivered" : "Mark as collected",
    patch: { delivery_status: "delivered" },
    success: "Order completed",
  };
};

export type OrderTab = { label: string; match: (o: MarketOrder) => boolean };

export const ORDER_TABS: OrderTab[] = [
  { label: "All", match: () => true },
  { label: "Unpaid", match: (o) => o.payment !== "success" && o.delivery !== "cancelled" },
  { label: "To fulfil", match: (o) => o.payment === "success" && o.delivery === "pending" },
  { label: "Ready for pickup", match: (o) => o.delivery === "shipped" },
  { label: "Completed", match: (o) => o.delivery === "delivered" },
  { label: "Cancelled", match: (o) => o.delivery === "cancelled" },
];

/**
 * Admin order tabs. When any delivery order is in view the "shipped" tab is
 * worded "Out for delivery / ready" (design); otherwise it stays pickup-only.
 */
export const orderTabsFor = (orders: MarketOrder[]): OrderTab[] =>
  orders.some((o) => isDeliveryOrder(o))
    ? ORDER_TABS.map((t) =>
        t.label === "Ready for pickup" ? { ...t, label: "Out for delivery / ready" } : t
      )
    : ORDER_TABS;

/** Client-side CSV export (one row per line item). */
export const ordersToCsv = (orders: MarketOrder[]) => {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = [
    "Order",
    "Date",
    "Customer",
    "Email",
    "Phone",
    "Market",
    "Product",
    "Colour",
    "Size",
    "Quantity",
    "Price (GHS)",
    "Total (GHS)",
    "Payment status",
    "Fulfilment",
    "Method",
    "Delivery address",
  ];
  const rows = orders.flatMap((o) =>
    o.lines.map((l) => [
      o.orderNumber,
      formatDate(o.createdAt),
      o.customer.name,
      o.customer.email,
      o.customer.phone,
      l.marketName || "",
      l.name,
      l.colourName,
      l.size,
      l.quantity,
      l.unitPrice.toFixed(2),
      l.lineTotal.toFixed(2),
      paymentPill(o).label,
      fulfilmentPill(o).label,
      fulfilmentMethodLabel(o),
      o.deliveryAddress || "",
    ])
  );
  return "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
};

export const downloadCsv = (csv: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
