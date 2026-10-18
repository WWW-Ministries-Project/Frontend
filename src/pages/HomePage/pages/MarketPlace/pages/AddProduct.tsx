import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useRouteAccess } from "@/context/RouteAccessContext";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import {
  decodeQuery,
  encodeQuery,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { IProduct, ProductColour } from "@/utils/api/marketPlace/interface";
import { ProductForm } from "../components/forms/ProductForm";

interface LocationState {
  from?: string;
  fromLabel?: string;
}

export function AddProduct() {
  const { marketId, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { from, fromLabel } = (location.state as LocationState | null) || {};
  const { canAdminCurrentRoute } = useRouteAccess();

  const routeMarketId = decodeQuery(String(marketId || ""));
  const decodedProductId = decodeQuery(String(productId || ""));
  const isEdit = Boolean(decodedProductId);

  const { data: types } = useFetch(api.fetch.fetchProductTypes);
  const { data: categories } = useFetch(api.fetch.fetchProductCategories);
  const { data: marketsRes } = useFetch(api.fetch.fetchMarkets, undefined, false, {
    silent: true,
  });
  const { data: product, refetch } = useFetch(
    api.fetch.fetchProductById,
    { id: decodedProductId },
    true
  );
  useEffect(() => {
    if (decodedProductId) refetch();
  }, [decodedProductId, refetch]);

  const { handleUpload, loading: uploading } = usePictureUpload();
  const create = usePost(api.post.createProduct);
  const update = usePut(api.put.updateProduct);
  const { executeDelete, success: deleted } = useDelete(api.delete.deleteProduct);
  const [uploadError, setUploadError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Where to go after save / discard: the page we came from, else the
  // market the product now belongs to.
  const savedMarketId = useRef(routeMarketId);
  const goBack = (targetMarket?: string) => {
    if (from) navigate(from);
    else
      navigate(
        `/home/market-place/${encodeQuery(targetMarket || routeMarketId)}`
      );
  };

  const markets = useMemo(
    () => (marketsRes?.data || []).map((m) => ({ label: m.name, value: m.id })),
    [marketsRes?.data]
  );
  const routeMarketName = marketsRes?.data.find(
    (m) => String(m.id) === String(routeMarketId)
  )?.name;
  const backLabel =
    fromLabel === "products"
      ? "Back to products"
      : routeMarketName
        ? `Back to ${routeMarketName}`
        : "Back to market";

  const productTypes = useMemo(
    () => (types?.data || []).map((t) => ({ label: t.name, value: t.id })),
    [types?.data]
  );
  const productCategories = useMemo(
    () => (categories?.data || []).map((t) => ({ label: t.name, value: t.id })),
    [categories?.data]
  );

  const uploadImages = async (
    colours: ProductColour[],
    managed: boolean
  ): Promise<ProductColour[]> =>
    Promise.all(
      colours.map(async (item): Promise<ProductColour> => {
        let imageUrl = item.image_url;
        if (imageUrl instanceof File) {
          const formData = new FormData();
          formData.append("file", imageUrl);
          const uploaded = await handleUpload(formData);
          if (!uploaded) throw new Error("Image upload failed. Try another photo.");
          imageUrl = uploaded;
        }
        return {
          colour: item.colour,
          colour_name: item.colour_name?.trim(),
          image_url: imageUrl || "",
          // Sizes are kept even when stock isn't tracked: the storefront
          // builds its size picker from these rows.
          stock: (item.stock || []).map((s) => ({
            size: s.size,
            stock: managed ? Math.max(0, Number(s.stock) || 0) : 0,
          })),
        };
      })
    );

  const handleSubmit = async (values: IProduct) => {
    setUploadError("");
    setSubmitted(true);
    const { id, ...rest } = values;
    let productColours: ProductColour[];
    try {
      productColours = await uploadImages(
        values.product_colours,
        values.stock_managed === "yes"
      );
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Image upload failed.");
      return;
    }
    const marketForSave = String(rest.market_id || routeMarketId);
    savedMarketId.current = marketForSave;
    const payload: IProduct = {
      ...rest,
      name: rest.name.trim(),
      description: rest.description || "",
      market_id: marketForSave,
      product_type_id: Number(rest.product_type_id),
      product_category_id: Number(rest.product_category_id),
      price_amount: Number(rest.price_amount),
      price_currency: rest.price_currency || "GHC",
      product_colours: productColours,
    };
    if (id) await update.updateData({ ...payload, id });
    else await create.postData(payload);
  };

  useEffect(() => {
    if (create.data?.data || update.data?.data) {
      showNotification(isEdit ? "Product updated" : "Product created", "success");
      goBack(savedMarketId.current);
    }
    // goBack is recreated each render; the response objects are the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [create.data, update.data]);

  useEffect(() => {
    if (deleted) {
      showNotification("Product deleted", "success");
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleted]);

  const handleDelete = () =>
    showDeleteDialog(
      { id: decodedProductId, name: product?.data?.name || "this product" },
      async () => {
        await executeDelete({ product_id: decodedProductId });
      }
    );

  const initialData: IProduct | undefined = useMemo(() => {
    if (!product?.data) return undefined;
    const {
      market,
      product_type: _type,
      product_category: _category,
      ...rest
    } = product.data;
    return {
      ...rest,
      description: rest.description || "",
      status: rest.status === "published" ? "published" : "draft",
      stock_managed: rest.stock_managed === "no" ? "no" : "yes",
      market_id: String(rest.market_id ?? market?.id ?? routeMarketId),
      product_type_id: rest.product_type_id ? String(rest.product_type_id) : "",
      product_category_id: rest.product_category_id
        ? String(rest.product_category_id)
        : "",
      product_colours: (rest.product_colours || []).map((c) => ({
        colour: c.colour || "#000000",
        colour_name: c.colour_name || "",
        image_url: c.image_url || "",
        stock: (c.stock || []).map((s) => ({ size: s.size, stock: s.stock })),
      })),
    };
  }, [product?.data, routeMarketId]);

  const apiError = submitted ? (create.error || update.error)?.message : undefined;

  if (isEdit && !initialData) {
    return (
      <PageOutline>
        <p className="py-12 text-center text-primaryGray">Loading product…</p>
      </PageOutline>
    );
  }

  return (
    <PageOutline>
      <ProductForm
        initialData={initialData}
        defaultMarketId={routeMarketId}
        isEdit={isEdit}
        onSubmit={handleSubmit}
        loading={create.loading || update.loading || uploading}
        productTypes={productTypes}
        categories={productCategories}
        markets={markets}
        backLabel={backLabel}
        onBack={() => goBack()}
        onDelete={isEdit && canAdminCurrentRoute ? handleDelete : undefined}
        serverError={uploadError || apiError}
      />
    </PageOutline>
  );
}
