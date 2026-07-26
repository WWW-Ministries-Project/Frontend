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
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {announcement.title}
              </h2>
              {announcement.published_at && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(announcement.published_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
