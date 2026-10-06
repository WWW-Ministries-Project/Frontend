import type { SVGProps } from "react";

/** Heroicons has no car; this matches its 24px outline style (Ionicons
 *  `car-sport-outline` in the design). */
export const CarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M5 16.5H3.75A.75.75 0 0 1 3 15.75V12.9a1.5 1.5 0 0 1 .44-1.06L5.6 9.68a1.5 1.5 0 0 0 .3-.43l1.2-2.55A1.5 1.5 0 0 1 8.46 5.8h7.08a1.5 1.5 0 0 1 1.36.9l1.2 2.55c.07.16.17.3.3.43l2.16 2.16c.28.28.44.66.44 1.06v2.85a.75.75 0 0 1-.75.75H19" />
    <path d="M9 16.5h6" />
    <circle cx="7" cy="16.5" r="2" />
    <circle cx="17" cy="16.5" r="2" />
    <path d="M6 10h12" />
  </svg>
);
