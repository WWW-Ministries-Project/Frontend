import DOMPurify from "dompurify";
import { Modal } from "@/components/Modal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

interface AnnouncementViewModalProps {
  announcement: Announcement | null;
  onClose: () => void;
}

const AnnouncementViewModal = ({
  announcement,
  onClose,
}: AnnouncementViewModalProps) => {
  return (
    <Modal open={Boolean(announcement)} onClose={onClose}>
      {announcement && (
        <div className="flex flex-col">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {announcement.title}
            </h2>
            {announcement.published_at && (
              <p className="mt-1 text-sm text-gray-500">
                {new Date(announcement.published_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div
            className="ql-editor prose max-w-none px-6 py-4 text-gray-700"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(announcement.content),
            }}
          />
        </div>
      )}
    </Modal>
  );
};

export default AnnouncementViewModal;
