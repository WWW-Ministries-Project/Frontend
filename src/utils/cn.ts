import { twMerge } from 'tailwind-merge';

/**
 * Utility to combine and merge Tailwind class strings.
 * Currently uses only `twMerge`, but can easily be extended.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
