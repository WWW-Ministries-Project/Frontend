import { ReactNode } from "react";

/**
 * Shared chrome for the member-facing School of Ministry pages. The horizontal
 * sub-navigation was removed; navigation lives in the header's "School of
 * Ministries" menu. Each page renders its own content (and PageHeader) as
 * children.
 */
export const LearnerShell = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-5">{children}</div>
);
