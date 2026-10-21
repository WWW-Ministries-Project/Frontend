import { cn } from "@/utils/cn";

/* Class names — the WWM design rules (radius 8 controls, 12 cards, 16 list
 * cards; primary #080D2D; borders #D8DAE5; dividers #E5E7EB). */

const buttonBase =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = cn(
  buttonBase,
  "bg-primary px-5 text-white hover:bg-primary/90"
);

export const btnSecondary = cn(
  buttonBase,
  "border border-primary/30 bg-white text-primary hover:bg-primary/5"
);

export const btnGhost = cn(
  buttonBase,
  "bg-transparent text-primary hover:bg-primary/5"
);

export const btnDangerOutline = cn(
  buttonBase,
  "border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10"
);

export const btnDangerGhost = cn(
  buttonBase,
  "bg-transparent px-3 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
);

export const btnDanger = cn(
  buttonBase,
  "bg-red-700 px-5 text-white hover:bg-red-700/90"
);

export const inputClass =
  "h-10 w-full rounded-lg border border-mainGray/35 bg-white px-3 text-sm font-normal text-primary placeholder:text-mainGray focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass =
  "w-full resize-y rounded-lg border border-mainGray/35 bg-white px-3 py-2 text-sm font-normal text-primary placeholder:text-mainGray focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

export const selectClass = cn(inputClass, "pr-8");

/** White list card with the design's card shadow. */
export const listCard =
  "rounded-2xl border border-lightGray bg-white shadow-[0_8px_24px_rgba(8,13,45,0.08)]";

export const sectionTitle = "text-base font-semibold text-primary";

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral";

export const pillTone: Record<PillTone, string> = {
  success:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-400/30 dark:bg-green-400/15 dark:text-green-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/15 dark:text-red-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300",
  neutral: "border-gray-200 bg-gray-100 text-gray-700",
};

export const toneText: Record<PillTone, string> = {
  success: "text-green-700 dark:text-green-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-red-700 dark:text-red-300",
  info: "text-blue-700 dark:text-blue-300",
  neutral: "text-gray-700",
};
