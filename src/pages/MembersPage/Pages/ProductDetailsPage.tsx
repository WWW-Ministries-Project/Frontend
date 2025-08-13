import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { api, ICartItem } from "@/utils";
import { MarketLayout } from "../layouts/MarketLayout";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";

export function ProductDetailsPage() {
  const { id } = useParams();

  const productId = decodeQuery(id || "");
  const { data: product } = useFetch(api.fetch.fetchProductById, {
    id: productId,
  });

  const { addToCart } = useCart();

  const handleAddToCart = (item: ICartItem) => {
    addToCart(item);
  };

  return (
    <MarketLayout title="Product Details">
      <div className=" w-fit mx-auto bg-white rounded-2xl p-4 shadow-md flex items-center justify-center">
        {product && (
          <ProductDetails product={product?.data} addToCart={handleAddToCart} />
        )}
      </div>
    </MarketLayout>
  );
}
