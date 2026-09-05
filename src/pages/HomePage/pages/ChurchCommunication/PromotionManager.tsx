import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import PromotionCard from "./Components/PromotionCard";
import PromotionForm from "./Components/PromotionForm";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";
import type { Promotion } from "@/utils/api/promotions/interfaces";

const PromotionManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const { data, loading, refetch } = useFetch(api.fetch.fetchPromotions);
  const { executeDelete, success } = useDelete((query) =>
    api.delete.deletePromotion(Number(query.id))
  );

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setPromotions(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Promotion deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsFormOpen(true);
  };

  const handleArchive = async (promotion: Promotion) => {
    try {
      await api.post.archivePromotion(promotion.id);
      showNotification("Promotion archived", "success");
      refetch();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Promotion archive failed", error);
      showNotification(
        "Promotion could not be archived. Please try again.",
        "error",
        "Promotion"
      );
    }
  };

  const deletePromotion = async (id: string | number) => {
    executeDelete({ id: Number(id) });
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Promotions"
        subtitle="Banners on the mobile app home screen. Publishing does not notify members."
        btnName="Create promotion"
        hasFilter
        hasSearch={false}
        screenWidth={window.innerWidth}
        handleClick={() => {
          setSelectedPromotion(null);
          setIsFormOpen(true);
        }}
      />

      <div className="flex flex-col gap-4">
        {promotions.map((promotion) => (
          <PromotionCard
            key={promotion.id}
            item={promotion}
            onEdit={() => handleEdit(promotion)}
            onArchive={() => handleArchive(promotion)}
            onDelete={() => {
              showDeleteDialog(
                { name: promotion.title ?? "Promotion", id: promotion.id },
                deletePromotion
              );
            }}
          />
        ))}
        {!loading && promotions.length === 0 && (
          <EmptyState
            scope="page"
            msg="No promotions found"
            description="Create a banner to spotlight an event or campaign on the mobile app."
          />
        )}
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPromotion(null);
        }}
      >
        <PromotionForm
          promotion={selectedPromotion}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedPromotion(null);
          }}
          onSaved={refetch}
        />
      </Modal>
    </PageOutline>
  );
};

export default PromotionManager;
