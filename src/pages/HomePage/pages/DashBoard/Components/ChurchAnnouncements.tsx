import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { relativePath } from "@/utils/const";
import AnnouncementViewModal from "@/pages/HomePage/pages/Announcements/Components/AnnouncementViewModal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

export const ChurchAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data } = useFetch(api.fetch.fetchMyAnnouncements);

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      setAnnouncements(data.data);
    }
  }, [data]);

  const recent = announcements.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <MegaphoneIcon className="text-primary" height={24} />
          <h3 className="text-xl font-semibold text-gray-800">
            Church Announcements & News
          </h3>
        </div>
        {recent.length > 0 && (
          <Link
            to={relativePath.member.announcements}
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <MegaphoneIcon className="text-gray-600" height={24} />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No announcements yet
          </h4>
          <p className="text-gray-500">
            Check back soon — any new announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((announcement) => (
            <button
              key={announcement.id}
              type="button"
              onClick={() => setSelected(announcement)}
              className="flex flex-col items-start rounded-lg border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
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
        </div>
      )}

      <AnnouncementViewModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
