import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import { OrdersPanel } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrdersPanel";
import { MarketFormModal, type MarketModalMode } from "../components/markets/MarketFormModal";
import { EMPTY_STATS, statsByMarket } from "../components/markets/marketStats";
import { StatTile } from "../components/markets/ui";
import { backLink, btnPrimary, btnSecondary, card } from "../components/markets/styles";
import { ProductsPanel } from "../components/Products/ProductsPanel";
import { StatusPill } from "../components/StatusPill";
import {
  formatDate,
  formatMoney,
  getMarketState,
  groupOrderRows,
  marketStatePill,
} from "../utils/marketplaceModel";

type InnerTab = "Products" | "Orders";

export function MarketDetails() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id: encodedId } = useParams();
  const id = decodeQuery(String(encodedId));
  const { canManageCurrentRoute } = useRouteAccess();

  const [tab, setTab] = useState<InnerTab>(
    params.get("tab")?.toLowerCase() === "orders" ? "Orders" : "Products"
  );
  const [modal, setModal] = useState<MarketModalMode | null>(null);

  const { data: marketRes, refetch: refetchMarket } = useFetch(
    api.fetch.fetchMarketById,
    { id }
  );
  const { data: productsRes } = useFetch(api.fetch.fetchProductsByMarket, {
    market_id: id,
  });
  const { data: ordersRes } = useFetch(
    api.fetch.fetchOrdersByMarket,
    { market_id: id },
    false,
    { silent: true }
  );

  const market = marketRes?.data as
    | (IMarket & { event?: { event_name?: string; name?: string } })
    | undefined;
  const eventName = market?.event_name || market?.event?.event_name || market?.event?.name;

  const stats = useMemo(() => {
    if (!ordersRes) return null;
    return statsByMarket(groupOrderRows(ordersRes.data)).get(String(id)) ?? EMPTY_STATS;
  }, [ordersRes, id]);

  const closeModal = useCallback(() => setModal(null), []);
  const addProduct = () => navigate(`/home/market-place/${encodedId}/create-product`);

  const state = market ? getMarketState(market) : null;
  const dash = "—";

  return (
    <PageOutline>
      <div className="flex flex-col gap-4 text-primary">
        <button
          type="button"
          className={backLink}
          onClick={() => navigate("/home/market-place/markets")}
        >
          ← Back to markets
        </button>

        <div
          className={`${card} flex flex-wrap items-start justify-between gap-4 p-6`}
        >
          <div className="flex min-w-0 max-w-[720px] flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold leading-8">
                {market?.name || "Market"}
              </h1>
              {state && <StatusPill status={marketStatePill(state)} />}
            </div>
            {market && (
              <p className="text-sm text-primaryGray">
                {[
                  eventName,
                  `${formatDate(market.start_date)} – ${formatDate(market.end_date)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {market?.description && (
              <p className="text-base text-gray-700">{market.description}</p>
            )}
          </div>
          {canManageCurrentRoute && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSecondary}
                disabled={!market}
                onClick={() => market && setModal({ kind: "edit", market })}
              >
                Edit market
              </button>
              <button type="button" className={btnPrimary} onClick={addProduct}>
                Add product
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <StatTile label="Products" value={productsRes ? productsRes.data.length : dash} />
          <StatTile label="Orders" value={stats ? stats.orders : dash} />
          <StatTile label="Units sold" value={stats ? stats.units : dash} />
          <StatTile label="Revenue" value={stats ? formatMoney(stats.revenue) : dash} />
          <StatTile label="To fulfil" value={stats ? stats.toFulfil : dash} />
        </div>

        <div className="w-fit">
          <TabSelection<InnerTab>
            tabs={["Products", "Orders"]}
            selectedTab={tab}
            onTabSelect={setTab}
          />
        </div>

        {tab === "Products" ? (
          <ProductsPanel
            marketId={id}
            marketName={market?.name}
            products={productsRes ? productsRes.data : null}
            orders={ordersRes ? ordersRes.data : null}
          />
        ) : (
          <OrdersPanel marketId={id} />
        )}
      </div>

      <MarketFormModal mode={modal} onClose={closeModal} onSaved={refetchMarket} />
    </PageOutline>
  );
}
