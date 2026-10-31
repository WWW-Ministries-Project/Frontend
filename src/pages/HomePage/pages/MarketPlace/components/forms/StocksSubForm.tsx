import { getIn, useFormikContext } from "formik";

import type { IProduct } from "@/utils/api/marketPlace/interface";

export interface IStocksSubForm {
  size: string;
  stock: number | string;
}

/** Stock grid for one colour: one number input per enabled size. */
const StocksSubFormComponent = ({ index }: { index: number }) => {
  const { values, setFieldValue } = useFormikContext<IProduct>();
  const stocks: IStocksSubForm[] =
    getIn(values, `product_colours[${index}].stock`) || [];

  if (!stocks.length) {
    return (
      <p className="text-sm text-gray-500">
        Pick at least one size above to set stock for this colour.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
      {stocks.map((item, i) => (
        <label
          key={item.size}
          className="flex flex-col gap-1 text-xs text-primaryGray"
        >
          {item.size}
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={item.stock}
            onChange={(e) =>
              setFieldValue(
                `product_colours[${index}].stock[${i}].stock`,
                e.target.value
              )
            }
            className="h-9 rounded-md border border-lightGray px-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </label>
      ))}
    </div>
  );
};

export const StocksSubForm = Object.assign(StocksSubFormComponent, {
  initialValues: [] as IStocksSubForm[],
});
