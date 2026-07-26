import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import SermonSeriesCard from "./Components/SermonSeriesCard";
import SermonForm from "./Components/SermonForm";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";
import type { SermonSeries } from "@/utils/api/sermons/interfaces";

const SermonManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SermonSeries | null>(
    null
  );
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, loading, refetch } = useFetch(api.fetch.fetchSermonSeries);
  const { executeDelete, success } = useDelete((query) =>
    api.delete.deleteSermonSeries(Number(query.id))
  );

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setSeries(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Sermon series deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleEdit = (item: SermonSeries) => {
    setSelectedSeries(item);
    setIsFormOpen(true);
  };

  const deleteSeries = async (id: string | number) => {
    executeDelete({ id: Number(id) });
  };

  const togglePublish = async (item: SermonSeries) => {
    setTogglingId(item.id);
    try {
      if (item.status === "PUBLISHED") {
        await api.post.unpublishSermonSeries(item.id);
        showNotification("Sermon series unpublished", "success");
      } else {
        await api.post.publishSermonSeries(item.id);
        showNotification("Sermon series published", "success");
      }
      refetch();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Toggle publish failed", error);
      showNotification(
        "Could not update the sermon series status. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Sermons"
        subtitle="Create and manage sermon series for members"
        btnName="Add sermon series"
        hasFilter
        hasSearch={false}
        screenWidth={window.innerWidth}
        handleClick={() => {
          setSelectedSeries(null);
          setIsFormOpen(true);
        }}
      />

      <div className="flex flex-col gap-4">
        {series.map((item) => (
          <SermonSeriesCard
            key={item.id}
            item={item}
            toggling={togglingId === item.id}
            onEdit={() => handleEdit(item)}
            onTogglePublish={() => togglePublish(item)}
            onDelete={() => {
              showDeleteDialog(
                {
                  name: item.title ?? "Sermon series",
                  id: item.id,
                },
                deleteSeries
              );
            }}
          />
        ))}
        {!loading && series.length === 0 && (
          <EmptyState
            scope="page"
            msg="No sermon series found"
            description="Add your first sermon series to share messages with members."
          />
        )}
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSeries(null);
        }}
      >
        <SermonForm
          series={selectedSeries}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedSeries(null);
          }}
          onSaved={refetch}
        />
      </Modal>
    </PageOutline>
  );
};

export default SermonManager;
