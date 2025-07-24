import { useEffect, useMemo, useState } from "react";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { api } from "@/utils";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { AddMarketForm } from "./components/forms/AddMarketForm";
import { IMarket } from "@/utils/api/marketPlace/interface";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import EmptyState from "@/components/EmptyState";
import useWindowSize from "@/CustomHooks/useWindowSize";
import TabSelection from "../../Components/reusable/TabSelection";
import { MarketCard } from "./components/cards/MarketCard";
import { encodeQuery } from "@/pages/HomePage/utils";
import { useNavigate } from "react-router-dom";

export function MarketPlace() {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<IMarket | null>(null);
  const TABS = {
    active: "Active",
    upcoming: "Upcoming",
    ended: "Ended",
  };
  const [tab, setTab] = useState<string>(TABS.active);
  const { data: markets, refetch } = useFetch(api.fetch.fetchMarkets);
  const { screenWidth } = useWindowSize();
  const {
    postData,
    data: newMarket,
    loading: isSubmitting,
  } = usePost(api.post.createMarket);
  const {
    updateData,
    data: update_value,
    loading: isUpdating,
  } = usePut(api.put.updateMarket);
  const { executeDelete, success } = useDelete(api.delete.deleteMarket);

  const handleOpenModal = () => {
    setEditData(null);
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  const handleAddMarket = async (market: IMarket) => {
    const { id, event_id, event_name, ...rest } = market;

    if (id) {
      await updateData({ ...rest, id, event_id: +event_id }, { id });
    } else {
      await postData({ ...rest, event_id: +event_id });
    }
  };

  useEffect(() => {
    if (newMarket) {
      showNotification("Market created successfully", "success");
      refetch();
      handleCloseModal();
    }
  }, [newMarket, refetch]);

  useEffect(() => {
    if (update_value) {
      showNotification("Market updated successfully", "success");
      refetch();
      handleCloseModal();
    }
  }, [update_value, refetch]);

  useEffect(() => {
    if (success) {
      showNotification("Market deleted successfully", "success");
      refetch();
    }
  }, [success]);

  const handleEdit = (market: IMarket) => {
    setEditData(market);
    setOpenModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      await executeDelete({ id: id });
    });
  };

  const filteredMarkets = useMemo(() => {
    return markets?.data.filter(
      (market) =>
        getMarketStatus({
          start_date: market.start_date,
          end_date: market.end_date,
        }) === tab.toLowerCase()
    );
  }, [tab, markets?.data]);

  const navigate = useNavigate();

  const openShop = (id: string) => {
    navigate(encodeQuery(id));
  };
  return (
    <PageOutline>
      <HeaderControls
        title="Marketplace Management"
        subtitle="Manage your market here"
        screenWidth={screenWidth}
        btnName="Create market"
        handleClick={handleOpenModal}
      />
      <div className="w-fit">
        <TabSelection
          tabs={["Upcoming", "Active", "Ended"]}
          selectedTab={tab}
          onTabSelect={(tab) => setTab(tab)}
        />
      </div>
      <GridComponent
        columns={[]}
        data={filteredMarkets || []}
        displayedCount={6}
        filter=""
        setFilter={() => {}}
        renderRow={({ original }) => (
          <MarketCard
            key={original.id}
            market={original}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            openMarket={openShop}
          />
        )}
      />
      {markets?.data.length === 0 && <EmptyState msg={"No markets found"} />}

      <Modal open={openModal} onClose={handleCloseModal}>
        <AddMarketForm
          onClose={handleCloseModal}
          editData={editData}
          onSubmit={handleAddMarket}
          loading={isSubmitting || isUpdating}
        />
      </Modal>
    </PageOutline>
  );
}

export const getMarketStatus = (status: {
  start_date: string;
  end_date: string;
}) => {
  const now = new Date().getTime();
  const start = new Date(status.start_date).getTime();
  const end = new Date(status.end_date).getTime();

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "ended";
};
