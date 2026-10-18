import {
  isPaid,
  type MarketOrder,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";

export interface MarketStats {
  orders: number;
  revenue: number;
  units: number;
  toFulfil: number;
}

export const EMPTY_STATS: MarketStats = {
  orders: 0,
  revenue: 0,
  units: 0,
  toFulfil: 0,
};

/**
 * Per-market order stats from grouped orders. An order counts towards every
 * market it has a line in; revenue and units only count paid lines that
 * belong to that market.
 */
export const statsByMarket = (orders: MarketOrder[]) => {
  const map = new Map<string, MarketStats>();
  orders.forEach((order) => {
    const paid = isPaid(order);
    const touched = new Set<string>();
    order.lines.forEach((line) => {
      if (line.marketId === undefined || line.marketId === null) return;
      const key = String(line.marketId);
      const stats = map.get(key) ?? { ...EMPTY_STATS };
      if (!touched.has(key)) {
        touched.add(key);
        stats.orders += 1;
        if (paid && order.delivery === "pending") stats.toFulfil += 1;
      }
      if (paid) {
        stats.revenue += line.lineTotal;
        stats.units += line.quantity;
      }
      map.set(key, stats);
    });
  });
  return map;
};

/** Units sold per product id across paid orders. */
export const unitsSoldByProduct = (orders: MarketOrder[]) => {
  const map = new Map<string, number>();
  orders.filter(isPaid).forEach((order) =>
    order.lines.forEach((line) => {
      if (line.productId === undefined || line.productId === null) return;
      const key = String(line.productId);
      map.set(key, (map.get(key) ?? 0) + line.quantity);
    })
  );
  return map;
};
