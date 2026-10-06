import type { RideTone } from "../utils/rideHelpers";

/** Class names shared by the ride pages. Teal = find / confirmed / verified,
 *  gold = offer / pending / selected / primary action, coral = declined /
 *  cancel — the design's colour semantics. Brand tokens (`bg-white`,
 *  `text-primary`, `border-lightGray`) follow the app theme on their own;
 *  the tints carry explicit `dark:` variants. */
export const rideCard = "rounded-2xl border border-lightGray bg-white";

export const rideCardHover = "transition-colors hover:bg-lightGray/20";

export const goldCta =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#B67A22] to-[#C4872E] px-5 text-base font-bold text-[#0E1330] shadow-[0_10px_28px_rgba(154,93,26,0.3)] transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

export const quietButton =
  "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-lightGray bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-lightGray/30 disabled:cursor-not-allowed disabled:opacity-50";

export const coralButton =
  "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-400/15 dark:text-rose-300 dark:hover:bg-rose-400/25";

export const toneText: Record<RideTone, string> = {
  teal: "text-teal-700 dark:text-teal-300",
  gold: "text-amber-700 dark:text-amber-300",
  coral: "text-rose-700 dark:text-rose-300",
};

export const toneTint: Record<RideTone, string> = {
  teal: "bg-teal-50 dark:bg-teal-400/15",
  gold: "bg-amber-50 dark:bg-amber-400/15",
  coral: "bg-rose-50 dark:bg-rose-400/15",
};

export const toneBorder: Record<RideTone, string> = {
  teal: "border-teal-200 dark:border-teal-400/30",
  gold: "border-amber-200 dark:border-amber-400/30",
  coral: "border-rose-200 dark:border-rose-400/30",
};

/** A selected chip / radio / row. */
export const selectedRow =
  "border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10";

export const unselectedRow =
  "border-lightGray bg-lightGray/10 hover:bg-lightGray/30";

export const textInput =
  "w-full rounded-2xl border border-lightGray bg-white px-4 py-3 text-sm text-primary placeholder:text-primaryGray focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400/30";
