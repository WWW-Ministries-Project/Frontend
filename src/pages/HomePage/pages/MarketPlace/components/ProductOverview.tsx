import { Button } from "@/components";
import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";

import { ProductDetails } from "./ProductDetails";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface IProductProps {
  product: IProductTypeResponse;
  onEdit: (id: string) => void;
  onClose:()=>void
}

export function ProductOverview({ product, onEdit,onClose }: IProductProps) {
  return (
    <div className="w-full rounded-t-lg">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 flex items-center justify-between gap-3">
        <div className="w-full flex items-center justify-between gap-4">
        <h3 className="font-bold text-2xl">Product Overview</h3>
        <div className="flex items-center gap-3">
          <Button
            value="Edit"
            className="bg-white text-primary"
            onClick={() => onEdit(`${product.id}`)}
          />
        </div>
      </div>
        <XCircleIcon className="size-6 cursor-pointer" onClick={onClose} />
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <ProductDetails product={product} addToCart={()=>{}} />
      </div>
    </div>
  );
}
