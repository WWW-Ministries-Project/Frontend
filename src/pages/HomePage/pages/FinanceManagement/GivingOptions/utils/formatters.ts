/**
 * Display helpers shared by the giving contribution surfaces.
 *
 * In their own module rather than exported alongside `ContributionsTable`: a
 * file that exports both a component and plain values breaks Vite's fast
 * refresh (react-refresh/only-export-components), and `lint` fails on warnings.
 */

/** Contribution amounts are stored in minor units, so every display divides by 100. */
export const formatAmount = (minorUnits: number, currency: string): string =>
  `${currency} ${(minorUnits / 100).toFixed(2)}`;

export const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
