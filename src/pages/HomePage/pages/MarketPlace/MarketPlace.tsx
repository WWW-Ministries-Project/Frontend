import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRouteAccess } from "@/context/RouteAccessContext";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { encodeQuery, showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import PageOutline from "../../Components/PageOutline";
import { MarketCard } from "./components/cards/MarketCard";
import { MarketFormModal, type MarketModalMode } from "./components/markets/MarketFormModal";
import { statsByMarket } from "./components/markets/marketStats";
import { PageHeader, PillTabs } from "./components/markets/ui";
import { btnPrimary } from "./components/markets/styles";
import { useProductsByMarkets } from "./components/Products/useProductsByMarkets";
import {
  getMarketState,
  groupOrderRows,
  type MarketState,
} from "./utils/marketplaceModel";

const TABS: MarketState[] = ["Active", "Upcoming", "Ended"];

export function MarketPlace() {
  const navigate = useNavigate();
  const { canManageCurrentRoute, canAdminCurrentRoute } = useRouteAccess();
  const [tab, setTab] = useState<MarketState>("Active");
  const [modal, setModal] = useState<MarketModalMode | null>(null);

  const { data: marketsRes, refetch } = useFetch(api.fetch.fetchMarkets);
  const { data: ordersRes, refetch: refetchOrders } = useFetch(
    api.fetch.fetchAllOrders,
    undefined,
    false,
    { silent: true }
  );
  const markets = marketsRes?.data;
  const { byMarket } = useProductsByMarkets(markets);

  const { executeDelete, success: deleted } = useDelete(api.delete.deleteMarket);
  useEffect(() => {
    if (deleted) {
      showNotification("Market deleted", "success");
      refetch();
    }
  }, [deleted, refetch]);

  const stats = useMemo(
    () => statsByMarket(groupOrderRows(ordersRes?.data)),
    [ordersRes?.data]
  );

  const counts = useMemo(() => {
    const c: Record<MarketState, number> = { Active: 0, Upcoming: 0, Ended: 0 };
    (markets || []).forEach((m) => {
      c[getMarketState(m)] += 1;
    });
    return c;
  }, [markets]);

  const visible = useMemo(
    () => (markets || []).filter((m) => getMarketState(m) === tab),
    [markets, tab]
  );

  const handleSaved = useCallback(() => {
    refetch();
    refetchOrders();
  }, [refetch, refetchOrders]);
  const closeModal = useCallback(() => setModal(null), []);

  const openMarket = (m: IMarket) => navigate(`/home/market-place/${encodeQuery(m.id)}`);

  const handleDelete = (m: IMarket) =>
    showDeleteDialog({ id: m.id, name: m.name }, async () => {
      await executeDelete({ id: m.id });
    });

  return (
    <PageOutline>
      <div className="flex flex-col gap-6 text-primary">
        <PageHeader
          title="Markets"
          subtitle="Event storefronts and their selling windows"
          actions={
            canManageCurrentRoute && (
              <button
                type="button"
                className={btnPrimary}
                onClick={() => setModal({ kind: "create" })}
              >
                Create market
              </button>
            )
          }
        />

        <div className="flex flex-col gap-4">
          <PillTabs
            tabs={TABS.map((t) => ({ label: t, count: counts[t] }))}
            value={tab}
            onChange={setTab}
          />

          {markets && visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-semibold">
                No {tab.toLowerCase()} markets
              </h2>
              <p className="text-primaryGray">
                Create a market to open a storefront for an event.
              </p>
              {canManageCurrentRoute && (
                <button
                  type="button"
                  className={`${btnPrimary} mt-2`}
                  onClick={() => setModal({ kind: "create" })}
                >
                  Create market
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
              {visible.map((m) => {
                const s = stats.get(String(m.id));
                const products = byMarket[String(m.id)];
                return (
                  <MarketCard
                    key={m.id}
                    market={m}
                    products={products?.length}
                    orders={ordersRes ? (s?.orders ?? 0) : undefined}
                    revenue={ordersRes ? (s?.revenue ?? 0) : undefined}
                    canManage={canManageCurrentRoute}
                    canDelete={canAdminCurrentRoute}
                    onOpen={openMarket}
                    onEdit={(market) => setModal({ kind: "edit", market })}
                    onDuplicate={(market) => setModal({ kind: "duplicate", market })}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MarketFormModal mode={modal} onClose={closeModal} onSaved={handleSaved} />
    </PageOutline>
  );
}

/**
 * Lower-case market status kept for existing callers (member storefront).
 * Uses the shared model, so the end date is inclusive.
 */
// eslint-disable-next-line react-refresh/only-export-components -- imported by the member storefront
export const getMarketStatus = (status: {
  start_date: string;
  end_date: string;
}): "upcoming" | "active" | "ended" =>
  getMarketState(status).toLowerCase() as "upcoming" | "active" | "ended";
