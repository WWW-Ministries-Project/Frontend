import { memo, useState } from "react";
import { ProductChip } from "../chips/ProductChip";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

type ProductDetailsCardProps = {
  product: IProduct;
  handleDelete: (id: string, name: string) => void;
  handleView: (product: IProduct) => void;
  handleEdit: (id: string) => void;
};

export const ProductDetailsCard = memo(
  ({
    product,
    handleDelete,
    handleEdit,
    handleView,
  }: ProductDetailsCardProps) => {
    const { imageUrl, product_name, status, type, category, price, stock, id } =
      product;
    const [showOptions, setShowOptions] = useState(false);
    return (
      <div className="relative w-full rounded-xl border bg-white p-2 shadow-sm">
        <div className="flex gap-4">
          <img
            src={imageUrl}
            alt={`${product_name} product image`}
            className="h-[119px] w-[102px] rounded-lg border object-cover"
          />
          <div className="flex w-full flex-col justify-between space-y-5">
            <div className="space-y-1">
              <div className="flex w-full items-center justify-between">
                <h3 className="text-xs md:text-sm lg:text-lg  font-medium text-gray-700">
                  {product_name}
                </h3>
                <div className="flex items-center gap-1">
                  <p
                    className={`text-xs px-2 py-0.5 h-fit rounded-full  capitalize ${statusColors[status]}`}
                  >
                    <span className="hidden md:block lg:block"> {status}</span>
                  </p>

                  <div
                    className=""
                    onClick={() => setShowOptions((prev) => !prev)}
                  >
                    <ActionButton
                      showOptions={showOptions}
                      onDelete={()=>handleDelete(product.id, product.product_name)}
                      onEdit={() => handleEdit(id)}
                      onView={() => handleView(product)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row gap-2">
                <ProductChip section="type" text={type} />
                <ProductChip section="category" text={category} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row lg:items-center gap-2">
              <p className="font-medium text-gray-800">${price}</p>
              <ProductChip section="" text={`${stock} in stock`} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProductDetailsCard.displayName = "ProductDetailsCard";



const statusColors: Record<string, string> = {
  published: "bg-[#34C759] text-white",
  draft: "bg-gray-400 text-white",
};
