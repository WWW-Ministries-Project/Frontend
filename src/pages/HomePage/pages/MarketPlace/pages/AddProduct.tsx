import { useMemo } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api, IProduct } from "@/utils";
import { ProductForm } from "../components/forms/ProductForm";

export function AddProduct() {
  const { data } = useFetch(api.fetch.fetchProductTypes);
  const { data: categories } = useFetch(api.fetch.fetchProductCategories);

  const addProduct = (product: IProduct) => {
    // TODO: replace with api call
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
