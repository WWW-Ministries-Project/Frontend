import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { ProductForm } from "../components/forms/ProductForm";
import { decodeQuery } from "@/pages/HomePage/utils";
import { pictureInstance } from "@/axiosInstance";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  ProductColour,
  ProductType,
} from "@/utils/api/marketPlace/interface";

export function AddProduct() {
  const { data } = useFetch(api.fetch.fetchProductTypes);
  const { data: categories } = useFetch(api.fetch.fetchProductCategories);
  const { marketId, productId } = useParams();

  const {
    postData,
    data: newProduct,
    loading: isSubmitting,
  } = usePost(api.post.createProduct);

  const {
    updateData: updateProduct,
    data: updateValue,
    loading: isUpdating,
  } = usePut(api.put.updateProduct);

  const decoded_market_id = decodeQuery(String(marketId));
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const uploadPicture = async (file: FormData) => {
    try {
      setIsUploading(true);
      const response: { data: { result: { link: string } } } =
        await pictureInstance.post("/upload", file);

      return response.data.result.link;
    } catch {
      showNotification("There was an error uploading image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const transformGallery = async (
    gallery: ProductColour[]
  ): Promise<ProductColour[]> => {
    return Promise.all(
      gallery.map(async (item): Promise<ProductColour> => {
        if (typeof item.image_url === "string") {
          return item;
        }

        const formData = new FormData();
        formData.append("file", item.image_url);

        const uploadedUrl = await uploadPicture(formData);

        return {
          colour: item.colour,
          image_url: String(uploadedUrl),
          stock: item.stock?.map((stock) => {
            return {
              size: stock.size,
              stock: +stock.stock,
            };
          }),
        };
      })
    );
  };

  const addProduct = async (product: ProductType) => {
    const { id, ...rest } = product;

    const productGallery = await transformGallery(product.product_colours);
    const dataToSend = {
      ...rest,
      published: product.status === "published",
      stock_managed: product.stock_managed === "yes",
      market_id: +decoded_market_id,
      product_category_id: +product.product_category_id,
      product_type_id: +product.product_type_id,
      price_amount: +product.price_amount,
      product_colours: productGallery,
    };

    if (id) {
      await updateProduct({ ...dataToSend, id });
    } else {
      postData(dataToSend);
    }
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

  useEffect(() => {
    if (newProduct?.data || updateValue?.data) {
      showNotification(
        productId
          ? "Product updated successfully"
          : "Product created successfully",
        "success"
      );
      navigate(`/home/market-place/${marketId}`);
    }
  }, [newProduct?.data, updateValue?.data]);

  return (
    <PageOutline>
      <div className="bg-primary p-5 w-full rounded-tr-md rounded-tl-md h-28 text-white">
        <h2 className="font-bold text-2xl">Add New Product</h2>
        <p className="text-xl">Add mechandise to your marketplace</p>
      </div>
      <ProductForm
        addProduct={addProduct}
        isSubmitting={isSubmitting || isUpdating || isUploading}
        productTypes={productTypes || []}
        categories={productCategories || []}
      />
    </PageOutline>
  );
}
