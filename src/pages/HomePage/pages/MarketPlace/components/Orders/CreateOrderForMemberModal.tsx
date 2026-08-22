import { Field, Form, Formik } from "formik";
import { useMemo, useState } from "react";
import { object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelect from "@/components/FormikSelect";
import { Actions } from "@/components/ui/form/Actions";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import type {
  ICreateOrderForMemberPayload,
  IProductTypeResponse,
} from "@/utils/api/marketPlace/interface";

interface IProps {
  marketId: string | number;
  loading: boolean;
  checkoutUrl?: string | null;
  onSubmit: (payload: ICreateOrderForMemberPayload) => void;
  onClose: () => void;
}

interface ILine {
  product: IProductTypeResponse;
  color: string;
  size: string;
  quantity: number;
}

interface IFormValues {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
  payment_mode: "manual" | "gateway";
  manual_status: "success" | "pending";
  payment_type: "paystack" | "hubtel";
}

const initialValues: IFormValues = {
  user_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  country: "",
  country_code: "",
  payment_mode: "manual",
  manual_status: "success",
  payment_type: "paystack",
};

const validationSchema = object().shape({
  user_id: string().required("Required"),
  first_name: string().trim().required("Required"),
  last_name: string().trim().required("Required"),
  email: string().trim().email("Invalid email").required("Required"),
  phone_number: string().trim().required("Required"),
  country: string().trim().required("Required"),
});

export function CreateOrderForMemberModal({
  marketId,
  loading,
  checkoutUrl,
  onSubmit,
  onClose,
}: IProps) {
  const membersOptions = useStore((state) => state.membersOptions);
  const { data: productsResponse } = useFetch(api.fetch.fetchProductsByMarket, {
    market_id: marketId,
  });
  const products = useMemo(() => productsResponse?.data || [], [productsResponse]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<ILine[]>([]);

  const formLocked = Boolean(checkoutUrl);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId),
    [products, selectedProductId]
  );
  // Stock (and therefore size) only exists for stock-managed products —
  // AddProduct always sends an empty stock array per colour when
  // stock_managed is "no", matching how resolveItemStock/ProductDetails
  // treat unmanaged products: no size required, no stock cap.
  const isStockManaged = selectedProduct?.stock_managed === "yes";
  const colorOptions = useMemo(
    () => (selectedProduct?.product_colours || []).map((c) => ({ label: c.colour, value: c.colour })),
    [selectedProduct]
  );
  const selectedColourRow = useMemo(
    () => selectedProduct?.product_colours.find((c) => c.colour === selectedColor),
    [selectedProduct, selectedColor]
  );
  const sizeOptions = useMemo(
    () =>
      (selectedColourRow?.stock || []).map((s) => ({
        label: `${s.size} (${s.stock} in stock)`,
        value: s.size,
      })),
    [selectedColourRow]
  );
  const selectedSizeStock = selectedColourRow?.stock?.find((s) => s.size === selectedSize)?.stock;

  const canAddLine =
    Boolean(selectedProduct) &&
    Boolean(selectedColor) &&
    (isStockManaged ? Boolean(selectedSize) : true) &&
    quantity > 0 &&
    (isStockManaged ? quantity <= Number(selectedSizeStock ?? 0) : true);

  const handleAddLine = () => {
    if (!canAddLine || !selectedProduct) return;

    setLines((prev) => {
      // Merge into an existing line for the same product+variant instead of
      // appending a duplicate — two separate lines for the same variant
      // pass the Backend's per-line shortage pre-check independently
      // against the same stock snapshot, then the second one's actual
      // reservation fails inside the transaction, rolling back the whole
      // order with a confusing error.
      const existingIndex = prev.findIndex(
        (line) =>
          line.product.id === selectedProduct.id &&
          line.color === selectedColor &&
          line.size === selectedSize
      );
      if (existingIndex >= 0) {
        const merged = [...prev];
        merged[existingIndex] = {
          ...merged[existingIndex],
          quantity: merged[existingIndex].quantity + quantity,
        };
        return merged;
      }
      return [
        ...prev,
        { product: selectedProduct, color: selectedColor, size: selectedSize, quantity },
      ];
    });
    setSelectedProductId("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
  };

  const handleFormSubmit = (values: IFormValues) => {
    if (lines.length === 0 || formLocked) return;

    onSubmit({
      user_id: Number(values.user_id),
      billing: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_number: values.phone_number,
        country: values.country,
        country_code: values.country_code,
      },
      items: lines.map((line) => ({
        market_id: marketId,
        id: line.product.id as number | string,
        name: line.product.name,
        price_amount: Number(line.product.price_amount),
        price_currency: line.product.price_currency,
        quantity: line.quantity,
        product_type: line.product.product_type?.name || "",
        product_category: line.product.product_category?.name || "",
        image_url:
          (line.product.product_colours.find((c) => c.colour === line.color)
            ?.image_url as string) || "",
        color: line.color,
        size: line.size,
      })),
      payment_mode: values.payment_mode,
      ...(values.payment_mode === "manual"
        ? { manual_status: values.manual_status }
        : {
            payment_type: values.payment_type,
            return_url: `${window.location.origin}/homepage/marketplace`,
            cancellation_url: `${window.location.origin}/homepage/marketplace`,
          }),
    });
  };

  return (
    <div className="bg-white rounded-lg md:w-[42rem] text-primary overflow-auto">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
      >
        {({ values, handleSubmit: submitForm }) => (
          <Form>
            <div className="bg-primary w-full p-6 text-white">
              <p className="text-2xl font-bold">Place order for member</p>
            </div>

            <div className="space-y-4 px-6 py-4">
              <Field
                component={FormikSelect}
                id="user_id"
                name="user_id"
                options={membersOptions}
                label="Select a member *"
                placeholder="Select a member"
                searchable
                searchPlaceholder="Search members..."
                disabled={formLocked}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field component={FormikInputDiv} id="first_name" name="first_name" label="First name *" disabled={formLocked} />
                <Field component={FormikInputDiv} id="last_name" name="last_name" label="Last name *" disabled={formLocked} />
                <Field component={FormikInputDiv} id="email" name="email" type="email" label="Email *" disabled={formLocked} />
                <Field component={FormikInputDiv} id="phone_number" name="phone_number" label="Phone *" disabled={formLocked} />
                <Field component={FormikInputDiv} id="country" name="country" label="Country *" disabled={formLocked} />
                <Field component={FormikInputDiv} id="country_code" name="country_code" label="Country code" disabled={formLocked} />
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 font-semibold">Add product</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedProductId}
                    disabled={formLocked}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedColor("");
                      setSelectedSize("");
                    }}
                  >
                    <option value="">Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      setSelectedSize("");
                    }}
                    disabled={formLocked || !selectedProduct}
                  >
                    <option value="">Color</option>
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={formLocked || !selectedColor || !isStockManaged}
                  >
                    <option value="">{isStockManaged ? "Size" : "No size"}</option>
                    {sizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={isStockManaged ? Number(selectedSizeStock ?? undefined) : undefined}
                    className="border rounded px-2 py-1 text-sm"
                    value={quantity}
                    disabled={formLocked}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  value="Add line"
                  variant="secondary"
                  className="mt-2"
                  onClick={handleAddLine}
                  disabled={formLocked || !canAddLine}
                />

                {lines.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {lines.map((line, index) => (
                      <div
                        key={`${line.product.id}-${line.color}-${line.size}-${index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {line.product.name} — {line.color}
                          {line.size ? `/${line.size}` : ""} × {line.quantity}
                        </span>
                        {!formLocked && (
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => handleRemoveLine(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 font-semibold">Payment</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Field type="radio" id="payment_mode_manual" name="payment_mode" value="manual" disabled={formLocked} />
                    Mark as paid / COD
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Field type="radio" id="payment_mode_gateway" name="payment_mode" value="gateway" disabled={formLocked} />
                    Send payment link
                  </label>
                </div>

                {values.payment_mode === "manual" ? (
                  <Field
                    component={FormikSelect}
                    id="manual_status"
                    name="manual_status"
                    label="Status"
                    clearable={false}
                    disabled={formLocked}
                    options={[
                      { label: "Paid now", value: "success" },
                      { label: "Pending (cash on delivery)", value: "pending" },
                    ]}
                  />
                ) : (
                  <Field
                    component={FormikSelect}
                    id="payment_type"
                    name="payment_type"
                    label="Gateway"
                    clearable={false}
                    disabled={formLocked}
                    options={[
                      { label: "Paystack", value: "paystack" },
                      { label: "Hubtel", value: "hubtel" },
                    ]}
                  />
                )}
              </div>

              {checkoutUrl && (
                <div className="rounded border border-green-300 bg-green-50 p-3 text-sm">
                  <p className="mb-1 font-semibold">Checkout link ready — share it with the member:</p>
                  <input
                    readOnly
                    className="w-full border rounded px-2 py-1"
                    value={checkoutUrl}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              )}

              {lines.length === 0 && !formLocked && (
                <p className="text-sm text-gray-500">Add at least one product before saving.</p>
              )}

              {formLocked ? (
                <div className="flex justify-end pt-2">
                  <Button type="button" value="Close" variant="secondary" onClick={onClose} />
                </div>
              ) : (
                <Actions onCancel={onClose} loading={loading} onSubmit={submitForm} />
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
