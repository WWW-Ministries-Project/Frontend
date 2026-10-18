import { cn } from "@/utils/cn";

import type { PriceBucket } from "./storefrontModel";

export interface FilterOption {
  key: string;
  label: string;
  count?: number;
  hex?: string;
}

interface IProps {
  className?: string;
  categories: FilterOption[];
  selectedCategories: string[];
  onToggleCategory: (key: string) => void;
  priceOptions: { key: PriceBucket; label: string }[];
  price: PriceBucket;
  onPrice: (key: PriceBucket) => void;
  colours: FilterOption[];
  selectedColours: string[];
  onToggleColour: (key: string) => void;
  sizes: string[];
  selectedSizes: string[];
  onToggleSize: (key: string) => void;
  inStockOnly: boolean;
  onToggleStock: () => void;
}

const Heading = ({ children }: { children: string }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.05em] text-primaryGray">{children}</p>
);

/** Left-hand filter panel from the design's Shop screen. */
export function ShopFilters(props: IProps) {
  return (
    <aside
      aria-label="Filters"
      className={cn(
        "flex-col gap-6 rounded-xl border border-lightGray bg-white p-5 text-primary",
        props.className
      )}
    >
      {props.categories.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Heading>Category</Heading>
          {props.categories.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={props.selectedCategories.includes(c.key)}
                onChange={() => props.onToggleCategory(c.key)}
                className="h-4 w-4 accent-primary"
              />
              <span className="flex-1">{c.label}</span>
              <span className="text-sm text-mainGray">{c.count}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <Heading>Price</Heading>
        {props.priceOptions.map((o) => (
          <label key={o.key || "any"} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name="shop-price"
              checked={props.price === o.key}
              onChange={() => props.onPrice(o.key)}
              className="h-4 w-4 accent-primary"
            />
            {o.label}
          </label>
        ))}
      </div>

      {props.colours.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading>Colour</Heading>
          <div className="flex flex-wrap gap-3 p-0.5">
            {props.colours.map((c) => {
              const on = props.selectedColours.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => props.onToggleColour(c.key)}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={on}
                  className="h-7 w-7 rounded-full"
                  style={{
                    background: c.hex,
                    boxShadow: on
                      ? "0 0 0 2px #fff, 0 0 0 4px rgb(var(--color-primary))"
                      : "0 0 0 1px rgb(var(--color-lightGray))",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {props.sizes.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading>Size</Heading>
          <div className="grid grid-cols-4 gap-1.5">
            {props.sizes.map((z) => {
              const on = props.selectedSizes.includes(z);
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => props.onToggleSize(z)}
                  aria-pressed={on}
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium",
                    on
                      ? "border-primary bg-primary text-white"
                      : "border-lightGray bg-white text-primary hover:bg-gray-100"
                  )}
                >
                  {z}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 border-t border-gray-200 pt-4 text-sm">
        <input
          type="checkbox"
          checked={props.inStockOnly}
          onChange={props.onToggleStock}
          className="h-4 w-4 accent-primary"
        />
        In stock only
      </label>
    </aside>
  );
}
