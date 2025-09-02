import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { decodeQuery, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  ProductColour,
  IProduct,
} from "@/utils/api/marketPlace/interface";
import { ProductForm } from "../components/forms/ProductForm";

export function AddProduct() {
  const { data } = useFetch(api.fetch.fetchProductTypes);
  const { data: categories } = useFetch(api.fetch.fetchProductCategories);
  const { marketId, productId } = useParams();
  const { handleUpload, loading } = usePictureUpload();

  const {
    postData,
    data: newProduct,
    loading: isCreating,
  } = usePost(api.post.createProduct);

  const {
    updateData: updateProduct,
    data: updateValue,
    loading: isUpdating,
  } = usePut(api.put.updateProduct);

  const decodedProductId = decodeQuery(String(productId || ""));
  const { data: product, refetch } = useFetch(
    api.fetch.fetchProductById,
    {
      id: decodedProductId,
    },
    true
  );

  const decoded_market_id = decodeQuery(String(marketId));
  const navigate = useNavigate();

  const transformGallery = async (
    gallery: ProductColour[],
    manage_stock: boolean
  ): Promise<ProductColour[]> => {
    return Promise.all(
      gallery.map(async (item): Promise<ProductColour> => {
        if (typeof item.image_url === "string") {
          return item;
        }

        const formData = new FormData();
        formData.append("file", item.image_url);

        const uploadedUrl = await handleUpload(formData);

        return {
          colour: item.colour,
          image_url: String(uploadedUrl),
          stock:
            item.stock?.map((stock) => {
              return {
                size: stock.size,
                stock: +stock.stock,
              };
            }) ?? [],
        };
      })
    );
  };

  const handleSubmit = async (product: IProduct) => {
    const { id, ...rest } = product;

    const productGallery = await transformGallery(
      product.product_colours,
      product.stock_managed === "yes"
    );
    const dataToSend = {
      ...rest,
      market_id: decoded_market_id,
      product_colours: productGallery,
    };
    if (id) {
      await updateProduct({ ...dataToSend, id });
    } else {
      await postData(dataToSend);
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

  useEffect(() => {
    if (decodedProductId) {
      refetch();
    }
  }, [decodedProductId, refetch]);

  const initailData: IProduct | undefined = useMemo(() => {
    if (product?.data) {
      const { market, product_type, product_category, ...rest } = product.data;
      return {
        ...rest,
      };
    }
  }, [product?.data]);

  return (
    <PageOutline>
      <div className="bg-primary p-5 w-full rounded-tr-md rounded-tl-md h-28 text-white">
        <h2 className="font-bold text-2xl">
          {productId ? "Update" : "Add New"} Product
        </h2>
        <p className="text-xl">Add mechandise to your marketplace</p>
      </div>
      <ProductForm
        initialData={initailData}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating || loading}
        productTypes={productTypes || []}
        categories={productCategories || []}
      />
    </PageOutline>
  );
}
