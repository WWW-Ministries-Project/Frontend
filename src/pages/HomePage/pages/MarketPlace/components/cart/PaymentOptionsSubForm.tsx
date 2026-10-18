import { useFormikContext } from "formik";
import { string } from "yup";

import HubtelLogo from "@/assets/hubtel-logo.jpg";
import PaystackLogo from "@/assets/Paystack-logo.png";
import { cn } from "@/utils/cn";

type PaymentValue = "hubtel" | "paystack";

/**
 * Payment gateway radio cards. Paystack is intentionally hidden — Hubtel is
 * the only gateway enabled for marketplace checkout.
 */
function PaymentOptionsSubForm() {
  const { values, errors, setFieldValue } = useFormikContext<{
    payment_method: PaymentValue;
  }>();
  const options = PaymentOptions.filter((option) => !option.hidden);
  const selected = options.find((o) => o.value === values.payment_method) ?? options[0];

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const on = values.payment_method === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setFieldValue("payment_method", option.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left text-primary",
                on ? "border-primary bg-primary/[0.04]" : "border-lightGray bg-white"
              )}
            >
              <RadioDot on={on} />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold">{option.name}</span>
                <span className="text-sm text-primaryGray">{option.description}</span>
              </span>
              <img src={option.logo} alt="" className="h-[22px] max-w-[72px] object-contain" />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-primaryGray">
        You’ll be redirected to {selected?.name ?? "Hubtel"} to complete payment
        securely, then brought back here.
      </p>
      {errors.payment_method && (
        <p className="text-sm text-red-700">{errors.payment_method}</p>
      )}
    </div>
  );
}

export const RadioDot = ({ on }: { on: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "size-[18px] flex-shrink-0 rounded-full bg-white",
      on ? "border-[5px] border-primary" : "border border-gray-400"
    )}
  />
);

const initialValues = {
  payment_method: "hubtel" as PaymentValue,
};

const validationSchema = {
  payment_method: string().required("Select a payment method"),
};

const PaymentOptions: {
  name: string;
  description: string;
  logo: string;
  value: PaymentValue;
  hidden?: boolean;
}[] = [
  {
    name: "Paystack",
    description: "Card or mobile money",
    logo: PaystackLogo,
    value: "paystack",
    hidden: true,
  },
  {
    name: "Hubtel",
    description: "Mobile money",
    logo: HubtelLogo,
    value: "hubtel",
  },
];

export const PaymentOptionsForm = Object.assign(PaymentOptionsSubForm, {
  initialValues,
  validationSchema,
});
