import { useState } from "react";

import { cn } from "@/utils/cn";
import { tint } from "../markets/styles";

interface IProps {
  src?: string;
  hex?: string;
  alt?: string;
  className?: string;
  /** Size of the inner swatch relative to the tile. */
  swatchClassName?: string;
}

/**
 * Product imagery: the uploaded photo when there is one, otherwise a tile
 * tinted with the colour and a rounded swatch in the middle.
 */
export function ProductThumb({ src, hex, alt = "", className, swatchClassName }: IProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
        className
      )}
      style={showImage ? undefined : { background: tint(hex) }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={cn("aspect-square w-[44%] rounded-[22%]", swatchClassName)}
          style={{ background: hex || "#D8DAE5" }}
        />
      )}
    </div>
  );
}
