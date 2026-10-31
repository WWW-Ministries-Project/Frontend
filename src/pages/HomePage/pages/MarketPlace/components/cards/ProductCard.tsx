import type { MouseEvent } from "react";

import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";

import { colourLabel, formatMoney, productStock, TONE_CLASSES } from "../../utils/marketplaceModel";
import { ProductTile } from "../storefront/ProductTile";
import {
  colourImage,
  defaultColourIndex,
  isSingleVariant,
  productBadge,
  swatchHex,
} from "../storefront/storefrontModel";

interface IProps {
  product: IProductTypeResponse;
  handleViewProduct: (id: string) => void;
  /** Called for single-variant products when the CTA is pressed. */
  onQuickAdd?: (product: IProductTypeResponse) => void;
  /** "compact" drops the market line, colour dots, badge and CTA (related grid). */
  variant?: "full" | "compact";
}

export const ProductCard = ({
  product,
  handleViewProduct,
  onQuickAdd,
  variant = "full",
}: IProps) => {
  const colours = product.product_colours ?? [];
  const lead = colours[defaultColourIndex(product)];
  const hex = swatchHex(lead);
  const soldOut = productStock(product) <= 0;
  const single = isSingleVariant(product);
  const canQuickAdd = single && Boolean(onQuickAdd);
  const badge = productBadge(product);
  const open = () => handleViewProduct(`${product.id}`);
  const compact = variant === "compact";

  const cta = soldOut ? "Sold out" : canQuickAdd ? "Add to cart" : "Choose options";

  const handleCta = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (soldOut) return;
    if (canQuickAdd && onQuickAdd) onQuickAdd(product);
    else open();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      aria-label={`${product.name}, ${formatMoney(product.price_amount)}`}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-lightGray bg-white p-2.5 text-primary transition-shadow duration-150 hover:shadow-[0_10px_24px_rgb(var(--color-shadow)_/_0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <ProductTile
        hex={hex}
        imageUrl={colourImage(lead)}
        alt={product.name}
        label={product.product_type?.name}
        className="rounded-lg"
      >
        {!compact && badge && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-md border px-2 py-0.5 text-xs font-semibold",
              TONE_CLASSES[badge.tone]
            )}
          >
            {badge.label}
          </span>
        )}
      </ProductTile>

      {compact ? (
        <div className="flex flex-col gap-0.5 px-1 pb-1">
          <p className="text-base font-semibold">{product.name}</p>
          <span className="font-semibold">{formatMoney(product.price_amount)}</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-0.5 px-1">
          {product.market?.name && (
            <p className="text-xs text-primaryGray">{product.market.name}</p>
          )}
          <p className="text-base font-semibold leading-[22px]">{product.name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-semibold">{formatMoney(product.price_amount)}</span>
            {colours.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1">
                {colours.slice(0, 6).map((c, i) => (
                  <span
                    key={`${c.colour}-${i}`}
                    title={colourLabel(c)}
                    className="h-3 w-3 rounded-full shadow-[0_0_0_1px_rgb(var(--color-lightGray))]"
                    style={{ background: swatchHex(c) }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!compact && (
        <button
          type="button"
          onClick={handleCta}
          disabled={soldOut}
          className="min-h-10 rounded-lg border border-lightGray bg-white text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-lightGray disabled:hover:bg-white disabled:hover:text-primary"
        >
          {cta}
        </button>
      )}
    </div>
  );
};
