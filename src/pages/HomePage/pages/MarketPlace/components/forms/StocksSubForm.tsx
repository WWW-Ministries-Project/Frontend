import { MinusCircleIcon } from "@heroicons/react/24/outline";
import { Field, FieldArray, getIn, useFormikContext } from "formik";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import { array, object, string, number } from "yup";

const StocksSubFormComponent = ({ index }: { index: number }) => {
  const { values: entire } = useFormikContext<object>();
  const stocks: IStocksSubForm[] =
    getIn(entire, `product_colours[${index}].stock`) || initialValues;

  return (
    <FieldArray name={`product_colours[${index}].stock`}>
      {({ push, remove }) => (
        <>
          {stocks.map((item, i) => (
            <div key={i} className="flex items-center gap-2 justify-between">
              <div className="flex items-end">
                <FormLayout>
                  <Field
                    name={`product_colours[${index}].stock[${i}].size`}
                    component={FormikSelectField}
                    options={sizes.filter(
                      (sizeOption) =>
                        !stocks.some((s) => s.size === sizeOption.value) ||
                        item.size === sizeOption.value
                    )}
                    placeholder="Select size"
                    id={`product_colours[${index}].stock[${i}].size`}
                  />
                  <Field
                    name={`product_colours[${index}].stock[${i}].stock`}
                    component={FormikInputDiv}
                    placeholder="Number of stocks"
                    type="number"
                    id={`product_colours[${index}].stock[${i}].stock`}
                  />
                </FormLayout>
                {stocks.length > 1 && (
                  <MinusCircleIcon
                    className="size-7 text-lightGray"
                    onClick={() => remove(i)}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            {stocks.length < sizes.length && (
              <Button
                variant="ghost"
                value="+ Add size"
                onClick={() => {
                  const nextSize = sizes.find(
                    (s) => !stocks.some((item) => item.size === s.value)
                  )?.value;

                  push({ size: nextSize, stock: 0 });
                }}
                className="hover:no-underline"
              />
            )}
          </div>
        </>
      )}
    </FieldArray>
  );
};

const sizes = ["S", "M", "L", "XL", "2XL", "3XL","4XL"].map((size) => ({
  label: size,
  value: size,
}));
export interface IStocksSubForm {
  size: string;
  stock: number;
}

const initialValues: IStocksSubForm[] = [
  {
    size: "",
    stock: 0,
  },
];

const validationSchema = array().of(
  object().shape({
    size: string().required("Required"),
    stock: number().min(0, "Stock can't be negative"),
  })
);

export const StocksSubForm = Object.assign(StocksSubFormComponent, {
  initialValues,
  validationSchema,
});
