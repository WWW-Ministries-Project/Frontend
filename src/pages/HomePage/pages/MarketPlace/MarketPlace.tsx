import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { MarketCard } from "./components/MarketCard";
import { AddMarketForm } from "./components/forms/AddMarketForm";
import { IMarket } from "@/utils/api/marketPlace/interface";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";

export function MarketPlace() {
  const [openModal, setOpenModal] = useState(false);

  const { data: markets, refetch } = useFetch(api.fetch.fetchMarkets);
  const {
    postData,
    data: newMarket,
    loading: isSubmitting,
  } = usePost(api.post.createMarket);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleAddMarket = async (market: IMarket) => {
    const { id, event_id, ...rest } = market;

    try {
      await postData({ ...rest, event_id: +event_id });
    } catch (error) {
      showNotification("Something went wrong", "error");
    }
  };

  useEffect(() => {
    if (newMarket) {
      showNotification("Market created successfully", "success");
      refetch();
      handleCloseModal();
    }
  }, [newMarket, refetch]);

  return (
    <PageOutline>
      <HeaderControls
        title="Marketplace Management"
        subtitle="Manage your market here"
        screenWidth={window.innerWidth}
        btnName="Create market"
        handleClick={handleOpenModal}
      />

      <GridComponent
        columns={[]}
        data={markets?.data || []}
        displayedCount={6}
        filter=""
        setFilter={() => {}}
        renderRow={({ original }) => (
          <MarketCard
            key={original.id}
            market={original}
            handleEdit={() => {}}
            handleDelete={() => {}}
            openMarket={() => {}}
          />
        )}
      />

      <Modal open={openModal} onClose={handleCloseModal}>
        <AddMarketForm
          onClose={handleCloseModal}
          editData={null}
          onSubmit={handleAddMarket}
          loading={isSubmitting}
        />
      </Modal>
    </PageOutline>
  );
}
