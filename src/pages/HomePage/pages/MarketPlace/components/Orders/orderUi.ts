/** Shared class sets for the admin marketplace order screens (design tokens). */
export const card = "rounded-xl border border-lightGray bg-white";
export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";
export const btnSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60";
export const btnDanger =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";
export const inputCls =
  "h-10 w-full rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary focus:border-primary focus:outline-none";
export const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-primary";
export const sectionLabel = "text-xs font-semibold uppercase tracking-wider text-gray-600";

export const isHex = (v?: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v || "");

/** Light tint of a colour hex for placeholder tiles. */
export const tintOf = (hex?: string) =>
  isHex(hex) && hex!.length === 7 ? `${hex}1F` : "rgb(var(--color-gray-100))";

/** Pull a readable message out of an API error. */
export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;
