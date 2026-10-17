import type { ReactNode } from "react";

/** Small uppercase heading above a group ("Starting area", "Passengers"). */
export const SectionLabel = ({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) => (
  <h2
    id={id}
    className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-primaryGray"
  >
    {children}
  </h2>
);
