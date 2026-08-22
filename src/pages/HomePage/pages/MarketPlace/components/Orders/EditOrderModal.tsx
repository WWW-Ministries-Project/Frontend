import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { array, number, object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelect from "@/components/FormikSelect";
import { Actions } from "@/components/ui/form/Actions";
import type { IOrderDetail, IUpdateOrderPayload } from "@/utils/api/marketPlace/interface";

interface IProps {
  order: IOrderDetail | null;
  loading: boolean;
  onSubmit: (payload: IUpdateOrderPayload) => void;
  onClose: () => void;
}

const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
];

const DELIVERY_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

interface IFormItem {
  id: number;
  name: string;
  color: string;
  size: string;
  quantity: number;
  price_amount: number;
  removed: boolean;
}

interface IFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
  payment_status: string;
  delivery_status: string;
  items: IFormItem[];
}

const validationSchema = object().shape({
  first_name: string().trim().required("Required"),
  last_name: string().trim().required("Required"),
  email: string().trim().email("Invalid email").required("Required"),
  phone_number: string().trim().required("Required"),
  country: string().trim().required("Required"),
  payment_status: string()
    .oneOf(["pending", "success", "failed"], "Required")
    .required("Required"),
  delivery_status: string()
    .oneOf(["pending", "shipped", "delivered", "cancelled"], "Required")
    .required("Required"),
  items: array().of(
    object().shape({
      quantity: number().when("removed", {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) =>
          schema
            .integer("Must be a whole number")
            .min(1, "Must be at least 1")
            .required("Required"),
      }),
      price_amount: number().when("removed", {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) =>
          schema.min(0, "Must be zero or greater").required("Required"),
      }),
    })
  ),
});

export function EditOrderModal({ order, loading, onSubmit, onClose }: IProps) {
  // Matches the Backend's own item-edit guard exactly (updateOrder in
  // orderService.ts): once delivery is delivered/cancelled, or payment has
  // failed, stock is no longer reserved the way item edits assume, so the
  // server rejects it outright — disable the fields client-side too rather
  // than let the admin fill out a form that will always 400.
  const itemsLocked =
    order?.delivery_status === "delivered" ||
    order?.delivery_status === "cancelled" ||
    order?.payment_status === "failed";

  const initialValues: IFormValues = useMemo(
    () => ({
      first_name: order?.billing_details?.first_name || "",
      last_name: order?.billing_details?.last_name || "",
      email: order?.billing_details?.email || "",
      phone_number: order?.billing_details?.phone_number || "",
      country: order?.billing_details?.country || "",
      country_code: order?.billing_details?.country_code || "",
      payment_status: order?.payment_status || "pending",
      delivery_status: order?.delivery_status || "pending",
      items: (order?.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price_amount: item.price_amount,
        removed: false,
      })),
    }),
    [order]
  );

  if (!order) return null;

  const handleSubmit = (values: IFormValues) => {
    const initialItemsById = new Map(
      initialValues.items.map((item) => [item.id, item])
    );

    // Only send lines that actually changed. Sending the full array on
    // every save — even a pure billing edit — would make the Backend
    // recompute total_amount from every line every time, silently
    // rewriting the order's total when nothing about its items changed.
    const dirtyItems = itemsLocked
      ? []
      : values.items.filter((item) => {
          if (item.removed) return true;
          const original = initialItemsById.get(item.id);
          if (!original) return false;
          return (
            Number(item.quantity) !== original.quantity ||
            Number(item.price_amount) !== original.price_amount ||
            item.color !== original.color ||
            item.size !== original.size
          );
        });

    onSubmit({
      id: order.id,
      billing: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_number: values.phone_number,
        country: values.country,
        country_code: values.country_code,
      },
      payment_status: values.payment_status as "pending" | "success" | "failed",
      delivery_status: values.delivery_status as
        | "pending"
        | "shipped"
        | "delivered"
        | "cancelled",
      items:
        dirtyItems.length === 0
          ? undefined
          : dirtyItems.map((item) => ({
              id: item.id,
              // FormikInputDiv's number inputs hand back a string —
              // coerce explicitly so the payload always matches
              // IUpdateOrderPayload's declared number types.
              quantity: Number(item.quantity),
              color: item.color,
              size: item.size,
              price_amount: Number(item.price_amount),
              removed: item.removed,
            })),
    });
  };

  return (
    <div className="bg-white rounded-lg md:w-[42rem] text-primary overflow-auto">
      <Formik
        key={order.id}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, handleSubmit: submitForm, setFieldValue }) => {
          const visibleCount = values.items.filter((item) => !item.removed).length;

          return (
            <Form>
              <div className="bg-primary w-full p-6 text-white">
                <p className="text-2xl font-bold">Edit Order {order.order_number}</p>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field component={FormikInputDiv} id="first_name" name="first_name" label="First name *" />
                  <Field component={FormikInputDiv} id="last_name" name="last_name" label="Last name *" />
                  <Field component={FormikInputDiv} id="email" name="email" type="email" label="Email *" />
                  <Field component={FormikInputDiv} id="phone_number" name="phone_number" label="Phone *" />
                  <Field component={FormikInputDiv} id="country" name="country" label="Country *" />
                  <Field component={FormikInputDiv} id="country_code" name="country_code" label="Country code" />
                  <Field
                    component={FormikSelect}
                    id="payment_status"
                    name="payment_status"
                    label="Payment status"
                    options={PAYMENT_STATUS_OPTIONS}
                    clearable={false}
                  />
                  <Field
                    component={FormikSelect}
                    id="delivery_status"
                    name="delivery_status"
                    label="Delivery status"
                    options={DELIVERY_STATUS_OPTIONS}
                    clearable={false}
                  />
                </div>

                <div>
                  <p className="mb-2 font-semibold">Items</p>
                  {itemsLocked && (
                    <p className="mb-2 text-sm text-gray-500">
                      Items can&apos;t be edited once delivery is delivered/cancelled or payment has failed.
                    </p>
                  )}
                  <div className="space-y-3">
                    {values.items.map((item, index) =>
                      item.removed ? null : (
                        <div
                          key={item.id}
                          className="grid grid-cols-2 sm:grid-cols-6 items-end gap-2 rounded border p-3"
                        >
                          <p className="col-span-2 text-sm font-medium">{item.name}</p>
                          <Field
                            component={FormikInputDiv}
                            id={`items.${index}.color`}
                            name={`items.${index}.color`}
                            label="Color"
                            disabled={itemsLocked}
                          />
                          <Field
                            component={FormikInputDiv}
                            id={`items.${index}.size`}
                            name={`items.${index}.size`}
                            label="Size"
                            disabled={itemsLocked}
                          />
                          <Field
                            component={FormikInputDiv}
                            id={`items.${index}.quantity`}
                            type="number"
                            name={`items.${index}.quantity`}
                            label="Qty"
                            disabled={itemsLocked}
                          />
                          <Field
                            component={FormikInputDiv}
                            id={`items.${index}.price_amount`}
                            type="number"
                            name={`items.${index}.price_amount`}
                            label="Price"
                            disabled={itemsLocked}
                          />
                          {!itemsLocked && (
                            <Button
                              type="button"
                              value="Remove line"
                              variant="secondary"
                              className="col-span-2 sm:col-span-6 justify-self-start"
                              disabled={visibleCount <= 1}
                              onClick={() =>
                                setFieldValue(`items.${index}.removed`, true)
                              }
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <Actions onCancel={onClose} loading={loading} onSubmit={submitForm} />
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
