import { MegaphoneIcon } from "@heroicons/react/24/outline";

export const ChurchAnnouncements = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <MegaphoneIcon className="text-primary" height={24} />
        <h3 className="text-xl font-semibold text-gray-800">
          Church Announcements & News
        </h3>
      </div>

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
    </div>
  );
};
