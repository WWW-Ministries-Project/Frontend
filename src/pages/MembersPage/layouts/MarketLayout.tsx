import type { ReactNode } from "react";

interface IProps {
  children: ReactNode;
}

/**
 * Page frame for the member marketplace. Sub-sections (Shop, My orders) live
 * in the header's "Marketplace" dropdown, so there is no banner or tab bar
 * here — just the design's max width and vertical rhythm. Inline padding
 * comes from the member shell's app-layout-container.
 */
export function MarketLayout({ children }: IProps) {
  return (
    <section className="mx-auto w-full max-w-[1280px] pb-16 pt-6 text-primary">{children}</section>
  );
}
