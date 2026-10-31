import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { isGuestPath } from "./storefrontModel";

/**
 * Guest `/out/products` routes render over the landing page's photo
 * background with no member shell, so give them the storefront's page
 * surface and padding. Member routes get theirs from Market.tsx.
 */
export function StorefrontPage({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (!isGuestPath(pathname)) return <>{children}</>;
  return (
    <div className="mx-auto w-full max-w-[1280px] rounded-2xl bg-background px-4 pb-16 pt-6 text-primary tablet:px-8 lg:px-16">
      {children}
    </div>
  );
}
