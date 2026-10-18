export const PRODUCT_TABS = [
  "All",
  "Published",
  "Draft",
  "Low stock",
  "Out of stock",
] as const;
export type ProductTab = (typeof PRODUCT_TABS)[number];

/** Accepts "Low stock", "low-stock", "low_stock"… (e.g. from `?tab=`). */
export const toProductTab = (value?: string | null): ProductTab => {
  const v = String(value || "").toLowerCase().replace(/[-_+]/g, " ").trim();
  return PRODUCT_TABS.find((t) => t.toLowerCase() === v) ?? "All";
};
