import { cn } from "@/utils/cn";

import { isHex, tintOf } from "./orderUi";

interface ThumbProps {
  imageUrl?: string;
  hex?: string;
  alt?: string;
  className?: string;
}

/** Product image, or a tile tinted with the colour hex when there is none. */
export const ProductThumb = ({ imageUrl, hex, alt = "", className }: ThumbProps) =>
  imageUrl ? (
    <img
      src={imageUrl}
      alt={alt}
      className={cn("h-10 w-10 shrink-0 rounded-lg object-cover", className)}
    />
  ) : (
    <div
      aria-hidden="true"
      className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", className)}
      style={{ background: tintOf(hex) }}
    >
      <span
        className="aspect-square w-[44%] rounded-[22%]"
        style={{ background: isHex(hex) ? hex : "#D8DAE5" }}
      />
    </div>
  );
