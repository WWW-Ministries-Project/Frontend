import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductForm } from "../components/forms/ProductForm";
import { useParams } from "react-router-dom";

export function AddProduct() {
  const {marketId, productId} = useParams()

  
  return (
    <PageOutline>
      <div className="bg-primary p-5 w-full rounded-tr-md rounded-tl-md h-28 text-white">
        <h2>Add Product</h2>
      </div>

      <ProductForm />
    </PageOutline>
  );
}
