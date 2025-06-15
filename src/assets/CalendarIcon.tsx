import { SVGProps } from "react";

export function CalendarIcon({
  fill = "none",
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <div>
      <svg
        width="21"
        height="23"
        viewBox="0 0 21 23"
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path d="M6.12109 1.64648V5.64648" stroke="currentColor" />
        <path d="M14.1211 1.64648V5.64648" stroke="currentColor" />
        <path
          d="M17.1211 3.64648H3.12109C2.01652 3.64648 1.12109 4.54191 1.12109 5.64648V19.6465C1.12109 20.7511 2.01652 21.6465 3.12109 21.6465H17.1211C18.2257 21.6465 19.1211 20.7511 19.1211 19.6465V5.64648C19.1211 4.54191 18.2257 3.64648 17.1211 3.64648Z"
          stroke="currentColor"
        />
        <path d="M1.12109 9.64648H19.1211" stroke="currentColor" />
      </svg>
    </div>
  );
}
