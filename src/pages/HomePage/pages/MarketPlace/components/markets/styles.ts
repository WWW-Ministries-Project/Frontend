/**
 * Class names shared by the admin marketplace screens (markets, market
 * detail, products, product editor). They mirror the Marketplace design
 * spec: 8px radius 40px buttons, 12px radius cards with a #D8DAE5 border.
 */

export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-lightGray bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

export const btnDanger =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export const backLink =
  "self-start text-sm text-primaryGray transition-colors hover:text-primary";

export const card = "rounded-xl border border-lightGray bg-white";

export const inputCls =
  "h-10 w-full rounded-lg border border-lightGray bg-white px-3 text-sm font-normal text-primary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10";

export const selectCls =
  "h-10 rounded-lg border border-lightGray bg-white px-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10";

export const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-primary";

/** Soft background tint for colour-swatch placeholder tiles. */
export const tint = (hex?: string) =>
  `color-mix(in oklch, ${hex || "#D8DAE5"} 26%, rgb(var(--color-background)))`;
