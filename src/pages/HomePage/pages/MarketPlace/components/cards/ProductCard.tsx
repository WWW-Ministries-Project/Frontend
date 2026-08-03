import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";
import { ProductChip } from "../chips/ProductChip";
import { Button } from "@/components";

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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className=" bg-[#D9D9D9] relative">
        <img
          src={`${product?.product_colours?.[0]?.image_url}`}
          alt={`${product.name} product image`}
          className="w-full object-cover h-56 p-4"
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of stock
          </span>
        )}
        <div className="flex justify-between px-4 pt-2 pb-4">
          <ProductChip section="type" text={product.product_type?.name} />
          <ProductChip
            section="category"
            text={product.product_category?.name}
          />
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex flex-col gap-2 text-[#404040]">
          <h2 className="font-semibold text-sm line-clamp-1">{product.name}</h2>
          <p className="text-lg font-bold ">
            {product.price_currency || "GHC"}{" "}
            {Number(product.price_amount).toFixed(2)}
          </p>
        </div>
        <div className="w-full">
          <Button
            value="View Product"
            className="w-full"
            onClick={() => handleViewProduct(`${product.id}`)}
          />
        </div>
      </div>
    </div>
  );
};
