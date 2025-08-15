import { Field, FieldArray, useFormikContext } from "formik";
import { string } from "yup";

import HubtelLogo from "@/assets/hubtel-logo.jpg";

function PaymentOptionsSubForm() {
  const { values, errors } = useFormikContext<{ payment_method: string }>();

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold">Payment Methods</p>
      <FieldArray
        name="payment_method"
        render={() => (
          <div className="flex items-center flex-wrap gap-2">
            {PaymentOptions.map((option) => (
              <div className="relative " key={option.id}>
                <label
                  htmlFor={`payment_method_${option.id}`}
                  className={`cursor-pointer block relative border rounded-lg shadow-md ${
                    values.payment_method === option.value
                      ? "ring-2 ring-primary rounded-lg"
                      : ""
                  }`}
                >
                  <img
                    src={option.logo}
                    alt="hubtel-image"
                    className="size-20  p-1"
                  />
                  <Field
                    type="radio"
                    name="payment_method"
                    id={`payment_method_${option.id}`}
                    value={option.value}
                    className="absolute top-1 right-1 cursor-pointer"
                  />
                </label>
              </div>
            ))}
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
  payment_method: "",
};

const validationSchema = {
  payment_method: string().required("Select a payment method"),
};

const PaymentOptions = [
  {
    id: 1,
    name: "Hubtel",
    description: "Pay with Hubtel",
    logo: HubtelLogo,
    value: "hubtel",
    disabled: false,
  },
];

export const PaymentOptionsForm = Object.assign(PaymentOptionsSubForm, {
  initialValues,
  validationSchema,
});
