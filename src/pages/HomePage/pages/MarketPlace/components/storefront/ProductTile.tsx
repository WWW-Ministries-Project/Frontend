import { useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";
import { tint } from "./storefrontModel";

interface IProps {
  /** Swatch hex used for the tinted fallback tile. */
  hex: string;
  imageUrl?: string;
  alt: string;
  /** Size of the fallback swatch block relative to the tile. */
  swatchClassName?: string;
  className?: string;
  /** Caption shown bottom-left on the fallback tile only (not over photos). */
  label?: string;
  labelClassName?: string;
  children?: ReactNode;
}

/**
 * Product image square. Shows the colour's photo when there is one, otherwise
 * the design's colour-tinted tile with a rounded swatch block in the middle.
 */
export function ProductTile({
  hex,
  imageUrl,
  alt,
  swatchClassName = "w-[44%] shadow-[0_14px_28px_rgba(8,13,45,0.18)]",
  className,
  label,
  labelClassName,
  children,
}: IProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && failed !== imageUrl;

  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden",
        className
      )}
      style={{ background: tint(hex) }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(imageUrl || null)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn("aspect-square rounded-[22%]", swatchClassName)}
          style={{ background: hex }}
          aria-hidden="true"
        />
      )}
      {!showImage && label && (
        <span
          className={cn(
            "absolute bottom-2 left-2.5 text-[11px] uppercase tracking-[0.06em] text-primary/60",
            labelClassName
          )}
        >
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
