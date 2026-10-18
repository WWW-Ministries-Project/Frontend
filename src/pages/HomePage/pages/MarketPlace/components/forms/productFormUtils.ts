import { useEffect, useState } from "react";

import type { ProductColour } from "@/utils/api/marketPlace/interface";
import { sortSizes } from "../../utils/marketplaceModel";

export const SIZE_CHOICES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "One size",
];
export const ONE_SIZE = "One size";

/** Object URL for a picked File (revoked on change), or the stored URL. */
export const useImagePreview = (image: ProductColour["image_url"] | undefined) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (image instanceof File) {
      const next = URL.createObjectURL(image);
      setUrl(next);
      return () => URL.revokeObjectURL(next);
    }
    setUrl(typeof image === "string" ? image : "");
    return undefined;
  }, [image]);
  return url;
};

export const usedSizes = (colours: ProductColour[]) =>
  sortSizes(
    Array.from(
      new Set(colours.flatMap((c) => (c.stock || []).map((s) => s.size)))
    )
  );

export const colourUnits = (c: ProductColour) =>
  (c.stock || []).reduce((a, s) => a + (Number(s.stock) || 0), 0);
