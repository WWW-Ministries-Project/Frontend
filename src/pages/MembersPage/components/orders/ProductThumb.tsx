import { useState } from "react";

import { cn } from "@/utils/cn";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Light tint of a colour hex for the placeholder tile background. */
const tint = (hex: string) => {
  if (!HEX.test(hex)) return "#F3F4F6";
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  return `${full}26`;
};

interface IProps {
  imageUrl?: string | null;
  colour?: string | null;
  alt?: string;
  /** Tailwind size classes, e.g. "size-14". */
  className?: string;
  /** Quantity badge (top-right), shown when > 0. */
  badge?: number;
}

/**
 * Product image with the design's colour-tinted tile fallback when the
 * product has no image (or it fails to load).
 */
export const ProductThumb = ({
  imageUrl,
  colour,
  alt = "",
  className,
  badge,
}: IProps) => {
  const [failed, setFailed] = useState(false);
  const hex = colour && HEX.test(colour) ? colour : "#D8DAE5";
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div
      className={cn(
        "relative flex size-14 flex-shrink-0 items-center justify-center rounded-lg",
        className
      )}
      style={{ background: showImage ? "#F3F4F6" : tint(hex) }}
    >
      {showImage ? (
        <img
          src={imageUrl || ""}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full rounded-lg object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="aspect-square w-[44%] rounded-[22%]"
          style={{ background: hex }}
        />
      )}
      {badge ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </div>
  );
};
