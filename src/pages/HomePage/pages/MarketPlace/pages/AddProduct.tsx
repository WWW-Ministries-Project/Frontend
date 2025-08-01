import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ProductForm } from "../components/forms/ProductForm";
import { useParams } from "react-router-dom";
import { IProduct } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useMemo } from "react";

export function AddProduct() {
  const { marketId, productId } = useParams();
  const { data } = useFetch(api.fetch.fetchProductTypes);
  const { data: categories } = useFetch(api.fetch.fetchProductCategories);

  const addProduct = (product: IProduct) => {
    console.log(product);
  };

  const productTypes = useMemo(() => {
    return data?.data.map((type) => {
      return {
        label: type.name,
        value: type.id,
      };
    });
  }, [data?.data]);

  const productCategories = useMemo(() => {
    return categories?.data.map((type) => {
      return {
        label: type.name,
        value: type.id,
      };
    });
  }, [categories?.data]);

  return (
    <PageOutline>
      <div className="bg-primary p-5 w-full rounded-tr-md rounded-tl-md h-28 text-white">
        <h2>Add New Product</h2>
      </div>

      <ProductForm
        addProduct={addProduct}
        isSubmitting={false}
        productTypes={productTypes || []}
        categories={productCategories || []}
      />
    </PageOutline>
  );
}
