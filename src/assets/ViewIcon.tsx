import React from "react";

export default function ViewIcon({ fill }: { fill?: string }) {
  return (
    <div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.3866 7.00141C10.3866 8.32141 9.31995 9.38808 7.99995 9.38808C6.67995 9.38808 5.61328 8.32141 5.61328 7.00141C5.61328 5.68141 6.67995 4.61475 7.99995 4.61475C9.31995 4.61475 10.3866 5.68141 10.3866 7.00141Z"
          stroke={fill || "#474D66"}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M7.9999 12.5123C10.3532 12.5123 12.5466 11.1257 14.0732 8.72567C14.6732 7.78567 14.6732 6.20567 14.0732 5.26567C12.5466 2.86567 10.3532 1.479 7.9999 1.479C5.64656 1.479 3.45323 2.86567 1.92656 5.26567C1.32656 6.20567 1.32656 7.78567 1.92656 8.72567C3.45323 11.1257 5.64656 12.5123 7.9999 12.5123Z"
          stroke={fill || "#474D66"}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  );
}
