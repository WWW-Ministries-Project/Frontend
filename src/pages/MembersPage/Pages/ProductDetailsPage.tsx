import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { api, ICartItem } from "@/utils";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import EmptyState from "@/components/EmptyState";

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
    <div className=" mx-auto bg-white flex items-center justify-center">
      {product ? (
        <ProductDetails product={product?.data} addToCart={handleAddToCart} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
