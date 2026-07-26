import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import AnnouncementCard from "./Components/AnnouncementCard";
import AnnouncementForm from "./Components/AnnouncementForm";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const AnnouncementManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const { data, loading, refetch } = useFetch(api.fetch.fetchAnnouncements);
  const { executeDelete, success } = useDelete((query) =>
    api.delete.deleteAnnouncement(Number(query.id))
  );

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setAnnouncements(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Announcement deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const deleteAnnouncement = async (id: string | number) => {
    executeDelete({ id: Number(id) });
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Announcements"
        subtitle="Create and manage church announcements for members"
        btnName="Create announcement"
        hasFilter
        hasSearch={false}
        screenWidth={window.innerWidth}
        handleClick={() => {
          setSelectedAnnouncement(null);
          setIsFormOpen(true);
        }}
      />

      <div className="flex flex-col gap-4">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            item={announcement}
            onEdit={() => handleEdit(announcement)}
            onDelete={() => {
              showDeleteDialog(
                {
                  name: announcement.title ?? "Announcement",
                  id: announcement.id,
                },
                deleteAnnouncement
              );
            }}
          />
        ))}
        {!loading && announcements.length === 0 && (
          <EmptyState
            scope="page"
            msg="No announcements found"
            description="Create your first announcement to keep members informed."
          />
        )}
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAnnouncement(null);
        }}
      >
        <AnnouncementForm
          announcement={selectedAnnouncement}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAnnouncement(null);
          }}
          onSaved={refetch}
        />
      </Modal>
    </PageOutline>
  );
};

export default AnnouncementManager;
