import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";

interface IProps {
  product: IProductTypeResponse;
  handleViewProduct: (id: string) => void;
}

const isOutOfStock = (product: IProductTypeResponse) => {
  if (product.stock_managed !== "yes") return false;
  const colours = product.product_colours ?? [];
  if (!colours.length) return false;
  return colours.every((colour) => {
    const stock = colour.stock ?? [];
    return stock.length > 0 && stock.every((s) => Number(s.stock) <= 0);
  });
};

export const ProductCard = ({ product, handleViewProduct }: IProps) => {
  const outOfStock = isOutOfStock(product);
  const swatches = Array.from(
    new Set((product.product_colours ?? []).map((colour) => colour.colour))
  ).filter(Boolean);
  const visibleSwatches = swatches.slice(0, 4);
  const extraSwatchCount = swatches.length - visibleSwatches.length;

  return (
    <button
      type="button"
      onClick={() => handleViewProduct(`${product.id}`)}
      className="group w-full rounded-xl bg-white text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="relative overflow-hidden rounded-t-xl bg-inputBackground">
        <img
          src={`${product?.product_colours?.[0]?.image_url}`}
          alt={`${product.name} product image`}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 rounded-md bg-primary/90 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        {product.product_category?.name && (
          <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
            {product.product_category.name}
          </p>
        )}
        <h2 className="line-clamp-1 text-sm font-semibold text-primary">
          {product.name}
        </h2>
        <p className="text-base font-bold text-primary">
          {product.price_currency || "GHC"} {Number(product.price_amount).toFixed(2)}
        </p>
        {visibleSwatches.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {visibleSwatches.map((colour, index) => (
              <span
                key={`${colour}-${index}`}
                className="h-4 w-4 rounded-full border border-lightGray"
                style={{ backgroundColor: colour }}
              />
            ))}
            {extraSwatchCount > 0 && (
              <span className="text-[11px] text-primaryGray">+{extraSwatchCount}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
