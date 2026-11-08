import { ReactNode } from "react";

/**
 * School of Ministry content wrapper. Navigation is supplied by the global
 * module SubNav (the SoM child routes marked `sideTab`), so this no longer
 * renders its own rail — it only passes the active page through.
 */
export const SomShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-full">{children}</div>
);
