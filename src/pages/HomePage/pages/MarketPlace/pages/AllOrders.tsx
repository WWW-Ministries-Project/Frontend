import { useLocation, useSearchParams } from "react-router-dom";

import PageOutline from "@/pages/HomePage/Components/PageOutline";

import { OrdersPanel } from "../components/Orders/OrdersPanel";

/**
 * Admin Orders page (all markets). The initial status tab comes from
 * `location.state.tab` or `?tab=` so Overview links ("To fulfil", "Unpaid")
 * land pre-filtered.
 */
export const AllOrders = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const stateTab = (location.state as { tab?: string } | null)?.tab;
  const initialTab = stateTab || params.get("tab") || undefined;

  return (
    <PageOutline>
      <OrdersPanel
        initialTab={initialTab}
        title="Orders"
        subtitle="Track payments and fulfil member orders"
      />
    </PageOutline>
  );
};
