import { Form, Formik, getIn, useField, useFormikContext } from "formik";
import { useEffect } from "react";
import { object, string } from "yup";

import { ContactInput } from "@/components/ContactInput";
import {
  ContactsSubForm,
  type IContactsSubForm,
  type INameInfo,
} from "@/components/subform";
import type { FulfilmentMethod, ICartItem } from "@/utils";
import { cn } from "@/utils/cn";
import { ProductThumb } from "@/pages/MembersPage/components/orders/ProductThumb";
import { useCart } from "../../utils/cartSlice";
import { formatMoney } from "../../utils/marketplaceModel";
import { PaymentOptionsForm, RadioDot } from "./PaymentOptionsSubForm";

export interface ICheckoutForm {
  contact_info: IContactsSubForm;
  personal_info: INameInfo;
  payment_method: "hubtel" | "paystack";
  fulfilment_method?: FulfilmentMethod;
  delivery_address?: string;
  delivery_city?: string;
}

export interface ICheckoutDefaults {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface IProps {
  items: ICartItem[];
  subtotal: number;
  defaults: ICheckoutDefaults;
  delivery: {
    enabled: boolean;
    fee: number;
    pickupLocation: string;
  };
  loading: boolean;
  /** Server-side failure to show next to the pay button. */
  serverError?: string;
  handleCheckout: (data: ICheckoutForm) => void;
}

/**
 * Checkout: contact details, fulfilment method and payment on the left,
 * a sticky order summary with the pay button on the right.
 */
export function CheckoutForm({
  items,
  subtotal,
  defaults,
  delivery,
  loading,
  serverError,
  handleCheckout,
}: IProps) {
  const { billinDetails } = useCart();

  const initialValues: ICheckoutForm = {
    personal_info: {
      first_name: billinDetails?.personal_info?.first_name || defaults.first_name,
      other_name: billinDetails?.personal_info?.other_name || "",
      last_name: billinDetails?.personal_info?.last_name || defaults.last_name,
    },
    contact_info: {
      ...ContactsSubForm.initialValues,
      ...(billinDetails?.contact_info || {}),
      email: billinDetails?.contact_info?.email || defaults.email,
      phone: {
        ...ContactInput.initialValues,
        ...(billinDetails?.contact_info?.phone || {}),
        number: billinDetails?.contact_info?.phone?.number || defaults.phone,
      },
    },
    fulfilment_method: "pickup",
    delivery_address: billinDetails?.delivery_address || "",
    delivery_city: billinDetails?.delivery_city || "",
    // Hubtel is the only enabled gateway; ignore any stale persisted choice.
    payment_method: "hubtel",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => handleCheckout(values)}
    >
      {() => (
        <Form noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-4">
            <Section title="1. Contact details">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="personal_info.first_name" label="First name" autoComplete="given-name" />
                <TextField name="personal_info.last_name" label="Last name" autoComplete="family-name" />
                <TextField name="contact_info.email" label="Email" type="email" autoComplete="email" />
                <div className="[&>div]:mb-0">
                  <ContactInput
                    prefix="contact_info"
                    label="Phone"
                    zipClass="h-11 rounded-l-lg border border-r-0 bg-gray-50 px-2 text-sm"
                    className="h-11 rounded-r-lg border px-3 text-sm"
                  />
                </div>
              </div>
            </Section>

            <Section title="2. How would you like to receive it?">
              <FulfilmentOptions delivery={delivery} />
            </Section>

            <Section title="3. Payment">
              <PaymentOptionsForm />
            </Section>
          </div>

          <OrderSummary
            items={items}
            subtotal={subtotal}
            deliveryFee={delivery.fee}
            loading={loading}
            serverError={serverError}
          />
        </Form>
      )}
    </Formik>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6">
    <h2 className="text-lg font-semibold text-primary">{title}</h2>
    {children}
  </section>
);

const TextField = ({
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) => {
  const [field, meta] = useField<string>(name);
  const { submitCount } = useFormikContext();
  const showError = Boolean(meta.error) && (meta.touched || submitCount > 0);
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-primary">
      {label}
      <input
        {...field}
        value={field.value ?? ""}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        className={cn(
          "h-11 rounded-lg border bg-white px-3 text-sm font-normal text-primary outline-none focus:border-primary",
          showError ? "border-red-500" : "border-lightGray"
        )}
      />
      {showError && (
        <span id={errorId} className="text-xs font-normal text-red-700">
          {meta.error}
        </span>
      )}
    </label>
  );
};

const FulfilmentOptions = ({ delivery }: { delivery: IProps["delivery"] }) => {
  const { values, setFieldValue } = useFormikContext<ICheckoutForm>();
  const method = values.fulfilment_method ?? "pickup";

  // If delivery gets switched off (or the config fails), fall back to pickup.
  useEffect(() => {
    if (!delivery.enabled && method === "delivery") {
      setFieldValue("fulfilment_method", "pickup");
    }
  }, [delivery.enabled, method, setFieldValue]);

  const options: {
    value: FulfilmentMethod;
    title: string;
    sub: string;
    disabled?: boolean;
  }[] = [
    { value: "pickup", title: "Pickup at church · Free", sub: delivery.pickupLocation },
  ];
  if (delivery.enabled) {
    options.push({
      value: "delivery",
      title: `Home delivery · ${delivery.fee > 0 ? formatMoney(delivery.fee) : "Free"}`,
      sub: "Delivered to your address",
    });
  }

  return (
    <>
      <div role="radiogroup" aria-label="Fulfilment method" className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const on = method === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setFieldValue("fulfilment_method", option.value)}
              className={cn(
                "flex gap-3 rounded-lg border p-4 text-left text-primary",
                on ? "border-primary bg-primary/[0.04]" : "border-lightGray bg-white"
              )}
            >
              <span className="mt-0.5">
                <RadioDot on={on} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{option.title}</span>
                <span className="text-sm text-primaryGray">{option.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      {method === "delivery" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="delivery_address"
            label="Street address"
            placeholder="House number and street"
            autoComplete="street-address"
          />
          <TextField name="delivery_city" label="City" autoComplete="address-level2" />
        </div>
      )}
    </>
  );
};

const OrderSummary = ({
  items,
  subtotal,
  deliveryFee,
  loading,
  serverError,
}: {
  items: ICartItem[];
  subtotal: number;
  deliveryFee: number;
  loading: boolean;
  serverError?: string;
}) => {
  const { values, errors, submitCount } = useFormikContext<ICheckoutForm>();
  const fee = values.fulfilment_method === "delivery" ? deliveryFee : 0;
  const total = subtotal + fee;
  const units = items.reduce((a, i) => a + Number(i.quantity || 0), 0);
  const validationError = submitCount > 0 ? firstError(errors) : "";
  const message = validationError || serverError;

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-primary">Order summary</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => {
          const variant = [
            item.color && !item.color.startsWith("#") ? item.color : "",
            item.size && item.size !== "One size" ? `Size ${item.size}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={`${item.item_uuid || item.product_id}-${index}`}
              className="flex items-center gap-3"
            >
              <ProductThumb
                imageUrl={item.image_url}
                colour={item.color}
                alt=""
                badge={Number(item.quantity) || undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">{item.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-primaryGray">
                  {item.color?.startsWith("#") && (
                    <span
                      aria-hidden="true"
                      className="inline-block size-3 rounded-full border border-lightGray"
                      style={{ background: item.color }}
                    />
                  )}
                  {variant || `Qty ${item.quantity}`}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-primary">
                {formatMoney(Number(item.price_amount || 0) * Number(item.quantity || 0))}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 text-sm text-primary">
        <div className="flex justify-between">
          <span className="text-primaryGray">
            Subtotal · {units} {units === 1 ? "item" : "items"}
          </span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-primaryGray">Delivery</span>
          <span>{fee > 0 ? formatMoney(fee) : "Free"}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>
      {message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="min-h-12 rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Processing…" : `Pay ${formatMoney(total)}`}
      </button>
      <p className="text-xs text-primaryGray">
        By paying you confirm the items, colours, sizes and quantities above are
        correct. Orders are processed exactly as placed.
      </p>
    </aside>
  );
};

/** First validation message, in the order the fields appear on screen. */
const firstError = (errors: object): string => {
  const paths = [
    "personal_info.first_name",
    "personal_info.last_name",
    "contact_info.email",
    "contact_info.phone.number",
    "contact_info.phone.country_code",
    "delivery_address",
    "delivery_city",
    "payment_method",
  ];
  for (const path of paths) {
    const message = getIn(errors, path);
    if (typeof message === "string" && message) return message;
  }
  return "";
};

const validationSchema = object({
  personal_info: object({
    first_name: string().trim().required("Enter your first name"),
    last_name: string().trim().required("Enter your last name"),
  }),
  contact_info: object({
    email: string()
      .trim()
      .email("Enter a valid email address")
      .required("Enter your email address"),
    phone: object({
      number: string().trim().required("Enter your phone number"),
      country_code: string().required("Select a country code"),
    }),
  }),
  fulfilment_method: string().oneOf(["pickup", "delivery"]),
  delivery_address: string().when("fulfilment_method", {
    is: "delivery",
    then: (s) => s.trim().required("Enter your street address for delivery"),
    otherwise: (s) => s.notRequired(),
  }),
  delivery_city: string().when("fulfilment_method", {
    is: "delivery",
    then: (s) => s.trim().required("Enter your city for delivery"),
    otherwise: (s) => s.notRequired(),
  }),
  ...PaymentOptionsForm.validationSchema,
});
