import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";
import { ProductChip } from "../chips/ProductChip";
import { Button } from "@/components";

interface IProps {
  product: IProductTypeResponse;
  handleViewProduct: (id: string) => void;
}

export const ProductCard = ({ product, handleViewProduct }: IProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className=" bg-[#D9D9D9]">
        <img
          src={`${product?.product_colours?.[0]?.image_url}`}
          alt={`${product.name} product image`}
          className="w-full object-contain h-56 p-4"
        />
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
            {product.price_currency || "GHC"} {product.price_amount}
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
