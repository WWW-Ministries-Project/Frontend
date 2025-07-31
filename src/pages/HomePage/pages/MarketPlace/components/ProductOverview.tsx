import { Button } from "@/components";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { statusColors } from "./cards/ProductDetailsCard";
import { ProductChip } from "./chips/ProductChip";

interface IProductProps {
  product: IProduct;
  onDelete: () => void;
  onEdit: () => void;
}

export function ProductOverview({ product, onDelete, onEdit }: IProductProps) {
  // TODO: replace with original properties
  return (
    <div className="w-[800px] xs:w-[350px] sm:w-[400px] md:w-[400px] lg:w-[800px]">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h3 className="font-bold text-2xl">Product Overview</h3>
        <div className="flex items-center gap-3">
          <Button
            value="Edit"
            className="bg-white text-primary"
            onClick={onEdit}
          />
          <Button value="Delete" variant="primary" onClick={onDelete} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-2 p-6 bg-white text-[#474D66] rounded-md shadow-sm">
        {/* Side Images */}
        <div className="flex lg:flex-col gap-3 justify-between">
          {Array.from({ length: 3 }).map((_, idx) => (
            <img
              key={idx}
              src={product?.imageUrl}
              alt={`Product thumbnail ${idx + 1}`}
              className="w-24 h-24 object-cover border rounded-lg"
            />
          ))}
        </div>

        {/* Main Image */}
        <div className="flex-1 min-w-[300px] lg:max-w-[50%]">
          <img
            src={product?.imageUrl}
            alt="Selected Product"
            className="w-fit h-fit object-contain border rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold">{product?.product_name}</p>
            <p
              className={`text-xs px-2 py-0.5 h-fit rounded-full  capitalize ${
                statusColors[product?.status]
              }`}
            >
              <span> {product?.status}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProductChip section="category" text={product?.category} />
            <ProductChip section="type" text={product?.type} />
          </div>

          <div>
            <p className="font-medium">Price</p>
            <p className="text-lg">GHC {product?.price}</p>
          </div>

          {/* Colors */}
          <div>
            <p className="font-medium">Colors</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {["black", "red", "white", "yellow", "green", "blue"].map(
                (color) => (
                  <div
                    key={color}
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-md border"
                    title={color}
                  ></div>
                )
              )}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <p className="font-medium">Sizes</p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm font-medium">
              {["S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                <div key={size} className="border px-2 py-1 rounded-sm text-xs">
                  {size}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="font-medium mb-1">Description</p>
            <p className="text-sm leading-relaxed">
              Empower Developers, IT Ops, and business teams to collaborate at
              high velocity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
