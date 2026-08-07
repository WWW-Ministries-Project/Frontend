import { Field, FieldArray, useFormikContext } from "formik";
import { string } from "yup";

import HubtelLogo from "@/assets/hubtel-logo.jpg";
import PaystackLogo from "@/assets/Paystack-logo.png"; //TODO: replace with momo logo

function PaymentOptionsSubForm() {
  const { values, errors } = useFormikContext<{ payment_method: string }>();

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold text-xl">Payment Methods</p>
      <FieldArray
        name="payment_method"
        render={() => (
          <div className="flex items-center flex-wrap gap-2">
            {PaymentOptions.filter((option) => !option.hidden).map(
              (option) => (
                <div className="relative " key={option.id}>
                  <label
                    htmlFor={`payment_method_${option.id}`}
                    className={`block relative border rounded-lg shadow-md ${
                      option.disabled ? "cursor-not-allowed" : "cursor-pointer"
                    } ${
                      values.payment_method === option.value
                        ? "ring-2 ring-primary rounded-lg"
                        : ""
                    }`}
                  >
                    <img
                      src={option.logo}
                      alt={option.name}
                      className="size-20  p-1 rounded-lg"
                    />
                    <Field
                      type="radio"
                      name="payment_method"
                      id={`payment_method_${option.id}`}
                      value={option.value}
                      disabled={option.disabled}
                      className="absolute top-1 right-1 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
              )
            )}
          </div>
        )}
      />
      {errors.payment_method && (
        <p className="text-error text-sma">{errors.payment_method}</p>
      )}
    </div>
  );
}

const initialValues = {
  payment_method: "hubtel",
};

const validationSchema = {
  payment_method: string().required("Select a payment method"),
};

// Paystack is temporarily hidden - Hubtel is the only supported payment
// method for now, and it's locked (disabled) so it can't be unselected.
const PaymentOptions = [
  {
    id: 1,
    name: "Paystack",
    logo: PaystackLogo,
    value: "paystack",
    hidden: true,
  },
  {
    id: 2,
    name: "Hubtel",
    logo: HubtelLogo,
    value: "hubtel",
    disabled: true,
  },
];

export const PaymentOptionsForm = Object.assign(PaymentOptionsSubForm, {
  initialValues,
  validationSchema,
});
