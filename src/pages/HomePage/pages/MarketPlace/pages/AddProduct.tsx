import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductForm } from "../components/forms/ProductForm";
import { useParams } from "react-router-dom";
import { IProduct } from "@/utils";

export function AddProduct() {
  const { marketId, productId } = useParams();

  const addProduct = (product: IProduct) => {
    console.log(product);
  };
  return (
    <PageOutline>
      <div className="bg-primary p-5 w-full rounded-tr-md rounded-tl-md h-28 text-white">
        <h2>Add New Product</h2>
      </div>

      <ProductForm addProduct={addProduct} isSubmitting={false} />
    </PageOutline>
  );
}
