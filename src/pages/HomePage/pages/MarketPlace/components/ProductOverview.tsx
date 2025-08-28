import { Button } from "@/components";
import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";

import { ProductDetails } from "./ProductDetails";

interface IProductProps {
  product: IProductTypeResponse;
  onEdit: (id: string) => void;
}

export function ProductOverview({ product, onEdit }: IProductProps) {
  return (
    <div className="w-[800px] xs:w-[350px] sm:w-[400px] md:w-[400px] lg:w-[800px]">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h3 className="font-bold text-2xl">Product Overview</h3>
        <div className="flex items-center gap-3">
          <Button
            value="Edit"
            className="bg-white text-primary"
            onClick={() => onEdit(`${product.id}`)}
          />
        </div>
      </div>

      <ProductDetails product={product} />
    </div>
  );
}
