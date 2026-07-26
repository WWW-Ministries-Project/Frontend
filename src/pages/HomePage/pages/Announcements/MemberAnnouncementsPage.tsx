import { useEffect, useState } from "react";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import EmptyState from "@/components/EmptyState";
import AnnouncementViewModal from "./Components/AnnouncementViewModal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const MemberAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data, loading } = useFetch(api.fetch.fetchMyAnnouncements);

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setAnnouncements(data.data);
    }
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <MegaphoneIcon className="text-primary" height={24} />
        <h1 className="text-xl font-semibold text-gray-800">Announcements</h1>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((announcement) => (
          <button
            key={announcement.id}
            type="button"
            onClick={() => setSelected(announcement)}
            className="app-card flex flex-col items-start rounded-xl p-4 text-left transition-colors hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">
              {announcement.title}
            </span>
            {announcement.published_at && (
              <span className="mt-1 text-sm text-gray-500">
                {new Date(announcement.published_at).toLocaleDateString()}
              </span>
            )}
          </button>
        ))}

        {!loading && announcements.length === 0 && (
          <EmptyState
            scope="page"
            msg="No announcements yet"
            description="Check back soon — any new announcements will appear here."
          />
        )}
      </div>

      <AnnouncementViewModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default MemberAnnouncementsPage;
