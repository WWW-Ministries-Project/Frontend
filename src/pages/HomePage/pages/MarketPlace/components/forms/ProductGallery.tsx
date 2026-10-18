import { FieldArray, useFormikContext } from "formik";
import { useEffect, useMemo, useState } from "react";

import type { IProduct, ProductColour } from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";
import { sortSizes } from "../../utils/marketplaceModel";
import { inputCls, tint } from "../markets/styles";
import {
  ONE_SIZE,
  SIZE_CHOICES,
  colourUnits,
  useImagePreview,
  usedSizes,
} from "./productFormUtils";
import { IStocksSubForm, StocksSubForm } from "./StocksSubForm";

const ColourImage = ({
  index,
  colour,
}: {
  index: number;
  colour: ProductColour;
}) => {
  const { setFieldValue } = useFormikContext<IProduct>();
  const preview = useImagePreview(colour.image_url);
  const id = `product-colour-image-${index}`;
  return (
    <label
      htmlFor={id}
      title={preview ? "Change photo" : "Upload a photo"}
      className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-lightGray hover:border-primary/50"
      style={preview ? undefined : { background: tint(colour.colour) }}
    >
      {preview ? (
        <img src={preview} alt="" className="size-full object-cover" />
      ) : (
        <span
          className="aspect-square w-[44%] rounded-[22%]"
          style={{ background: colour.colour }}
        />
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setFieldValue(`product_colours[${index}].image_url`, file);
          e.target.value = "";
        }}
      />
    </label>
  );
};

/** "Variants & stock": size chips, stock tracking toggle and colour rows. */
const ProductGallery = () => {
  const { values, setFieldValue } = useFormikContext<IProduct>();
  const colours = values.product_colours;
  const managed = values.stock_managed === "yes";
  const used = useMemo(() => usedSizes(colours), [colours]);
  const chips = useMemo(
    () => [...SIZE_CHOICES, ...used.filter((s) => !SIZE_CHOICES.includes(s))],
    [used]
  );

  // Stable React keys per colour row, independent of position, so removing a
  // row never hands its DOM (e.g. a native colour input) to another colour.
  const [rowKeys, setRowKeys] = useState<string[]>(() =>
    colours.map(() => crypto.randomUUID())
  );
  useEffect(() => {
    setRowKeys((prev) =>
      prev.length === colours.length
        ? prev
        : colours.map((_, i) => prev[i] ?? crypto.randomUUID())
    );
    // Only the length matters; the array is replaced on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colours.length]);

  const toggleSize = (size: string) => {
    const on = used.includes(size);
    const next = colours.map((c) => {
      let stock: IStocksSubForm[] = [...(c.stock || [])];
      if (on) {
        stock = stock.filter((s) => s.size !== size);
      } else {
        if (size === ONE_SIZE) stock = [];
        else stock = stock.filter((s) => s.size !== ONE_SIZE);
        if (!stock.some((s) => s.size === size)) stock.push({ size, stock: 0 });
      }
      const order = sortSizes(stock.map((s) => s.size));
      stock.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size));
      return { ...c, stock };
    });
    setFieldValue("product_colours", next);
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Variants & stock</h2>
          <p className="text-sm text-gray-500">
            Pick the sizes you sell, then set stock per colour.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Track stock"
          className="flex items-center gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
        >
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={values.stock_managed === v}
              onClick={() => setFieldValue("stock_managed", v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                values.stock_managed === v
                  ? "bg-white font-semibold shadow-sm"
                  : "text-primaryGray"
              )}
            >
              {v === "yes" ? "Track stock" : "Don't track"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((size) => {
          const on = used.includes(size);
          return (
            <button
              key={size}
              type="button"
              aria-pressed={on}
              onClick={() => toggleSize(size)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "border-primary bg-primary text-white"
                  : "border-lightGray bg-white text-primary hover:bg-gray-50"
              )}
            >
              {size}
            </button>
          );
        })}
      </div>

      <FieldArray name="product_colours">
        {({ push, remove }) => (
          <>
            {colours.map((colour, index) => (
              <div
                key={rowKeys[index] ?? index}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <ColourImage index={index} colour={colour} />
                  <input
                    type="color"
                    aria-label="Colour"
                    value={colour.colour || "#000000"}
                    onChange={(e) =>
                      setFieldValue(`product_colours[${index}].colour`, e.target.value)
                    }
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-lightGray bg-white p-0.5"
                  />
                  <input
                    aria-label="Colour name"
                    placeholder="Colour name"
                    value={colour.colour_name || ""}
                    onChange={(e) =>
                      setFieldValue(
                        `product_colours[${index}].colour_name`,
                        e.target.value
                      )
                    }
                    className={cn(inputCls, "min-w-[140px] flex-1")}
                  />
                  {managed && (
                    <span className="text-sm text-gray-500">
                      {colourUnits(colour)} units
                    </span>
                  )}
                  {colours.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setRowKeys((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="text-sm text-red-700 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {managed && <StocksSubForm index={index} />}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                push({
                  colour: "#9CA3AF",
                  colour_name: "",
                  image_url: "",
                  stock: used.map((size) => ({ size, stock: 0 })),
                });
                setRowKeys((prev) => [...prev, crypto.randomUUID()]);
              }}
              className="min-h-[38px] self-start rounded-lg border border-dashed border-gray-400 bg-white px-3.5 py-1.5 text-sm font-medium text-primary hover:bg-gray-50"
            >
              + Add colour
            </button>
          </>
        )}
      </FieldArray>
    </section>
  );
};

const initialValues: Pick<IProduct, "stock_managed" | "product_colours"> = {
  stock_managed: "yes",
  product_colours: [
    {
      colour: "#1F2A44",
      colour_name: "",
      image_url: "",
      stock: [
        { size: "S", stock: 0 },
        { size: "M", stock: 0 },
        { size: "L", stock: 0 },
        { size: "XL", stock: 0 },
      ],
    },
  ],
};

export const ProductGalleryWithForm = Object.assign(ProductGallery, {
  initialValues,
});
